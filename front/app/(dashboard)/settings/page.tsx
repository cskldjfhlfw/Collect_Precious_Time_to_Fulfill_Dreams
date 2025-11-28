"use client"

import { useState, useEffect } from "react"
import { authApi } from "@/lib/api/auth"
import { 
  Laptop, 
  Smartphone, 
  Tablet, 
  Info, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Database,
  HardDrive,
  Cpu,
  Monitor,
  Wifi,
  Battery
} from "lucide-react"
import { useSettings } from "@/contexts/settings-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

const defaultAvatars = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9439775.jpg-4JVJWOjPksd3DtnBYJXoWHA5lc1DU9.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/375238645_11475210.jpg-lU8bOe6TLt5Rv51hgjg8NT8PsDBmvN.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/375238208_11475222.jpg-poEIzVHAGiIfMFQ7EiF8PUG1u0Zkzz.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dd.jpg-4MCwPC2Bec6Ume26Yo1kao3CnONxDg.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9334178.jpg-Y74tW6XFO68g7N36SE5MSNDNVKLQ08.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/5295.jpg-fLw0wGGZp8wuTzU5dnyfjZDwAHN98a.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9720029.jpg-Yf9h2a3kT7rYyCb648iLIeHThq5wEy.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/27470341_7294795.jpg-XE0zf7R8tk4rfA1vm4fAHeZ1QoVEOo.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/799.jpg-0tEi4Xvg5YsFoGoQfQc698q4Dygl1S.jpeg",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/9334228.jpg-eOsHCkvVrVAwcPHKYSs5sQwVKsqWpC.jpeg",
]

