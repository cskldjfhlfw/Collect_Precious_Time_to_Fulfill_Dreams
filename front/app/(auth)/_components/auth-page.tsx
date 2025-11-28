"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Canvas, useFrame } from "@react-three/fiber"
import { Grid, OrbitControls } from "@react-three/drei"
import * as THREE from "three"
import { useAuth } from "@/contexts/auth-context"
import { authApi } from "@/lib/api/auth"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import styles from "./auth-page.module.css"

type AuthMode = "login" | "register" | null

const LOGIN_PATH = "/login"
const REGISTER_PATH = "/register"
const AUTH_BASE_PATH = "/auth"

const resolveModeFromPath = (pathname: string): AuthMode => {
  if (pathname === LOGIN_PATH) return "login"
  if (pathname === REGISTER_PATH) return "register"
  if (pathname === AUTH_BASE_PATH) return null
  return null
}

type AuthPageProps = {
  initialMode: AuthMode
}

function SpinningLogo() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      <mesh position={[-0.5, -0.5, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </group>
  )
}

type AnimatedBoxProps = {
  initialPosition: [number, number, number]
}

function AnimatedBox({ initialPosition }: AnimatedBoxProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [targetPosition, setTargetPosition] = useState(new THREE.Vector3(...initialPosition))
  const currentPosition = useRef(new THREE.Vector3(...initialPosition))

  useEffect(() => {
    const directions: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]

    const interval = setInterval(() => {
      const randomDirection = directions[Math.floor(Math.random() * directions.length)]
      const newPosition = new THREE.Vector3(
        currentPosition.current.x + randomDirection[0] * 3,
        0.5,
        currentPosition.current.z + randomDirection[1] * 3,
      )

      newPosition.x = Math.max(-15, Math.min(15, newPosition.x))
      newPosition.z = Math.max(-15, Math.min(15, newPosition.z))
      setTargetPosition(newPosition)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useFrame(() => {
    if (meshRef.current) {
      currentPosition.current.lerp(targetPosition, 0.1)
      meshRef.current.position.copy(currentPosition.current)
    }
  })

  return (
    <mesh ref={meshRef} position={initialPosition}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
      <lineSegments>
        <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1, 1, 1)]} />
        <lineBasicMaterial attach="material" color="#000000" />
      </lineSegments>
    </mesh>
  )
}

type AuthOverlayProps = {
  mode: NonNullable<AuthMode>
  onClose: () => void
  onSwitch: (mode: Exclude<AuthMode, null>) => void
}

