#!/usr/bin/env python3
"""Database creation script for the Research Achievement Management System.

This script creates the required databases if they don't exist:
- PostgreSQL: research
- MongoDB: research
- Neo4j: research (default database)
"""

import asyncio
import sys
from typing import Optional

import asyncpg
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
from neo4j import GraphDatabase

from app.core.config import settings


async def create_postgresql_database() -> bool:
    """Create PostgreSQL database if it doesn't exist."""
    if not settings.postgres_enabled:
        print("⚠️  PostgreSQL is disabled, skipping database creation")
        return True
    
    try:
        # Parse DSN to get connection details
        dsn_str = str(settings.postgres_dsn)
        # Convert SQLAlchemy DSN to standard PostgreSQL DSN
        if dsn_str.startswith("postgresql+asyncpg://"):
            dsn_str = dsn_str.replace("postgresql+asyncpg://", "postgresql://")
        
        # Extract database name from DSN
        if "/research" in dsn_str:
            # Connect to postgres database to create research database
            admin_dsn = dsn_str.replace("/research", "/postgres")
            
            print("🔍 Checking PostgreSQL database 'research'...")
            
            # Connect to postgres database
            conn = await asyncpg.connect(admin_dsn)
            
            # Check if database exists
            result = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = 'research'"
            )
            
            if result:
                print("✅ PostgreSQL database 'research' already exists")
            else:
                print("🏗️  Creating PostgreSQL database 'research'...")
                await conn.execute("CREATE DATABASE research")
                print("✅ PostgreSQL database 'research' created successfully")
            
            await conn.close()
            return True
            
    except Exception as e:
        print(f"❌ Failed to create PostgreSQL database: {e}")
        return False


def create_mongodb_database() -> bool:
    """Create MongoDB database if it doesn't exist."""
    if not settings.mongo_enabled:
        print("⚠️  MongoDB is disabled, skipping database creation")
        return True
    
    try:
        print("🔍 Checking MongoDB database 'research'...")
        
        # Connect to MongoDB
        client = pymongo.MongoClient(str(settings.mongo_dsn))
        
        # List existing databases
        db_names = client.list_database_names()
        
        if "research" in db_names:
            print("✅ MongoDB database 'research' already exists")
        else:
            print("🏗️  Creating MongoDB database 'research'...")
            # Create database by creating a collection
            db = client["research"]
            db.create_collection("_init")
            # Remove the temporary collection
            db.drop_collection("_init")
            print("✅ MongoDB database 'research' created successfully")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ Failed to create MongoDB database: {e}")
        return False


def create_neo4j_database() -> bool:
    """Check Neo4j database (uses default database)."""
    if not settings.neo4j_enabled:
        print("⚠️  Neo4j is disabled, skipping database check")
        return True
    
    try:
        print("🔍 Checking Neo4j connection...")
        
        # Connect to Neo4j
        driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password)
        )
        
        # Test connection
        with driver.session() as session:
            result = session.run("RETURN 'Neo4j is ready' as status")
            status = result.single()["status"]
            print(f"✅ Neo4j database ready: {status}")
        
        driver.close()
        return True
        
    except Exception as e:
        print(f"❌ Failed to connect to Neo4j: {e}")
        return False


async def main():
    """Main function to create all databases."""
    print("🚀 Starting database creation for Research Achievement Management API")
    print(f"📍 Environment: {settings.environment}")
    
    success = True
    
    # Create PostgreSQL database
    if not await create_postgresql_database():
        success = False
    
    # Create MongoDB database
    if not create_mongodb_database():
        success = False
    
    # Check Neo4j database
    if not create_neo4j_database():
        success = False
    
    if success:
        print("🎉 All databases are ready!")
    else:
        print("💥 Some databases failed to initialize")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