export default function SettingsPage() {
  const { settings, updateSettings, updateNotificationSettings, updatePrivacySettings } = useSettings()
  const [selectedAvatar, setSelectedAvatar] = useState(settings.avatar)
  const [mounted, setMounted] = useState(false)

  // 避免水合错误：只在客户端渲染时显示用户数据
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveAccount = async () => {
    try {
      // 获取token
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error("未登录，请先登录")
        return
      }

      // 调用后端API更新用户信息
      const updatedUser = await authApi.updateUserProfile(token, {
        phone: settings.phone,
        region: settings.region,
      })

      console.log("用户信息更新成功:", updatedUser)

      // 更新本地设置
      updateSettings({
        avatar: selectedAvatar,
        fullName: settings.fullName,
        email: settings.email,
        phone: updatedUser.phone || settings.phone,
        region: updatedUser.region || settings.region,
        timezone: settings.timezone,
      })
      
      toast.success("账户设置保存成功")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "保存失败"
      toast.error(errorMessage)
      console.error("Save account error:", error)
    }
  }

  const handleSaveNotifications = () => {
    updateNotificationSettings(settings.notifications)
    toast.success("通知设置保存成功")
  }

  const handleSavePrivacy = () => {
    updatePrivacySettings(settings.privacy)
    toast.success("隐私设置保存成功")
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">系统设置</h1>
      <Tabs defaultValue="account" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="account">账户</TabsTrigger>
          <TabsTrigger value="security">安全</TabsTrigger>
          <TabsTrigger value="preferences">偏好</TabsTrigger>
          <TabsTrigger value="notifications">通知</TabsTrigger>
          <TabsTrigger value="privacy">隐私</TabsTrigger>
          <TabsTrigger value="data">数据</TabsTrigger>
          <TabsTrigger value="system">系统</TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>账户设置</CardTitle>
              <CardDescription>管理您的账户信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>当前头像</Label>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={selectedAvatar} alt={settings.fullName} />
                    <AvatarFallback suppressHydrationWarning>
                      {mounted
                        ? settings.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <Label>选择新头像</Label>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {defaultAvatars.map((avatar, index) => (
                    <Avatar
                      key={index}
                      className={`h-20 w-20 rounded-lg cursor-pointer hover:ring-2 hover:ring-primary shrink-0 ${
                        selectedAvatar === avatar ? "ring-2 ring-primary" : ""
                      }`}
                      onClick={() => setSelectedAvatar(avatar)}
                    >
                      <AvatarImage src={avatar} alt={`Avatar ${index + 1}`} className="object-cover" />
                      <AvatarFallback>{index + 1}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <div>
                  <Label htmlFor="custom-avatar">或上传自定义头像</Label>
                  <Input id="custom-avatar" type="file" accept="image/*" className="mt-1" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="full-name">姓名</Label>
                <Input
                  id="full-name"
                  value={settings.fullName}
                  onChange={(e) => updateSettings({ fullName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input id="email" type="email" value={settings.email} onChange={(e) => updateSettings({ email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">手机号码</Label>
                <Input id="phone" type="tel" value={settings.phone} onChange={(e) => updateSettings({ phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="region">地区</Label>
                <Input id="region" type="text" value={settings.region || ''} onChange={(e) => updateSettings({ region: e.target.value })} placeholder="例如：北京市、上海市" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">时区</Label>
                <Select value={settings.timezone} onValueChange={(value) => updateSettings({ timezone: value })}>
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="选择时区" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc-12">International Date Line West (UTC-12)</SelectItem>
                    <SelectItem value="utc-11">Samoa Standard Time (UTC-11)</SelectItem>
                    <SelectItem value="utc-10">Hawaii-Aleutian Standard Time (UTC-10)</SelectItem>
                    <SelectItem value="utc-9">Alaska Standard Time (UTC-9)</SelectItem>
                    <SelectItem value="utc-8">Pacific Time (UTC-8)</SelectItem>
                    <SelectItem value="utc-7">Mountain Time (UTC-7)</SelectItem>
                    <SelectItem value="utc-6">Central Time (UTC-6)</SelectItem>
                    <SelectItem value="utc-5">Eastern Time (UTC-5)</SelectItem>
                    <SelectItem value="utc-4">Atlantic Time (UTC-4)</SelectItem>
                    <SelectItem value="utc-3">Argentina Standard Time (UTC-3)</SelectItem>
                    <SelectItem value="utc-2">South Georgia Time (UTC-2)</SelectItem>
                    <SelectItem value="utc-1">Azores Time (UTC-1)</SelectItem>
                    <SelectItem value="utc+0">Greenwich Mean Time (UTC+0)</SelectItem>
                    <SelectItem value="utc+1">Central European Time (UTC+1)</SelectItem>
                    <SelectItem value="utc+2">Eastern European Time (UTC+2)</SelectItem>
                    <SelectItem value="utc+3">Moscow Time (UTC+3)</SelectItem>
                    <SelectItem value="utc+4">Gulf Standard Time (UTC+4)</SelectItem>
                    <SelectItem value="utc+5">Pakistan Standard Time (UTC+5)</SelectItem>
                    <SelectItem value="utc+5.5">Indian Standard Time (UTC+5:30)</SelectItem>
                    <SelectItem value="utc+6">Bangladesh Standard Time (UTC+6)</SelectItem>
                    <SelectItem value="utc+7">Indochina Time (UTC+7)</SelectItem>
                    <SelectItem value="utc+8">China Standard Time (UTC+8)</SelectItem>
                    <SelectItem value="utc+9">Japan Standard Time (UTC+9)</SelectItem>
                    <SelectItem value="utc+10">Australian Eastern Standard Time (UTC+10)</SelectItem>
                    <SelectItem value="utc+11">Solomon Islands Time (UTC+11)</SelectItem>
                    <SelectItem value="utc+12">New Zealand Standard Time (UTC+12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveAccount}>保存账户设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>安全设置</CardTitle>
                <CardDescription>管理您账户的安全设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">当前密码</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">新密码</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">确认新密码</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="two-factor" />
                  <Label htmlFor="two-factor">启用双因素认证</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button>保存安全设置</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>登录历史</CardTitle>
                <CardDescription>您账户的最近登录活动</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { date: "2024-04-20", time: "14:30 UTC+8", ip: "192.168.1.1", location: "北京, 中国" },
                  { date: "2024-04-19", time: "09:15 UTC+8", ip: "10.0.0.1", location: "上海, 中国" },
                  { date: "2024-04-18", time: "22:45 UTC+8", ip: "172.16.0.1", location: "深圳, 中国" },
                ].map((login, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>
                      {login.date} {login.time}
                    </span>
                    <span>{login.ip}</span>
                    <span>{login.location}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>活跃会话</CardTitle>
                <CardDescription>您账户当前的活跃会话</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { device: "Laptop", browser: "Chrome", os: "Windows 10", icon: Laptop },
                  { device: "Smartphone", browser: "Safari", os: "iOS 15", icon: Smartphone },
                  { device: "Tablet", browser: "Firefox", os: "Android 12", icon: Tablet },
                ].map((session, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center">
                      <session.icon className="mr-2 h-4 w-4" />
                      {session.device}
                    </span>
                    <span>{session.browser}</span>
                    <span>{session.os}</span>
                  </div>
                ))}
              </CardContent>
              <CardFooter>
                <Button variant="outline">注销所有其他会话</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>个人偏好</CardTitle>
              <CardDescription>自定义您的仪表板体验</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">语言</Label>
                  <Select defaultValue="en">
                    <SelectTrigger id="language">
                      <SelectValue placeholder="选择语言" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">货币</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="选择货币" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cny">CNY (¥)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                      <SelectItem value="gbp">GBP (£)</SelectItem>
                      <SelectItem value="jpy">JPY (¥)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">日期格式</Label>
                  <Select defaultValue="mm-dd-yyyy">
                    <SelectTrigger id="date-format">
                      <SelectValue placeholder="选择日期格式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                      <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-size">字体大小</Label>
                  <Slider defaultValue={[16]} max={24} min={12} step={1} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>主题</Label>
                <RadioGroup defaultValue="system">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light">浅色</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark">深色</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="system" id="theme-system" />
                    <Label htmlFor="theme-system">跟随系统</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>仪表板布局</Label>
                <RadioGroup defaultValue="default">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="layout-default" />
                    <Label htmlFor="layout-default">默认</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="layout-compact" />
                    <Label htmlFor="layout-compact">紧凑</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expanded" id="layout-expanded" />
                    <Label htmlFor="layout-expanded">展开</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter>
              <Button>保存偏好设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>管理您接收通知的方式</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>通知渠道</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email-notifications"
                      defaultChecked={settings.notifications.email}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ ...settings.notifications, email: checked as boolean })
                      }
                    />
                    <Label htmlFor="email-notifications">邮件通知</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="push-notifications"
                      defaultChecked={settings.notifications.push}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ ...settings.notifications, push: checked as boolean })
                      }
                    />
                    <Label htmlFor="push-notifications">推送通知</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sms-notifications"
                      defaultChecked={settings.notifications.sms}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ ...settings.notifications, sms: checked as boolean })
                      }
                    />
                    <Label htmlFor="sms-notifications">短信通知</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>通知类型</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="account-activity"
                      defaultChecked={settings.notifications.accountActivity}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ ...settings.notifications, accountActivity: checked as boolean })
                      }
                    />
                    <Label htmlFor="account-activity">账户活动</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="new-features"
                      defaultChecked={settings.notifications.newFeatures}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ ...settings.notifications, newFeatures: checked as boolean })
                      }
                    />
                    <Label htmlFor="new-features">新功能和更新</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="marketing"
                      defaultChecked={settings.notifications.marketing}
                      onCheckedChange={(checked) =>
                        updateNotificationSettings({ ...settings.notifications, marketing: checked as boolean })
                      }
                    />
                    <Label htmlFor="marketing">营销和推广</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notification-frequency">通知频率</Label>
                <Select
                  value={settings.notifications.frequency}
                  onValueChange={(value: "real-time" | "daily" | "weekly") =>
                    updateNotificationSettings({ ...settings.notifications, frequency: value })
                  }
                >
                  <SelectTrigger id="notification-frequency">
                    <SelectValue placeholder="选择频率" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real-time">实时</SelectItem>
                    <SelectItem value="daily">每日摘要</SelectItem>
                    <SelectItem value="weekly">每周总结</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-hours-start">免打扰时间</Label>
                <div className="flex items-center space-x-2">
                  <Input id="quiet-hours-start" type="time" defaultValue="22:00" />
                  <span>至</span>
                  <Input id="quiet-hours-end" type="time" defaultValue="07:00" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveNotifications}>保存通知设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>隐私设置</CardTitle>
              <CardDescription>管理您的隐私和数据设置</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">数据共享</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="analytics-sharing">共享分析数据</Label>
                      <Switch
                        id="analytics-sharing"
                        checked={settings.privacy.analyticsSharing}
                        onCheckedChange={(checked) =>
                          updatePrivacySettings({ ...settings.privacy, analyticsSharing: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="personalized-ads">允许个性化广告</Label>
                      <Switch
                        id="personalized-ads"
                        checked={settings.privacy.personalizedAds}
                        onCheckedChange={(checked) =>
                          updatePrivacySettings({ ...settings.privacy, personalizedAds: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">账户可见性</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={settings.privacy.visibility}
                      onValueChange={(value: "public" | "private") => updatePrivacySettings({ ...settings.privacy, visibility: value })}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="public" id="visibility-public" />
                        <Label htmlFor="visibility-public">公开</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="private" id="visibility-private" />
                        <Label htmlFor="visibility-private">私密</Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">数据保留</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={settings.privacy.dataRetention}
                      onValueChange={(value: "6-months" | "1-year" | "2-years" | "indefinite") =>
                        updatePrivacySettings({ ...settings.privacy, dataRetention: value })
                      }
                    >
                      <SelectTrigger id="data-retention">
                        <SelectValue placeholder="选择数据保留期限" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6-months">6个月</SelectItem>
                        <SelectItem value="1-year">1年</SelectItem>
                        <SelectItem value="2-years">2年</SelectItem>
                        <SelectItem value="indefinite">永久</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">第三方集成</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm text-muted-foreground">已连接: 百度统计, 微信开放平台</p>
                    <Button variant="outline">管理集成</Button>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-between">
                <Button variant="outline">下载我的数据</Button>
                <Button variant="destructive">删除我的账户</Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSavePrivacy}>保存隐私设置</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>数据备份</CardTitle>
                <CardDescription>备份您的科研数据和设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>备份内容</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="backup-papers" defaultChecked />
                      <Label htmlFor="backup-papers">论文数据</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="backup-projects" defaultChecked />
                      <Label htmlFor="backup-projects">项目数据</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="backup-patents" defaultChecked />
                      <Label htmlFor="backup-patents">专利数据</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="backup-settings" defaultChecked />
                      <Label htmlFor="backup-settings">系统设置</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-format">备份格式</Label>
                  <Select defaultValue="json">
                    <SelectTrigger id="backup-format">
                      <SelectValue placeholder="选择备份格式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON 格式</SelectItem>
                      <SelectItem value="excel">Excel 格式</SelectItem>
                      <SelectItem value="csv">CSV 格式</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  创建备份
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>数据恢复</CardTitle>
                <CardDescription>从备份文件恢复数据</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restore-file">选择备份文件</Label>
                  <Input id="restore-file" type="file" accept=".json,.xlsx,.csv" />
                </div>
                <div className="space-y-2">
                  <Label>恢复选项</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="restore-merge" defaultChecked />
                      <Label htmlFor="restore-merge">合并现有数据</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="restore-overwrite" />
                      <Label htmlFor="restore-overwrite">覆盖现有数据</Label>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  恢复数据
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>存储管理</CardTitle>
                <CardDescription>管理您的存储空间使用情况</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>论文附件</span>
                    <span>2.3 GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>项目文档</span>
                    <span>1.8 GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>专利文件</span>
                    <span>0.9 GB</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>其他文件</span>
                    <span>0.5 GB</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex items-center justify-between font-medium">
                      <span>总计使用</span>
                      <span>5.5 GB / 10 GB</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>存储使用率</span>
                    <span>55%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "55%" }}></div>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <Trash2 className="mr-2 h-4 w-4" />
                  清理存储空间
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>数据同步</CardTitle>
                <CardDescription>配置数据同步设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-sync">自动同步</Label>
                  <Switch id="auto-sync" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sync-frequency">同步频率</Label>
                  <Select defaultValue="hourly">
                    <SelectTrigger id="sync-frequency">
                      <SelectValue placeholder="选择同步频率" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-time">实时同步</SelectItem>
                      <SelectItem value="hourly">每小时</SelectItem>
                      <SelectItem value="daily">每日</SelectItem>
                      <SelectItem value="weekly">每周</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>上次同步</Label>
                  <p className="text-sm text-muted-foreground">2024-04-20 14:30 UTC+8</p>
                </div>
                <Button variant="outline" className="w-full">
                  <Database className="mr-2 h-4 w-4" />
                  立即同步
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>系统信息</CardTitle>
                <CardDescription>查看系统运行状态和版本信息</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">应用版本</span>
                    </div>
                    <span className="text-sm font-mono">v2.1.0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span className="text-sm">数据库版本</span>
                    </div>
                    <span className="text-sm font-mono">PostgreSQL 15.2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <span className="text-sm">安全协议</span>
                    </div>
                    <span className="text-sm">TLS 1.3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" />
                      <span className="text-sm">网络状态</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-600">正常</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>性能监控</CardTitle>
                <CardDescription>实时系统性能指标</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span className="text-sm">CPU 使用率</span>
                    </div>
                    <span className="text-sm">23%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "23%" }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="text-sm">内存使用率</span>
                    </div>
                    <span className="text-sm">67%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: "67%" }}></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="text-sm">响应时间</span>
                    </div>
                    <span className="text-sm">156ms</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "31%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>维护工具</CardTitle>
                <CardDescription>系统维护和优化工具</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="mr-2 h-4 w-4" />
                  优化数据库
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Trash2 className="mr-2 h-4 w-4" />
                  清理缓存
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  安全扫描
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  生成诊断报告
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>更新管理</CardTitle>
                <CardDescription>检查和管理系统更新</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-update">自动更新</Label>
                  <Switch id="auto-update" defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>更新通道</Label>
                  <Select defaultValue="stable">
                    <SelectTrigger>
                      <SelectValue placeholder="选择更新通道" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stable">稳定版</SelectItem>
                      <SelectItem value="beta">测试版</SelectItem>
                      <SelectItem value="dev">开发版</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>上次检查</Label>
                  <p className="text-sm text-muted-foreground">2024-04-20 09:00 UTC+8</p>
                </div>
                <Button className="w-full">
                  检查更新
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

