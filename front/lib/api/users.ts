/**
 * 用户管理API（超级管理员）
 */

const API_BASE = 'http://localhost:8000/api'

export interface UserListItem {
  id: string
  username: string
  email: string
  role: string
  is_active: boolean
}

export interface UserListResponse {
  items: UserListItem[]
  total: number
  page: number
  size: number
  pages: number
}

export interface UserUpdateData {
  username?: string
  email?: string
  role?: string
}

export const usersApi = {
  /**
   * 获取用户列表
   */
  async getList(token: string, params: {
    page?: number
    size?: number
    search?: string
    role?: string
  } = {}): Promise<UserListResponse> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', String(params.page))
    if (params.size) queryParams.append('size', String(params.size))
    if (params.search) queryParams.append('search', params.search)
    if (params.role) queryParams.append('role', params.role)

    const response = await fetch(`${API_BASE}/users?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取用户列表失败')
    }

    return response.json()
  },

  /**
   * 获取用户详情
   */
  async getDetail(token: string, id: string): Promise<UserListItem> {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('获取用户详情失败')
    }

    return response.json()
  },

  /**
   * 更新用户
   */
  async update(token: string, id: string, data: UserUpdateData): Promise<UserListItem> {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '更新用户失败')
    }

    return response.json()
  },

  /**
   * 删除用户
   */
  async delete(token: string, id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '删除用户失败')
    }
  },

  /**
   * 重置用户密码
   */
  async resetPassword(token: string, id: string, newPassword: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/${id}/reset-password?new_password=${encodeURIComponent(newPassword)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '重置密码失败')
    }
  },

  /**
   * 切换用户账户状态（启用/禁用）
   */
  async toggleActive(token: string, id: string): Promise<{ message: string; is_active: boolean }> {
    const response = await fetch(`${API_BASE}/users/${id}/toggle-active`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '切换账户状态失败')
    }

    return response.json()
  },
}
