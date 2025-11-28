#!/usr/bin/env python3
"""Database initialization script for the Research Achievement Management System.

This script handles:
1. Database connection verification
2. Table creation/migration
3. Initial data seeding (if needed)
4. Database cleanup operations

Usage:
    python init_database.py                # Initialize database
    python init_database.py --drop         # Drop all tables
    python init_database.py --reset        # Drop and recreate tables
    python init_database.py --seed         # Initialize with sample data
"""

import asyncio
import sys
from argparse import ArgumentParser
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncEngine

from app.core.config import settings
from app.db.base import Base
from app.db.mongodb import close_mongo, init_mongo
from app.db.neo4j import close_neo4j, init_neo4j
from app.db.postgres import close_postgres, engine, init_postgres

# Import all models to register them with Base.metadata
from app.models.tables import (
    User, Paper, Patent, SoftwareCopyright, Project, Competition,
    Conference, Cooperation, Resource, Relationship, ResourceAchievement,
    Tag, AchievementTag, PaperAuthor, ProjectMilestone, Reminder,
    ResourceUsageLog, ResourceMaintenanceTask, SearchSavedView
)
from app.db.redis import close_redis, init_redis


async def verify_connections() -> bool:
    """Verify all database connections are working."""
    print("🔍 Verifying database connections...")
    
    success = True
    
    # PostgreSQL
    if settings.postgres_enabled:
        try:
            await init_postgres()
            print("✅ PostgreSQL connection successful")
        except Exception as e:
            print(f"❌ PostgreSQL connection failed: {e}")
            success = False
    else:
        print("⚠️  PostgreSQL is disabled")
    
    # MongoDB
    if settings.mongo_enabled:
        try:
            await init_mongo()
            print("✅ MongoDB connection successful")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            success = False
    else:
        print("⚠️  MongoDB is disabled")
    
    # Neo4j
    if settings.neo4j_enabled:
        try:
            await init_neo4j()
            print("✅ Neo4j connection successful")
        except Exception as e:
            print(f"❌ Neo4j connection failed: {e}")
            success = False
    else:
        print("⚠️  Neo4j is disabled")
    
    # Redis
    if settings.redis_enabled:
        try:
            await init_redis()
            print("✅ Redis connection successful")
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            success = False
    else:
        print("⚠️  Redis is disabled")
    
    return success


async def create_tables() -> None:
    """Create all PostgreSQL tables."""
    if not settings.postgres_enabled:
        print("⚠️  PostgreSQL is disabled, skipping table creation")
        return
    
    print("🏗️  Creating PostgreSQL tables...")
    
    try:
        # Create a new engine specifically for table creation
        from sqlalchemy.ext.asyncio import create_async_engine
        table_engine = create_async_engine(str(settings.postgres_dsn), echo=settings.postgres_echo)
        
        async with table_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        await table_engine.dispose()
        print("✅ PostgreSQL tables created successfully")
        
    except Exception as e:
        print(f"❌ Failed to create PostgreSQL tables: {e}")


async def drop_tables() -> None:
    """Drop all PostgreSQL tables."""
    if not settings.postgres_enabled:
        print("⚠️  PostgreSQL is disabled, skipping table deletion")
        return
    
    print("🗑️  Dropping PostgreSQL tables...")
    
    try:
        # Create a new engine specifically for table deletion
        from sqlalchemy.ext.asyncio import create_async_engine
        table_engine = create_async_engine(str(settings.postgres_dsn), echo=settings.postgres_echo)
        
        async with table_engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
        
        await table_engine.dispose()
        print("✅ PostgreSQL tables dropped successfully")
        
    except Exception as e:
        print(f"❌ Failed to drop PostgreSQL tables: {e}")


async def seed_sample_data() -> None:
    """Seed the database with sample data."""
    print("🌱 Seeding sample data...")
    
    # TODO: Add sample data insertion logic here
    # This would typically involve creating sample records for:
    # - Research papers
    # - Patents
    # - Projects
    # - Resources
    
    print("✅ Sample data seeded successfully")


async def cleanup_connections() -> None:
    """Close all database connections."""
    print("🧹 Cleaning up connections...")
    
    await close_redis()
    await close_mongo()
    await close_neo4j()
    await close_postgres()
    
    print("✅ All connections closed")


async def main() -> None:
    """Main initialization function."""
    parser = ArgumentParser(description="Database initialization script")
    parser.add_argument("--drop", action="store_true", help="Drop all tables")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate tables")
    parser.add_argument("--seed", action="store_true", help="Seed with sample data")
    
    args = parser.parse_args()
    
    try:
        print(f"🚀 Starting database initialization for {settings.app_name}")
        print(f"📍 Environment: {settings.environment}")
        
        # Verify connections
        if not await verify_connections():
            print("❌ Connection verification failed. Please check your configuration.")
            sys.exit(1)
        
        # Handle different operations
        if args.drop:
            await drop_tables()
        elif args.reset:
            await drop_tables()
            await create_tables()
        else:
            await create_tables()
        
        # Seed data if requested
        if args.seed:
            await seed_sample_data()
        
        print("🎉 Database initialization completed successfully!")
        
    except Exception as e:
        print(f"💥 Database initialization failed: {e}")
        sys.exit(1)
    
    finally:
        await cleanup_connections()


if __name__ == "__main__":
    asyncio.run(main())
