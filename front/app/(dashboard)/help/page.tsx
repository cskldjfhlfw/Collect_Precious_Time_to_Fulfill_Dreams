"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  BookOpen, 
  MessageCircle, 
  Phone, 
  Mail, 
  Search, 
  Play, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ExternalLink,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  Video,
  Headphones,
  Globe,
  Users,
  Lightbulb,
  Zap
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const quickStart = [
  {
    id: 1,
    title: "系统概览",
    description: "了解科研成果管理系统的核心功能",
    duration: "5分钟",
    type: "视频教程",
    completed: true,
  },
  {
    id: 2,
    title: "论文管理入门",
    description: "学习如何添加和管理您的学术论文",
    duration: "8分钟",
    type: "图文教程",
    completed: true,
  },
  {
    id: 3,
    title: "项目协作指南",
    description: "掌握团队协作和项目管理功能",
    duration: "12分钟",
    type: "视频教程",
    completed: false,
  },
  {
    id: 4,
    title: "数据导入导出",
    description: "批量导入现有数据和导出报告",
    duration: "6分钟",
    type: "操作指南",
    completed: false,
  },
]

const faqList = [
  {
    id: 1,
    question: "如何重置我的密码？",
    answer: "您可以在登录页面点击\"忘记密码\"，然后按照邮件提示重置密码。",
    category: "账户管理",
    views: 1250,
  },
  {
    id: 2,
    question: "如何批量导入论文数据？",
    answer: "进入论文页面，点击\"导入\"按钮，支持Excel和CSV格式文件批量导入。",
    category: "数据管理",
    views: 890,
  },
  {
    id: 3,
    question: "团队成员权限如何设置？",
    answer: "在设置页面的\"团队管理\"中，可以为不同成员分配查看、编辑或管理权限。",
    category: "权限管理",
    views: 654,
  },
  {
    id: 4,
    question: "如何生成年度报告？",
    answer: "在统计分析页面选择时间范围，点击\"生成报告\"即可导出PDF格式的年度总结。",
    category: "报告导出",
    views: 432,
  },
]

