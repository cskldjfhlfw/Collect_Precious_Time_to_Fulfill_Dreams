/**
 * 权限管理Hook
 */
import { useAuth } from '@/contexts/auth-context'

export type UserRole = 'user' | 'admin' | 'superadmin'

export interface Permissions {
  // 查看权限
  canView: boolean
  
  // 创建权限
  canCreate: boolean
  
  // 编辑权限
  canEdit: boolean
  
  // 删除权限
  canDelete: boolean
  
  // 批量导入权限
  canImport: boolean
  
  // 导出权限
  canExport: boolean
  
  // 用户管理权限
  canManageUsers: boolean
}

/**
 * 根据用户角色获取权限
 */
export function getPermissionsByRole(role: UserRole): Permissions {
  switch (role) {
    case 'superadmin':
      // 超级管理员：所有权限
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canImport: true,
        canExport: true,
        canManageUsers: true,
      }
    
    case 'admin':
      // 管理员：除了批量导入和用户管理外的所有权限
      return {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canImport: false,  // 不能批量导入
        canExport: true,
        canManageUsers: false,  // 不能管理用户
      }
    
    case 'user':
    default:
      // 普通用户：只能查看
      return {
        canView: true,
        canCreate: false,
        canEdit: false,
        canDelete: false,
        canImport: false,
        canExport: false,
        canManageUsers: false,
      }
  }
}

/**
 * 权限Hook
 */
export function usePermissions(): Permissions & { role: UserRole | null; isLoading: boolean } {
  const { user } = useAuth()
  
  const role = (user?.role as UserRole) || null
  const permissions = role ? getPermissionsByRole(role) : getPermissionsByRole('user')
  
  return {
    ...permissions,
    role,
    isLoading: !user,
  }
}

/**
 * 检查是否有特定权限
 */
export function useHasPermission(permission: keyof Permissions): boolean {
  const permissions = usePermissions()
  return permissions[permission]
}
