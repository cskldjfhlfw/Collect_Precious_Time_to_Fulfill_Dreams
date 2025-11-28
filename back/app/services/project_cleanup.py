"""
项目清理服务
负责在系统关闭时清理所有运行中的项目进程
"""

import logging
import psutil
from typing import List
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import get_session
from app.models.tables import ProjectStartupRequest

logger = logging.getLogger(__name__)


class ProjectCleanupService:
    """项目清理服务"""
    
    def __init__(self):
        self.logger = logger
    
    async def cleanup_all_running_projects(self) -> List[dict]:
        """清理所有运行中的项目进程"""
        cleanup_results = []
        
        try:
            # 获取数据库会话
            async for db in get_session():
                # 查询所有运行中的启动请求
                stmt = select(ProjectStartupRequest).where(
                    ProjectStartupRequest.is_running == True,
                    ProjectStartupRequest.status == "approved"
                )
                
                result = await db.execute(stmt)
                running_startups = result.scalars().all()
                
                self.logger.info(f"发现 {len(running_startups)} 个运行中的项目")
                
                for startup_request in running_startups:
                    cleanup_result = await self._cleanup_single_project(db, startup_request)
                    cleanup_results.append(cleanup_result)
                
                await db.commit()
                break  # 只需要一个数据库会话
                
        except Exception as e:
            self.logger.error(f"清理项目时发生错误: {str(e)}")
            cleanup_results.append({
                "project_id": "unknown",
                "success": False,
                "error": str(e)
            })
        
        return cleanup_results
    
    async def _cleanup_single_project(self, db: AsyncSession, startup_request: ProjectStartupRequest) -> dict:
        """清理单个项目"""
        project_id = str(startup_request.project_id)
        stopped_processes = []
        
        try:
            # 如果有进程ID，尝试停止进程
            if startup_request.process_id:
                try:
                    # 检查进程是否存在
                    if psutil.pid_exists(startup_request.process_id):
                        process = psutil.Process(startup_request.process_id)
                        
                        # 获取子进程
                        try:
                            children = process.children(recursive=True)
                        except psutil.NoSuchProcess:
                            children = []
                        
                        # 停止所有子进程
                        for child in children:
                            try:
                                child.terminate()
                                stopped_processes.append(child.pid)
                                self.logger.info(f"终止子进程: {child.pid}")
                            except psutil.NoSuchProcess:
                                pass
                            except Exception as e:
                                self.logger.warning(f"终止子进程 {child.pid} 失败: {str(e)}")
                        
                        # 停止主进程
                        try:
                            process.terminate()
                            stopped_processes.append(startup_request.process_id)
                            self.logger.info(f"终止主进程: {startup_request.process_id}")
                            
                            # 等待进程结束
                            try:
                                process.wait(timeout=3)
                            except psutil.TimeoutExpired:
                                # 如果进程没有优雅关闭，强制杀死
                                process.kill()
                                self.logger.warning(f"强制杀死进程: {startup_request.process_id}")
                                for child in children:
                                    try:
                                        child.kill()
                                    except psutil.NoSuchProcess:
                                        pass
                        except psutil.NoSuchProcess:
                            self.logger.info(f"进程 {startup_request.process_id} 已不存在")
                        
                    else:
                        self.logger.info(f"进程 {startup_request.process_id} 已不存在")
                except Exception as e:
                    self.logger.error(f"停止进程 {startup_request.process_id} 时出错: {str(e)}")
            
            # 更新数据库记录
            now = datetime.now(timezone.utc)
            update_stmt = update(ProjectStartupRequest).where(
                ProjectStartupRequest.id == startup_request.id
            ).values(
                is_running=False,
                status="stopped",
                updated_at=now
            )
            
            await db.execute(update_stmt)
            
            return {
                "project_id": project_id,
                "startup_id": str(startup_request.id),
                "success": True,
                "stopped_processes": stopped_processes,
                "process_count": len(stopped_processes)
            }
            
        except Exception as e:
            self.logger.error(f"清理项目 {project_id} 时发生错误: {str(e)}")
            return {
                "project_id": project_id,
                "startup_id": str(startup_request.id) if startup_request else "unknown",
                "success": False,
                "error": str(e)
            }


# 全局清理服务实例
project_cleanup_service = ProjectCleanupService()
