import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 公开路径（不需要认证）
  const publicPaths = ['/auth', '/login', '/register', '/about']
  
  // 检查是否是公开路径
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
  
  // 静态文件和API路径，直接放行
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.startsWith('/images')) {
    return NextResponse.next()
  }

  // 从cookie中获取token（我们的系统使用localStorage，所以这里主要依赖前端检查）
  const token = request.cookies.get('auth_token')?.value

  // 对于受保护的路径，如果没有cookie token，仍然放行
  // 因为我们的token在localStorage中，由前端的AuthContext和页面级别检查来处理
  // 中间件只是一个额外的保护层
  
  return NextResponse.next()
}

// 配置哪些路径需要运行中间件
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
