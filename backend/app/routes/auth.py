from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
import jwt
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import timedelta
import os

from authlib.integrations.starlette_client import OAuth

from ..services.auth import create_access_token, create_refresh_token, get_current_user, SECRET_KEY, ALGORITHM
from ..db.session import get_db_session
from ..models.entities import User, RefreshToken
from uuid import uuid4
from datetime import datetime
from fastapi import Security

router = APIRouter()

# OAuth client
oauth = OAuth()
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
if GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET:
    oauth.register(
        name='google',
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
        client_kwargs={'scope': 'openid email profile'},
    )


class TokenRequest(BaseModel):
    email: EmailStr
    full_name: str | None = None


@router.post('/auth/token')
async def token(req: TokenRequest, response: Response, db: AsyncSession = Depends(get_db_session)):
    # passwordless token for demo: create user if not exists
    from sqlalchemy import select

    res = await db.execute(select(User).where(User.email == req.email))
    user = res.scalars().first()
    if not user:
        user = User(email=req.email, full_name=req.full_name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": user.id, "email": user.email}
    access_token = create_access_token(token_data, expires_delta=timedelta(hours=8))
    # issue refresh token as HttpOnly cookie
    jti = str(uuid4())
    refresh_token = create_refresh_token(token_data, jti=jti)
    # persist refresh token record
    expires_at = datetime.utcnow() + timedelta(days=30)
    rt = RefreshToken(id=jti, user_id=user.id, revoked=False, expires_at=expires_at)
    db.add(rt)
    await db.commit()
    secure_cookie = not ("dev" in SECRET_KEY or SECRET_KEY == 'dev-secret-change-me')
    response.set_cookie(key='refresh_token', value=refresh_token, httponly=True, secure=secure_cookie, samesite='lax', path='/')
    return {"access_token": access_token, "token_type": "bearer"}



@router.get('/auth/google/login')
async def google_login(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail='Google OAuth not configured')
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get('/auth/google/callback', name='google_callback')
async def google_callback(request: Request, response: Response, db: AsyncSession = Depends(get_db_session)):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail='Google OAuth not configured')
    token = await oauth.google.authorize_access_token(request)
    # parse id token to get user claims
    try:
        userinfo = await oauth.google.parse_id_token(request, token)
    except Exception:
        # fallback to userinfo endpoint
        userinfo = await oauth.google.userinfo(request)

    email = userinfo.get('email')
    full_name = userinfo.get('name')
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail='No email in Google profile')

    from sqlalchemy import select

    res = await db.execute(select(User).where(User.email == email))
    user = res.scalars().first()
    if not user:
        user = User(email=email, full_name=full_name)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": user.id, "email": user.email}
    access_token = create_access_token(token_data, expires_delta=timedelta(hours=8))
    # persist refresh token
    jti = str(uuid4())
    refresh_token = create_refresh_token(token_data, jti=jti)
    expires_at = datetime.utcnow() + timedelta(days=30)
    rt = RefreshToken(id=jti, user_id=user.id, revoked=False, expires_at=expires_at)
    db.add(rt)
    await db.commit()

    secure_cookie = not ("dev" in SECRET_KEY or SECRET_KEY == 'dev-secret-change-me')
    response.set_cookie(key='refresh_token', value=refresh_token, httponly=True, secure=secure_cookie, samesite='lax', path='/')

    # redirect back to frontend
    frontend = os.getenv('FRONTEND_URL', 'http://localhost:5173')
    return response.redirect(frontend)


# Admin endpoints for managing refresh tokens
def require_admin(current=Depends(get_current_user)):
    if not current or getattr(current, 'role', None) != 'admin':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Admin privileges required')
    return current


@router.get('/admin/refresh-tokens')
async def list_refresh_tokens(limit: int = 100, offset: int = 0, db: AsyncSession = Depends(get_db_session), _=Depends(require_admin)):
    from sqlalchemy import select, func
    res = await db.execute(select(RefreshToken).order_by(RefreshToken.created_at.desc()).limit(limit).offset(offset))
    items = res.scalars().all()
    cnt = await db.execute(select(func.count()).select_from(RefreshToken))
    total = cnt.scalar_one()
    return {
        "tokens": [
            {"id": it.id, "user_id": it.user_id, "revoked": bool(it.revoked), "expires_at": it.expires_at.isoformat() if it.expires_at else None}
            for it in items
        ],
        "total": int(total),
    }


@router.post('/admin/refresh-tokens/{token_id}/revoke')
async def revoke_refresh_token(token_id: str, db: AsyncSession = Depends(get_db_session), current=Depends(require_admin)):
    from sqlalchemy import update, select
    res = await db.execute(select(RefreshToken).where(RefreshToken.id == token_id))
    rt = res.scalars().first()
    if not rt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Token not found')
    await db.execute(update(RefreshToken).where(RefreshToken.id == token_id).values(revoked=True))
    # audit log
    from ..models.entities import RefreshTokenAudit
    audit = RefreshTokenAudit(action='revoke', actor_user_id=current.id, token_id=token_id, details=f'Revoked by admin {current.email}')
    db.add(audit)
    await db.commit()
    return {"status": "revoked", "id": token_id}



@router.post('/auth/refresh')
async def refresh(request: Request, response: Response, db: AsyncSession = Depends(get_db_session)):
    refresh_token = request.cookies.get('refresh_token')
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Missing refresh token')
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get('type') != 'refresh':
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token')
        jti = payload.get('jti')
        email = payload.get('email')
        if not email or not jti:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid refresh token payload')
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token expired')
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate refresh token')

    from sqlalchemy import select, update

    res = await db.execute(select(User).where(User.email == email))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')

    # verify refresh token record exists and not revoked
    res2 = await db.execute(select(RefreshToken).where(RefreshToken.id == jti))
    rt_obj = res2.scalars().first()
    if not rt_obj or rt_obj.revoked:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Refresh token revoked or not found')
    # revoke old token
    await db.execute(update(RefreshToken).where(RefreshToken.id == jti).values(revoked=True))
    await db.commit()

    token_data = {"sub": user.id, "email": user.email}
    access_token = create_access_token(token_data, expires_delta=timedelta(hours=8))
    # rotate refresh token
    new_jti = str(uuid4())
    new_refresh = create_refresh_token(token_data, jti=new_jti)
    expires_at = datetime.utcnow() + timedelta(days=30)
    new_rt = RefreshToken(id=new_jti, user_id=user.id, revoked=False, expires_at=expires_at)
    db.add(new_rt)
    await db.commit()
    secure_cookie = not ("dev" in SECRET_KEY or SECRET_KEY == 'dev-secret-change-me')
    response.set_cookie(key='refresh_token', value=new_refresh, httponly=True, secure=secure_cookie, samesite='lax', path='/')
    return {"access_token": access_token, "token_type": "bearer"}


@router.post('/auth/logout')
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db_session)):
    # revoke refresh token if present
    refresh_token = request.cookies.get('refresh_token')
    if refresh_token:
        try:
            payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
            jti = payload.get('jti')
            if jti:
                from sqlalchemy import update
                await db.execute(update(RefreshToken).where(RefreshToken.id == jti).values(revoked=True))
                await db.commit()
        except Exception:
            pass
    response.delete_cookie('refresh_token', path='/')
    return {"status": "ok"}


@router.get('/auth/me')
async def me(current=Depends(get_current_user)):
    return {"id": current.id, "email": current.email, "full_name": current.full_name, "role": current.role}
