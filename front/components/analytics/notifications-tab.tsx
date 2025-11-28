"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Award, 
  Calendar, 
  Users, 
  TrendingUp,
  Settings,
  Search,
  Filter,
  MoreHorizontal
} from "lucide-react"

const notificationTypes = [
  { id: "papers", label: "论文状态更新", description: "论文发表、审稿结果等通知", icon: FileText },
  { id: "patents", label: "专利进展通知", description: "专利申请、授权等进展提醒", icon: Award },
  { id: "projects", label: "项目里程碑", description: "项目开始、结束、重要节点提醒", icon: Clock },
  { id: "deadlines", label: "截止日期提醒", description: "会议投稿、项目交付等截止时间", icon: AlertTriangle },
  { id: "collaborations", label: "合作邀请", description: "新的合作机会和邀请通知", icon: Users },
  { id: "conferences", label: "会议活动", description: "学术会议、研讨会等活动通知", icon: Calendar },
  { id: "system", label: "系统通知", description: "系统更新、维护等重要通知", icon: Bell },
  { id: "achievements", label: "成果统计", description: "定期成果汇总和统计报告", icon: TrendingUp },
]

const recentNotifications = [
  {
    id: 1,
    type: "papers",
    title: "论文《基于深度学习的图像识别算法》审稿结果",
    message: "您的论文已被《计算机学报》接收，请于一周内提交最终版本。",
    time: "2小时前",
    status: "unread",
    priority: "high",
    icon: FileText,
    color: "text-blue-500"
  },
  {
    id: 2,
    type: "deadlines", 
    title: "ICML 2024 截止日期提醒",
    message: "距离论文投稿截止还有3天，请及时提交您的研究成果。",
    time: "6小时前",
    status: "unread",
    priority: "urgent",
    icon: AlertTriangle,
    color: "text-red-500"
  },
  {
    id: 3,
    type: "patents",
    title: "发明专利申请进展更新",
    message: "专利《智能数据处理系统》已进入实质审查阶段。",
    time: "1天前",
    status: "read",
    priority: "medium",
    icon: Award,
    color: "text-green-500"
  },
  {
    id: 4,
    type: "projects",
    title: "国家自然科学基金项目启动",
    message: "项目《人工智能在医疗诊断中的应用研究》已正式启动，请查看项目详情。",
    time: "2天前",
    status: "read",
    priority: "high",
    icon: Clock,
    color: "text-orange-500"
  },
  {
    id: 5,
    type: "collaborations",
    title: "清华大学合作邀请",
    message: "清华大学人工智能研究院邀请您参与联合研究项目，请查看详情。",
    time: "3天前",
    status: "read",
    priority: "medium",
    icon: Users,
    color: "text-purple-500"
  },
  {
    id: 6,
    type: "conferences",
    title: "AAAI 2024 会议注册开放",
    message: "AAAI 2024年会议注册现已开放，早鸟价格有效期至下月底。",
    time: "4天前",
    status: "read",
    priority: "low",
    icon: Calendar,
    color: "text-indigo-500"
  },
  {
    id: 7,
    type: "achievements",
    title: "月度成果统计报告",
    message: "您本月发表论文2篇，申请专利1项，参与项目进展良好。",
    time: "5天前",
    status: "read", 
    priority: "low",
    icon: TrendingUp,
    color: "text-cyan-500"
  },
  {
    id: 8,
    type: "system",
    title: "系统维护通知",
    message: "系统将于本周六凌晨2:00-4:00进行维护升级，届时服务将暂时中断。",
    time: "1周前",
    status: "read",
    priority: "medium",
    icon: Bell,
    color: "text-gray-500"
  }
]

export function NotificationsTab() {
  const [notifications, setNotifications] = useState({
    papers: true,
    patents: true,
    projects: true,
    deadlines: true,
    collaborations: false,
    conferences: true,
    system: true,
    achievements: false,
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")

  const toggleNotification = (id: string) => {
    setNotifications((prev) => ({ ...prev, [id]: !prev[id as keyof typeof prev] }))
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-500"
      case "high": return "bg-orange-500"
      case "medium": return "bg-blue-500"
      case "low": return "bg-gray-500"
      default: return "bg-gray-500"
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "紧急"
      case "high": return "重要"
      case "medium": return "一般"
      case "low": return "低"
      default: return "一般"
    }
  }

  const filteredNotifications = recentNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === "all" || notification.status === filterStatus
    const matchesPriority = filterPriority === "all" || notification.priority === filterPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const unreadCount = recentNotifications.filter(n => n.status === "unread").length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            通知中心
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </h3>
          <p className="text-muted-foreground mt-1">管理科研活动相关通知和提醒设置</p>
        </div>
      </div>

      {/* 通知偏好设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            通知偏好设置
          </CardTitle>
          <CardDescription>选择您希望接收的通知类型</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {notificationTypes.map((type) => (
            <div key={type.id} className="flex items-start justify-between p-3 border rounded-lg">
              <div className="flex items-start space-x-3">
                <type.icon className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <span className="text-sm font-medium">{type.label}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                </div>
              </div>
              <Switch 
                checked={notifications[type.id as keyof typeof notifications]} 
                onCheckedChange={() => toggleNotification(type.id)} 
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 通知筛选和搜索 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">通知历史</CardTitle>
          <CardDescription>查看和管理所有通知记录</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索通知内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="unread">未读</SelectItem>
                <SelectItem value="read">已读</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="优先级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="urgent">紧急</SelectItem>
                <SelectItem value="high">重要</SelectItem>
                <SelectItem value="medium">一般</SelectItem>
                <SelectItem value="low">低</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                  notification.status === "unread" ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" : ""
                }`}
              >
                <div className="relative">
                  <notification.icon className={`h-5 w-5 ${notification.color}`} />
                  {notification.status === "unread" && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(notification.priority)} text-white border-none`}
                      >
                        {getPriorityLabel(notification.priority)}
                      </Badge>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                    {notification.status === "unread" && (
                      <Button variant="ghost" size="sm" className="text-xs h-6">
                        标为已读
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">没有找到匹配的通知</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 快速操作 */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <CheckCircle className="mr-2 h-4 w-4" />
            全部标为已读
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            清理已读通知
          </Button>
        </div>
        <Button variant="outline" size="sm">
          查看所有通知
        </Button>
      </div>
    </div>
  )
}
