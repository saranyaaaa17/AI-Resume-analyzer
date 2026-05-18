import os
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

import jwt
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models.entities import User

SECRET_KEY = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
ALGORITHM = 'HS256'
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
REFRESH_TOKEN_EXPIRE_DAYS = int(os.environ.get('REFRESH_TOKEN_EXPIRE_DAYS', '30'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/auth/token')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict, jti: str | None = None, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    # mark token as refresh for easier validation and include jti
    to_encode.update({'type': 'refresh'})
    if jti is None:
        jti = str(uuid4())
    to_encode.update({'jti': jti})
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({'exp': expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db_session)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('sub')
        email = payload.get('email')
        if user_id is None and email is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token payload')
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token expired')
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Could not validate credentials')

    # query by email
    if email:
        from sqlalchemy import select

        res = await db.execute(select(User).where(User.email == email))
        user = res.scalars().first()
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')
        return user
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')


async def optional_current_user(authorization: str | None = Header(None), db: AsyncSession = Depends(get_db_session)) -> User | None:
    if authorization is None:
        return None
    token = authorization.split('Bearer ')[-1] if authorization.lower().startswith('bearer ') else authorization
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get('email')
        if not email:
            return None
    except Exception:
        return None

    from sqlalchemy import select

    res = await db.execute(select(User).where(User.email == email))
    user = res.scalars().first()
    return user
