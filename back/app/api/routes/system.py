from typing import Any, List
from datetime import datetime, timedelta
import psutil
import time

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.postgres import get_session
from app.db import neo4j, mongodb, redis
from app.core.config import settings

router = APIRouter(prefix="/system", tags=["System"])


@router.get("/health")
async def get_system_health(
    db: AsyncSession = Depends(get_session),
) -> Any:
    """获取系统健康状态监控"""
    
    services = []
    
    # 1. 数据库连接健康检查
    try:
        await db.execute(text("SELECT 1"))
        db_health = 100
        db_status = "正常"
    except Exception as e:
        db_health = 0
        db_status = "错误"
    
    services.append({
        "name": "数据库连接",
        "status": db_status,
        "value": db_health
    })
    
    # 2. API响应性能检查（通过响应时间计算）
    start_time = time.time()
    try:
        await db.execute(text("SELECT 1"))
        response_time = (time.time() - start_time) * 1000  # 转换为毫秒
        
        # 根据响应时间计算健康度
        if response_time < 50:
            api_health = 100
            api_status = "正常"
        elif response_time < 100:
            api_health = 95
            api_status = "正常"
        elif response_time < 200:
            api_health = 85
            api_status = "警告"
        else:
            api_health = 70
            api_status = "警告"
    except Exception:
        api_health = 0
        api_status = "错误"
    
    services.append({
        "name": "API响应",
        "status": api_status,
        "value": api_health
    })
    
    # 3. 文件存储检查（基于剩余空间百分比）
    try:
        disk_usage = psutil.disk_usage('/')
        # 使用剩余空间百分比作为健康度（磁盘越空，健康度越高）
        free_percent = 100 - disk_usage.percent
        
        # 健康度评估：剩余空间越多越好
        if free_percent >= 40:  # 剩余40%以上
            storage_health = 100
            storage_status = "正常"
        elif free_percent >= 20:  # 剩余20-40%
            # 线性映射到85-100
            storage_health = 85 + int((free_percent - 20) * 0.75)
            storage_status = "正常"
        elif free_percent >= 10:  # 剩余10-20%
            # 线性映射到70-85
            storage_health = 70 + int((free_percent - 10) * 1.5)
            storage_status = "警告"
        else:  # 剩余不足10%
            # 线性映射到0-70
            storage_health = max(0, int(free_percent * 7))
            storage_status = "错误"
    except Exception:
        storage_health = 0
        storage_status = "未知"
    
    services.append({
        "name": "文件存储",
        "status": storage_status,
        "value": storage_health
    })
    
    # 4. 搜索服务检查（Neo4j/Elasticsearch）
    search_health = 100
    search_status = "正常"
    
    if settings.neo4j_enabled and neo4j.driver:
        try:
            async with neo4j.driver.session() as session:
                await session.run("RETURN 1")
            search_health = 100
            search_status = "正常"
        except Exception:
            search_health = 60
            search_status = "警告"
    else:
        # 如果Neo4j未启用，默认显示较低但可用的状态
        search_health = 85
        search_status = "警告"
    
    services.append({
        "name": "搜索服务",
        "status": search_status,
        "value": search_health
    })
    
    return {
        "services": services,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/performance")
async def get_system_performance() -> Any:
    """获取系统性能指标"""
    
    try:
        # CPU使用率
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # 内存使用率
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        
        # 磁盘使用率
        disk = psutil.disk_usage('/')
        disk_percent = disk.percent
        
        return {
            "cpu": {
                "usage": cpu_percent,
                "status": "normal" if cpu_percent < 80 else "warning"
            },
            "memory": {
                "usage": memory_percent,
                "total": memory.total,
                "available": memory.available,
                "status": "normal" if memory_percent < 80 else "warning"
            },
            "disk": {
                "usage": disk_percent,
                "total": disk.total,
                "free": disk.free,
                "status": "normal" if disk_percent < 80 else "warning"
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "cpu": {"usage": 0, "status": "unknown"},
            "memory": {"usage": 0, "status": "unknown"},
            "disk": {"usage": 0, "status": "unknown"}
        }