const supportChannels = [
  {
    id: 1,
    name: "在线客服",
    description: "工作日 9:00-18:00 实时响应",
    icon: MessageCircle,
    status: "在线",
    responseTime: "< 5分钟",
    action: "开始对话",
  },
  {
    id: 2,
    name: "技术支持热线",
    description: "400-123-4567",
    icon: Phone,
    status: "可用",
    responseTime: "< 2分钟",
    action: "拨打电话",
  },
  {
    id: 3,
    name: "邮件支持",
    description: "support@research-platform.com",
    icon: Mail,
    status: "24小时",
    responseTime: "< 4小时",
    action: "发送邮件",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "在线": return "bg-green-100 text-green-800"
    case "可用": return "bg-blue-100 text-blue-800"
    case "24小时": return "bg-purple-100 text-purple-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [feedbackType, setFeedbackType] = useState("")
  const [feedbackMessage, setFeedbackMessage] = useState("")

  const filteredFAQ = faqList.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmitFeedback = () => {
    // 这里可以添加提交反馈的逻辑
    console.log("Feedback submitted:", { feedbackType, feedbackMessage })
    setShowFeedbackDialog(false)
    setFeedbackType("")
    setFeedbackMessage("")
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">帮助中心</h1>
          <p className="text-sm text-muted-foreground">
            提供操作指引、故障排查与支持服务入口。
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="搜索帮助内容..." 
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageCircle className="mr-2 h-4 w-4" />
                意见反馈
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>意见反馈</DialogTitle>
                <DialogDescription>
                  帮助我们改进产品和服务
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback-type">反馈类型</Label>
                  <Select value={feedbackType} onValueChange={setFeedbackType}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择反馈类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">错误报告</SelectItem>
                      <SelectItem value="feature">功能建议</SelectItem>
                      <SelectItem value="improvement">改进建议</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-message">详细描述</Label>
                  <Textarea
                    id="feedback-message"
                    placeholder="请详细描述您的问题或建议..."
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmitFeedback} disabled={!feedbackType || !feedbackMessage}>
                  <Send className="mr-2 h-4 w-4" />
                  提交反馈
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 快速入门 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>使用入门</CardTitle>
          </div>
          <CardDescription>快速了解系统核心功能与常见操作路径</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {quickStart.map((guide) => (
              <div key={guide.id} className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex-shrink-0">
                  {guide.completed ? (
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  ) : (
                    <Play className="h-8 w-8 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{guide.title}</h3>
                    <Badge variant="outline">{guide.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{guide.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {guide.duration}
                  </div>
                </div>
                <Button size="sm" variant={guide.completed ? "outline" : "default"}>
                  {guide.completed ? "重新观看" : "开始学习"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 常见问题 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>常见问题</CardTitle>
          </div>
          <CardDescription>定位系统使用中遇到的异常、权限与性能问题</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredFAQ.map((faq) => (
              <div key={faq.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{faq.question}</h3>
                      <Badge variant="secondary">{faq.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{faq.views} 次查看</span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button variant="outline">查看更多问题</Button>
          </div>
        </CardContent>
      </Card>

      {/* 联系支持 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>联系支持</CardTitle>
          </div>
          <CardDescription>为用户提供反馈渠道与服务承诺</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {supportChannels.map((channel) => {
              const IconComponent = channel.icon
              return (
                <div key={channel.id} className="rounded-lg border p-6 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium">{channel.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{channel.description}</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <Badge className={getStatusColor(channel.status)}>{channel.status}</Badge>
                    <span className="text-xs text-muted-foreground">响应时间 {channel.responseTime}</span>
                  </div>
                  <Button className="mt-4 w-full" size="sm">
                    {channel.action}
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* 更多资源 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>用户手册</CardTitle>
            <CardDescription>详细的功能说明和操作指南</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">完整用户手册 (PDF)</span>
              </div>
              <Button size="sm" variant="outline">下载</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">快速参考卡片</span>
              </div>
              <Button size="sm" variant="outline">下载</Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm">API 开发文档</span>
              </div>
              <Button size="sm" variant="outline">查看</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>系统状态</CardTitle>
            <CardDescription>实时监控系统运行状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">系统可用性</span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-green-600">正常</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">响应时间</span>
              <span className="text-sm text-muted-foreground">&lt; 200ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">上次维护</span>
              <span className="text-sm text-muted-foreground">2024-04-15</span>
            </div>
            <Button size="sm" variant="outline" className="w-full">
              查看详细状态
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学习资源</CardTitle>
            <CardDescription>深入学习系统功能的额外资源</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">视频教程库</span>
                </div>
                <Button size="sm" variant="outline">观看</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Headphones className="h-4 w-4 text-green-500" />
                  <span className="text-sm">在线研讨会</span>
                </div>
                <Button size="sm" variant="outline">参加</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">用户社区</span>
                </div>
                <Button size="sm" variant="outline">加入</Button>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">知识库</span>
                </div>
                <Button size="sm" variant="outline">浏览</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作和提示 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-base">使用技巧</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>使用 Ctrl+K 快速打开搜索功能</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>在论文页面可以拖拽文件直接上传</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <p>使用标签功能更好地组织您的研究</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-base">新功能</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span>知识图谱可视化</span>
              <Badge variant="secondary">新</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>AI 智能推荐</span>
              <Badge variant="secondary">Beta</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>协作评论功能</span>
              <Badge variant="secondary">新</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-base">用户评价</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="text-sm text-muted-foreground ml-2">4.8/5.0</span>
            </div>
            <p className="text-xs text-muted-foreground">
              "这个系统大大提高了我们团队的科研效率，特别是知识图谱功能非常实用。"
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <ThumbsUp className="mr-1 h-3 w-3" />
                有帮助
              </Button>
              <Button size="sm" variant="outline">
                <ThumbsDown className="mr-1 h-3 w-3" />
                无帮助
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
