#!/usr/bin/env python3
"""Database verification script for the Research Achievement Management System.

This script verifies that all databases and tables are properly created.
"""

import asyncio
import sys
from typing import List

import asyncpg
import pymongo
from motor.motor_asyncio import AsyncIOMotorClient
from neo4j import GraphDatabase
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

from app.core.config import settings


async def verify_postgresql() -> bool:
    """Verify PostgreSQL database and tables."""
    if not settings.postgres_enabled:
        print("⚠️  PostgreSQL is disabled")
        return True
    
    try:
        print("🔍 Verifying PostgreSQL...")
        
        # Create engine
        engine = create_async_engine(str(settings.postgres_dsn))
        
        async with engine.begin() as conn:
            # Check database connection
            result = await conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            print(f"✅ PostgreSQL connected: {version.split(',')[0]}")
            
            # List all tables
            result = await conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name
            """))
            tables = [row[0] for row in result.fetchall()]
            
            if tables:
                print(f"✅ Found {len(tables)} tables:")
                for table in tables:
                    print(f"   - {table}")
            else:
                print("⚠️  No tables found in database")
        
        await engine.dispose()
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL verification failed: {e}")
        return False


async def verify_mongodb() -> bool:
    """Verify MongoDB database and collections."""
    if not settings.mongo_enabled:
        print("⚠️  MongoDB is disabled")
        return True
    
    try:
        print("🔍 Verifying MongoDB...")
        
        # Connect to MongoDB
        client = AsyncIOMotorClient(str(settings.mongo_dsn))
        db = client[settings.mongo_database]
        
        # Check connection
        server_info = await client.server_info()
        print(f"✅ MongoDB connected: v{server_info['version']}")
        
        # List collections
        collections = await db.list_collection_names()
        
        if collections:
            print(f"✅ Found {len(collections)} collections:")
            for collection in collections:
                count = await db[collection].count_documents({})
                print(f"   - {collection} ({count} documents)")
        else:
            print("⚠️  No collections found in database")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB verification failed: {e}")
        return False


async def verify_neo4j() -> bool:
    """Verify Neo4j database."""
    if not settings.neo4j_enabled:
        print("⚠️  Neo4j is disabled")
        return True
    
    try:
        print("🔍 Verifying Neo4j...")
        
        # Connect to Neo4j
        driver = GraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password)
        )
        
        with driver.session() as session:
            # Check connection and version
            result = session.run("CALL dbms.components() YIELD name, versions RETURN name, versions[0] as version")
            for record in result:
                if record["name"] == "Neo4j Kernel":
                    print(f"✅ Neo4j connected: v{record['version']}")
            
            # Count nodes and relationships
            node_result = session.run("MATCH (n) RETURN count(n) as count")
            node_count = node_result.single()["count"]
            
            rel_result = session.run("MATCH ()-[r]->() RETURN count(r) as count")
            rel_count = rel_result.single()["count"]
            
            print(f"✅ Neo4j database: {node_count} nodes, {rel_count} relationships")
            
            # List node labels
            label_result = session.run("CALL db.labels()")
            labels = [record["label"] for record in label_result]
            if labels:
                print(f"✅ Node labels: {', '.join(labels)}")
            else:
                print("⚠️  No node labels found")
        
        driver.close()
        return True
        
    except Exception as e:
        print(f"❌ Neo4j verification failed: {e}")
        return False


async def verify_redis() -> bool:
    """Verify Redis database."""
    if not settings.redis_enabled:
        print("⚠️  Redis is disabled")
        return True
    
    try:
        print("🔍 Verifying Redis...")
        
        # Create Redis client
        redis_kwargs = {
            "encoding": "utf-8",
            "decode_responses": True,
        }
        
        if settings.redis_ssl:
            redis_kwargs["ssl"] = True
        
        client = redis.Redis.from_url(str(settings.redis_dsn), **redis_kwargs)
        
        # Check connection
        info = await client.info()
        print(f"✅ Redis connected: v{info['redis_version']}")
        
        # Get database info
        db_size = await client.dbsize()
        memory_usage = info.get('used_memory_human', 'N/A')
        
        print(f"✅ Redis database: {db_size} keys, {memory_usage} memory used")
        
        await client.close()
        return True
        
    except Exception as e:
        print(f"❌ Redis verification failed: {e}")
        return False


async def main():
    """Main verification function."""
    print("🔍 Starting database verification for Research Achievement Management API")
    print(f"📍 Environment: {settings.environment}")
    print("=" * 60)
    
    success = True
    
    # Verify all databases
    if not await verify_postgresql():
        success = False
    
    print()
    if not await verify_mongodb():
        success = False
    
    print()
    if not await verify_neo4j():
        success = False
    
    print()
    if not await verify_redis():
        success = False
    
    print("=" * 60)
    
    if success:
        print("🎉 All databases verified successfully!")
    else:
        print("💥 Some databases failed verification")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
