from __future__ import annotations

import asyncio
from datetime import datetime

from app.db.session import AsyncSessionLocal
from app.models.entities import User, Resume


async def seed():
    async with AsyncSessionLocal() as session:
        # create sample user
        user = User(email="candidate@example.com", full_name="Sample Candidate")
        session.add(user)
        await session.commit()
        await session.refresh(user)

        # create sample resume
        resume = Resume(filename="sample_resume.pdf", original_filename="sample_resume.pdf", file_type="application/pdf", user_id=user.id)
        session.add(resume)
        await session.commit()
        await session.refresh(resume)

        print(f"Seeded user {user.email} and resume {resume.filename}")


if __name__ == '__main__':
    asyncio.run(seed())
