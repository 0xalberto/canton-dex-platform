import os
import asyncpg
from contextlib import asynccontextmanager

# Global pool variable
db_pool = None

async def get_db_pool():
    """Get or create the database connection pool"""
    global db_pool
    if db_pool is None:
        try:
            db_pool = await asyncpg.create_pool(
                user=os.getenv("DB_USER", "cantondex"),
                password=os.getenv("DB_PASSWORD", "cantondex"),
                database=os.getenv("DB_NAME", "cantondex"),
                host=os.getenv("DB_HOST", "localhost"),
                port=os.getenv("DB_PORT", "5432")
            )
            print("✅ Database connection pool created")
        except Exception as e:
            print(f"❌ Failed to create database pool: {e}")
            raise e
    return db_pool

async def get_db():
    """Dependency to get a database connection from the pool"""
    pool = await get_db_pool()
    async with pool.acquire() as conn:
        yield conn