const AuthOverlay = ({ mode, onClose, onSwitch }: AuthOverlayProps) => {
  const isLogin = mode === "login"
  const { login, register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [sendingCode, setSendingCode] = useState(false)

  const titles = useMemo(
    () =>
      isLogin
        ? {
            heading: "欢迎回来",
            description: "登录您的账户以继续探索科研成果",
            submit: "登录",
            switchHint: "还没有账户？",
            switchLabel: "注册",
          }
        : {
            heading: "加入我们",
            description: "创建一个新账户，发现更多灵感与合作机会",
            submit: "注册",
            switchHint: "已经有账户？",
            switchLabel: "登录",
          },
    [isLogin],
  )

  const handleSendCode = useCallback(async (email: string) => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址')
      return
    }
    
    try {
      setSendingCode(true)
      setError(null)
      
      const response = await fetch('http://localhost:8000/api/auth/send-code?for_register=true', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || '发送验证码失败')
      }
      
      setCodeSent(true)
      setCountdown(60)
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '发送验证码失败')
    } finally {
      setSendingCode(false)
    }
  }, [])

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    const usernameOrEmail = formData.get('username_or_email') as string
    const password = formData.get('password') as string

    try {
      if (isLogin) {
        await login({ username_or_email: usernameOrEmail, password })
      } else {
        const username = formData.get('username') as string
        const name = formData.get('name') as string
        const email = formData.get('email') as string
        const code = formData.get('code') as string
        const confirm = formData.get('confirm') as string

        if (!code || code.length !== 6) {
          setError('请输入6位验证码')
          return
        }

        if (password !== confirm) {
          setError('两次输入的密码不一致')
          return
        }

        // 使用验证码注册
        const response = await authApi.registerWithCode({
          username,
          email,
          code,
          password,
          name
        })
        
        // 保存token和用户信息
        localStorage.setItem('auth_token', response.access_token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
        window.location.href = '/papers'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }, [isLogin, login])

  return (
    <div className={styles.authOverlay} role="dialog" aria-modal="true">
      <div className={styles.authContainer}>
        <button type="button" className={styles.authClose} aria-label="关闭弹窗" onClick={onClose}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className={styles.authCard}>
          <div className={styles.authIllustration} aria-hidden="true">
            <img src="/images/login-bg2.png" alt="" width={480} height={520} loading="lazy" />
          </div>
          <form className={styles.authForm} onSubmit={handleSubmit}>
            <div className={styles.authHeader}>
              <h2>{titles.heading}</h2>
              <p>{titles.description}</p>
            </div>
            {error && (
              <div style={{ 
                padding: '12px', 
                marginBottom: '16px', 
                backgroundColor: '#fee', 
                borderRadius: '6px',
                color: '#c00',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            {!isLogin && (
              <>
                <label className={styles.authField}>
                  <span>用户名</span>
                  <input name="username" type="text" placeholder="字母数字3-20位" required disabled={loading} minLength={3} maxLength={20} pattern="[a-zA-Z0-9_]+" title="只能包含字母、数字和下划线" />
                </label>
                <label className={styles.authField}>
                  <span>姓名</span>
                  <input name="name" type="text" placeholder="请输入您的真实姓名" required disabled={loading} />
                </label>
              </>
            )}
            {isLogin ? (
              <label className={styles.authField}>
                <span>用户名/邮箱</span>
                <input name="username_or_email" type="text" placeholder="请输入用户名或邮箱" required disabled={loading} />
              </label>
            ) : (
              <label className={styles.authField}>
                <span>邮箱</span>
                <div style={{display: 'flex', gap: '8px'}}>
                  <input 
                    id="register-email"
                    name="email" 
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    disabled={loading}
                    style={{flex: 1}}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const emailInput = document.getElementById('register-email') as HTMLInputElement
                      if (emailInput) handleSendCode(emailInput.value)
                    }}
                    disabled={loading || sendingCode || countdown > 0}
                    style={{
                      padding: '0 12px',
                      background: (loading || sendingCode || countdown > 0) ? '#94a3b8' : '#2563eb',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: (loading || sendingCode || countdown > 0) ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      whiteSpace: 'nowrap',
                      minWidth: '90px'
                    }}
                  >
                    {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}秒` : '获取验证码'}
                  </button>
                </div>
              </label>
            )}
            {!isLogin && (
              <label className={styles.authField}>
                <span>验证码</span>
                <input 
                  name="code" 
                  type="text" 
                  placeholder="请输入6位验证码" 
                  required 
                  disabled={loading}
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </label>
            )}
            {!isLogin && codeSent && (
              <div style={{
                fontSize: '12px', 
                color: '#16a34a', 
                marginTop: '-8px',
                marginBottom: '8px'
              }}>
                ✓ 验证码已发送到您的邮箱
              </div>
            )}
            <label className={styles.authField}>
              <span>密码</span>
              <input name="password" type="password" placeholder="请输入密码" required disabled={loading} minLength={6} />
            </label>
            {!isLogin && (
              <label className={styles.authField}>
                <span>确认密码</span>
                <input name="confirm" type="password" placeholder="请再次输入密码" required disabled={loading} minLength={6} />
              </label>
            )}
            {isLogin && (
              <div className={styles.authActionRow}>
                <a href="#forgot" onClick={(event) => event.preventDefault()}>
                  忘记密码？
                </a>
              </div>
            )}
            <button type="submit" className={styles.authSubmit} disabled={loading}>
              {loading ? '处理中...' : titles.submit}
            </button>
            <div className={styles.authDivider}>
              <span>或继续使用</span>
            </div>
            <div className={styles.authSocial}>
              <button type="button" aria-label="QQ 登录">
                QQ
              </button>
              <button type="button" aria-label="微信登录">
                微信
              </button>
            </div>
            <div className={styles.authSwitch}>
              <span>{titles.switchHint}</span>
              <button
                type="button"
                onClick={() => onSwitch(isLogin ? "register" : "login")}
                className={styles.authSwitchLink}
              >
                {titles.switchLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Scene() {
  const initialPositions: AnimatedBoxProps["initialPosition"][] = [
    [-9, 0.5, -9],
    [-3, 0.5, -3],
    [0, 0.5, 0],
    [3, 0.5, 3],
    [9, 0.5, 9],
    [-6, 0.5, 6],
    [6, 0.5, -6],
    [-12, 0.5, 0],
    [12, 0.5, 0],
    [0, 0.5, 12],
  ]

  return (
    <>
      <OrbitControls makeDefault />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={0x808080}
        fadeDistance={50}
      />
      {initialPositions.map((position, index) => (
        <AnimatedBox key={index} initialPosition={position} />
      ))}
    </>
  )
}

export function AuthPage({ initialMode }: AuthPageProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, loading } = useAuth()
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode)
  const [showAboutDialog, setShowAboutDialog] = useState(false)

  // 如果已登录，重定向到论文页面
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/papers')
    }
  }, [isAuthenticated, loading, router])

  useEffect(() => {
    setAuthMode(resolveModeFromPath(pathname))
  }, [pathname])

  const openAuth = useCallback(
    (mode: Exclude<AuthMode, null>) => {
      setAuthMode(mode)
      router.push(mode === "login" ? LOGIN_PATH : REGISTER_PATH, { scroll: false })
    },
    [router],
  )

  const closeAuth = useCallback(() => {
    setAuthMode(null)
    router.push(AUTH_BASE_PATH, { scroll: false })
  }, [router])

  const openAboutDialog = useCallback(() => {
    setShowAboutDialog(true)
  }, [])

  return (
    <div className={styles.loginPage}>
      <header className={styles.loginHeader}>
        <nav className={styles.loginNav}>
          <div className={styles.loginBrand}>
            <div className={styles.loginLogoCanvas}>
              <Canvas camera={{ position: [0, 0, 5] }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <SpinningLogo />
              </Canvas>
            </div>
            <span className={styles.loginTitle}>时光筑梦</span>
          </div>
          <ul className={styles.loginLinks}>
            <li>
              <button type="button" onClick={() => openAuth("register")}>
                注册
              </button>
            </li>
            <li>
              <button type="button" onClick={() => openAuth("login")}>
                登录
              </button>
            </li>
            <li>
              <button type="button" onClick={openAboutDialog}>
                关于
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main className={styles.loginContent}>
        <h1 className={styles.loginHeading}>拾光筑梦的创意集</h1>
        <h2 className={styles.loginSubheading} lang="en">
          被酒莫惊春睡重，赌书消得泼茶香，当时只道是寻常
        </h2>
        <p className={styles.loginQuote} lang="en">
          Code is not the world entire, yet thou art my very universe.
        </p>
        <button className={styles.loginButton} type="button" lang="en" onClick={() => openAuth("login")}>
          Join us
        </button>
      </main>

      <Canvas shadows camera={{ position: [30, 30, 30], fov: 50 }} className={styles.loginBackground}>
        <Scene />
      </Canvas>

      {authMode && <AuthOverlay mode={authMode} onClose={closeAuth} onSwitch={openAuth} />}
      
      <Dialog open={showAboutDialog} onOpenChange={setShowAboutDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">关于时光筑梦</DialogTitle>
            <DialogDescription>
              科研管理系统 - 让科研更简单
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <section>
              <h3 className="text-lg font-semibold mb-2">系统简介</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                时光筑梦是一个现代化的科研成果管理平台，致力于为科研工作者提供便捷、高效的数字化管理工具。
                我们整合了论文、专利、项目、软著、竞赛、会议、合作和资源等多个模块，帮助您更好地记录和展示科研成果。
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">核心功能</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>📄 <strong>论文管理</strong> - 跟踪论文写作进度、发表状态和引用情况</li>
                <li>🔬 <strong>专利管理</strong> - 记录专利申请、审核和授权全过程</li>
                <li>🎯 <strong>项目管理</strong> - 管理科研项目进度和里程碑</li>
                <li>💻 <strong>软著管理</strong> - 统一管理软件著作权信息</li>
                <li>🏆 <strong>竞赛管理</strong> - 记录参赛历程和获奖情况</li>
                <li>🌐 <strong>会议管理</strong> - 跟踪学术会议和交流活动</li>
                <li>🤝 <strong>合作管理</strong> - 维护合作伙伴关系</li>
                <li>📚 <strong>资源管理</strong> - 共享和管理科研资源</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">技术栈</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-medium mb-1">前端</p>
                  <ul className="space-y-1">
                    <li>• Next.js 14</li>
                    <li>• React 18</li>
                    <li>• TypeScript</li>
                    <li>• Tailwind CSS</li>
                    <li>• Shadcn UI</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">后端</p>
                  <ul className="space-y-1">
                    <li>• FastAPI</li>
                    <li>• Python 3.11+</li>
                    <li>• PostgreSQL</li>
                    <li>• MongoDB</li>
                    <li>• Redis</li>
                    <li>• SQLAlchemy</li>
                    <li>• JWT认证</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">版本信息</h3>
              <p className="text-sm text-muted-foreground">
                当前版本: <strong>v1.0.0</strong><br />
                最后更新: <strong>2025年11月</strong>
              </p>
            </section>

            <section className="border-t pt-4">
              <p className="text-xs text-muted-foreground text-center">
                © 2025 时光筑梦科研管理系统. All rights reserved.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

