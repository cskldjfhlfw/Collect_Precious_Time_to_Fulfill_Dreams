"""限流中间件"""
from typing import Callable
from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.services.rate_limiter import rate_limiter


class RateLimitMiddleware(BaseHTTPMiddleware):
    """API限流中间件"""
    
    # 需要限流的路径前缀
    RATE_LIMITED_PATHS = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/send-code",
        "/api/search",
    ]
    
    # 不需要限流的路径
    EXCLUDED_PATHS = [
        "/health",
        "/docs",
        "/redoc",
        "/openapi.json",
    ]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """处理请求"""
        
        # 检查是否需要限流
        path = request.url.path
        
        # 排除不需要限流的路径
        if any(path.startswith(excluded) for excluded in self.EXCLUDED_PATHS):
            return await call_next(request)
        
        # 获取标识符（IP地址）
        client_ip = request.client.host if request.client else "unknown"
        
        # 对特定路径应用更严格的限流
        if any(path.startswith(limited) for limited in self.RATE_LIMITED_PATHS):
            # 认证接口：10次/分钟
            allowed, remaining, reset_in = await rate_limiter.check_rate_limit(
                identifier=client_ip,
                limit_type="auth",
                max_requests=10,
                window_seconds=60
            )
        else:
            # 普通接口：200次/分钟（按IP）
            allowed, remaining, reset_in = await rate_limiter.check_rate_limit(
                identifier=client_ip,
                limit_type="per_ip",
                max_requests=200,
                window_seconds=60
            )
        
        # 如果超限，返回429错误
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"请求过于频繁，请在 {reset_in} 秒后重试",
                headers={
                    "X-RateLimit-Limit": "10" if "auth" in path else "200",
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(reset_in),
                    "Retry-After": str(reset_in),
                }
            )
        
        # 添加限流信息到响应头
        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = "10" if any(path.startswith(p) for p in self.RATE_LIMITED_PATHS) else "200"
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(reset_in)
        
        return response
