"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { usersApi, type UserListItem } from '@/lib/api/users'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Users, Shield, Edit, Trash2, Key, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function UsersAdminPage() {
  const router = useRouter()
  const { token, user, isSuperAdmin, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<UserListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [size] = useState(10)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [authorized, setAuthorized] = useState(false)

  // 编辑对话框
  const [editOpen, setEditOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null)
  const [editForm, setEditForm] = useState({ username: '', email: '', role: '' })

  // 删除对话框
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deletingUser, setDeletingUser] = useState<UserListItem | null>(null)

  // 重置密码对话框
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [resetPasswordUser, setResetPasswordUser] = useState<UserListItem | null>(null)
  const [newPassword, setNewPassword] = useState('')

  // 严格的权限检查
  useEffect(() => {
    // 等待认证加载完成
    if (authLoading) return

    // 检查是否已登录
    if (!token || !user) {
      console.log('[权限检查] 未登录，重定向到登录页')
      router.push('/auth')
      return
    }

    // 检查是否为超级管理员
    if (!isSuperAdmin || user.role !== 'superadmin') {
      console.log('[权限检查] 权限不足，重定向到首页')
      alert('访问被拒绝：您没有权限访问此页面')
      router.push('/papers')
      return
    }

    // 验证token有效性
    if (token) {
      usersApi.getList(token, { page: 1, size: 1 })
        .then(() => {
          console.log('[权限检查] 验证通过')
          setAuthorized(true)
        })
        .catch((error) => {
          console.error('[权限检查] Token验证失败:', error)
          alert('访问被拒绝：认证失败')
          router.push('/auth')
        })
    }
  }, [token, user, isSuperAdmin, authLoading, router])

  // 加载用户列表
  const loadUsers = async () => {
    if (!token) return
    
    setLoading(true)
    try {
      const response = await usersApi.getList(token, {
        page,
        size,
        search: search || undefined,
        role: roleFilter === 'all' ? undefined : roleFilter,
      })
      setUsers(response.items)
      setTotal(response.total)
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorized) {
      loadUsers()
    }
  }, [authorized, token, page, search, roleFilter])

  // 打开编辑对话框
  const handleEdit = (user: UserListItem) => {
    setEditingUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role,
    })
    setEditOpen(true)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!token || !editingUser) return

    try {
      await usersApi.update(token, editingUser.id, editForm)
      setEditOpen(false)
      loadUsers()
    } catch (error) {
      alert(error instanceof Error ? error.message : '更新失败')
    }
  }

  // 打开删除对话框
  const handleDelete = (user: UserListItem) => {
    setDeletingUser(user)
    setDeleteOpen(true)
  }

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!token || !deletingUser) return

    try {
      await usersApi.delete(token, deletingUser.id)
      setDeleteOpen(false)
      loadUsers()
    } catch (error) {
      alert(error instanceof Error ? error.message : '删除失败')
    }
  }

  // 打开重置密码对话框
  const handleResetPassword = (user: UserListItem) => {
    setResetPasswordUser(user)
    setNewPassword('')
    setResetPasswordOpen(true)
  }

  // 确认重置密码
  const handleConfirmResetPassword = async () => {
    if (!token || !resetPasswordUser || !newPassword) return

    try {
      await usersApi.resetPassword(token, resetPasswordUser.id, newPassword)
      setResetPasswordOpen(false)
      alert('密码重置成功')
    } catch (error) {
      alert(error instanceof Error ? error.message : '重置密码失败')
    }
  }

  // 切换账户状态（启用/禁用）
  const handleToggleActive = async (user: UserListItem) => {
    if (!token) return

    const action = user.is_active ? '禁用' : '启用'
    if (!confirm(`确定要${action}用户 ${user.username} 的账户吗？`)) return

    try {
      const result = await usersApi.toggleActive(token, user.id)
      alert(result.message)
      loadUsers() // 重新加载用户列表
    } catch (error) {
      alert(error instanceof Error ? error.message : '操作失败')
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <Badge variant="destructive">超级管理员</Badge>
      case 'admin':
        return <Badge variant="default">管理员</Badge>
      default:
        return <Badge variant="secondary">普通用户</Badge>
    }
  }

  // 加载中或权限检查中
  if (authLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto text-muted-foreground animate-pulse mb-4" />
          <p className="text-muted-foreground">正在验证权限...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            用户管理
          </h1>
          <p className="text-muted-foreground mt-1">
            管理系统用户和权限设置
          </p>
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户名或邮箱..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="所有角色" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">所有角色</SelectItem>
            <SelectItem value="superadmin">超级管理员</SelectItem>
            <SelectItem value="admin">管理员</SelectItem>
            <SelectItem value="user">普通用户</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            总用户数
          </div>
          <div className="text-2xl font-bold mt-2">{total}</div>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  加载中...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <Badge variant="default" className="bg-green-500">正常</Badge>
                    ) : (
                      <Badge variant="destructive">已禁用</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(u)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleResetPassword(u)}
                        title="重置密码"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      {u.id !== user?.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? "禁用账户" : "启用账户"}
                          >
                            <Shield className={`h-4 w-4 ${u.is_active ? 'text-orange-500' : 'text-green-500'}`} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(u)}
                            title="删除用户"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {total > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            共 {total} 个用户，第 {page} 页 / 共 {Math.ceil(total / size)} 页
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(Math.ceil(total / size), p + 1))}
              disabled={page >= Math.ceil(total / size)}
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 编辑用户对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>
              修改用户信息和权限设置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">角色</Label>
              <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                  <SelectItem value="superadmin">超级管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 {deletingUser?.username} 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 重置密码对话框 */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              为用户 {resetPasswordUser?.username} 设置新密码
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                minLength={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>
              取消
            </Button>
            <Button onClick={handleConfirmResetPassword} disabled={newPassword.length < 6}>
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
