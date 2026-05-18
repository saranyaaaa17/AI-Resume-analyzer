from __future__ import annotations

import asyncio

from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.models.entities import User


async def seed_admin(email: str = 'admin@example.com', full_name: str = 'Admin User'):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()

        if not user:
          user = User(email=email, full_name=full_name, role='admin')
          session.add(user)
        else:
          user.role = 'admin'
          if full_name and not user.full_name:
              user.full_name = full_name

        await session.commit()
        await session.refresh(user)
        print(f'Seeded admin user {user.email} with role {user.role}')


if __name__ == '__main__':
    asyncio.run(seed_admin())