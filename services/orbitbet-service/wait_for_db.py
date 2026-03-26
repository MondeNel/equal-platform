#!/usr/bin/env python3
"""
Database readiness check script.
Waits for PostgreSQL to be ready before starting the application.
"""
import asyncio
import asyncpg
import os
import sys
import time
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "ORBITBET_DB_URL",
    "postgresql+asyncpg://equal:equal2026@orbitbet-db:5432/orbitbet_db"
)

async def check_db():
    """Check if database is ready."""
    # Extract connection parameters from URL
    # Format: postgresql+asyncpg://user:pass@host:port/dbname
    url_parts = DATABASE_URL.replace("postgresql+asyncpg://", "").split("@")
    auth = url_parts[0].split(":")
    host_port_db = url_parts[1].split("/")
    host_port = host_port_db[0].split(":")
    
    user = auth[0]
    password = auth[1] if len(auth) > 1 else ""
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 5432
    database = host_port_db[1]
    
    max_retries = 10
    retry_delay = 2
    
    for attempt in range(1, max_retries + 1):
        try:
            conn = await asyncpg.connect(
                user=user,
                password=password,
                host=host,
                port=port,
                database=database
            )
            await conn.close()
            logger.info(f"✅ Database is ready (attempt {attempt})")
            return True
        except Exception as e:
            logger.warning(f"Database not ready (attempt {attempt}/{max_retries}): {e}")
            if attempt < max_retries:
                await asyncio.sleep(retry_delay)
            else:
                logger.error("❌ Database failed to become ready")
                return False

async def main():
    """Main entry point."""
    if await check_db():
        # Start the application
        logger.info("Starting OrbitBet service...")
        import uvicorn
        uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        logger.error("Cannot start service - database not available")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())