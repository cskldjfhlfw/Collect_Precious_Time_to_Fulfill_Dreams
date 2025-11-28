/**
 * 认证API
 */

const API_BASE = 'http://localhost:8000/api'

export interface RegisterRequest {
  username: string
  email: string
  password: string
  name: string
}

export interface LoginRequest {
  username_or_email: string
  password: string
}

export interface SendCodeRequest {
  email: string
}

export interface CodeLoginRequest {
  email: string
  code: string
}

export interface RegisterWithCodeRequest {
  username: string
  email: string
  code: string
  password: string
  name: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: {
    id: string
    username: string
    email: string
    role: string
  }
}

export interface UserInfo {
  id: string
  username: string
  email: string
  role: string
  phone?: string
  region?: string
}

export interface UpdateUserRequest {
  username?: string
  email?: string
  phone?: string
  region?: string
}

export const authApi = {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    console.log('发送登录请求:', data) // 调试日志
    
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('登录失败:', error) // 调试日志
      
      // 如果是422错误，展示更详细的验证错误
      if (response.status === 422 && error.detail) {
        if (Array.isArray(error.detail)) {
          const messages = error.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ')
          throw new Error(`数据验证失败: ${messages}`)
        }
      }
      
      throw new Error(error.detail || '登录失败')
    }

    return response.json()
  },

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '注册失败')
    }

    return response.json()
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(token: string): Promise<UserInfo> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取用户信息失败')
    }

    return response.json()
  },

  /**
   * 修改密码
   */
  async changePassword(token: string, oldPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '修改密码失败')
    }
  },

  /**
   * 发送验证码到邮箱
   */
  async sendCode(data: SendCodeRequest): Promise<{ message: string; expires_in: number }> {
    const response = await fetch(`${API_BASE}/auth/send-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '发送验证码失败')
    }

    return response.json()
  },

  /**
   * 使用验证码登录
   */
  async loginWithCode(data: CodeLoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/auth/login-with-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '验证码登录失败')
    }

    return response.json()
  },

  /**
   * 使用验证码注册
   */
  async registerWithCode(data: RegisterWithCodeRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE}/auth/register-with-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '注册失败')
    }

    return response.json()
  },

  /**
   * 更新当前用户信息
   */
  async updateUserProfile(token: string, data: UpdateUserRequest): Promise<UserInfo> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '更新用户信息失败')
    }

    return response.json()
  },
}
