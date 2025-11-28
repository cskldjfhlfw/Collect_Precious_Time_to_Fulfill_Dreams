"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, FileText, Calendar, Sparkles, Loader2, FileDown, History, Eye, Trash2 } from "lucide-react"
import { useApi } from "@/hooks/useApi"
import { DateRangePicker } from "@/components/date-range-picker"
import type { DateRange } from "react-day-picker"

const reportTypes = [
  "科研成果总结报告",
  "论文发表统计报告", 
  "专利申请进展报告",
  "项目执行情况报告",
  "合作机构绩效报告",
  "竞赛参与成果报告",
  "会议交流活动报告",
  "年度科研工作报告"
]

export function ReportsTab() {
  const [selectedReport, setSelectedReport] = useState(reportTypes[0])
  const [reportFormat, setReportFormat] = useState("详细报告")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [generating, setGenerating] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [reportStats, setReportStats] = useState<any>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedHistoryReport, setSelectedHistoryReport] = useState<any>(null)
  
  // 获取历史报告列表
  const { data: historyReports, loading: historyLoading, refetch: refetchHistory } = useApi(async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch('http://localhost:8000/api/analytics/reports/history?limit=50', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!response.ok) throw new Error('获取历史报告失败')
    return response.json()
  })

  // 调用API获取报告数据
  const { data: analyticsData, loading } = useApi(async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch('http://localhost:8000/api/analytics/overview', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.status}`)
    }
    return response.json()
  })

  const getReportData = () => {
    if (!analyticsData) return []
    
    const { summary } = analyticsData
    
    switch (selectedReport) {
      case "科研成果总结报告":
        return [
          { id: 1, metric: "论文发表总数", value: summary?.total_papers || 0, trend: "+12%" },
          { id: 2, metric: "专利申请数量", value: summary?.total_patents || 0, trend: "+8%" },
          { id: 3, metric: "在研项目数量", value: summary?.total_projects || 0, trend: "+15%" },
          { id: 4, metric: "软件著作权", value: summary?.total_software_copyrights || 0, trend: "+20%" },
          { id: 5, metric: "竞赛获奖数量", value: summary?.total_competitions || 0, trend: "+25%" },
          { id: 6, metric: "学术会议参与", value: summary?.total_conferences || 0, trend: "+18%" },
          { id: 7, metric: "合作项目数量", value: summary?.total_cooperations || 0, trend: "+10%" },
        ]
      case "论文发表统计报告":
        return [
          { id: 1, metric: "SCI论文数量", value: Math.floor((summary?.total_papers || 0) * 0.6), trend: "+15%" },
          { id: 2, metric: "EI论文数量", value: Math.floor((summary?.total_papers || 0) * 0.3), trend: "+10%" },
          { id: 3, metric: "核心期刊论文", value: Math.floor((summary?.total_papers || 0) * 0.4), trend: "+8%" },
          { id: 4, metric: "国际会议论文", value: Math.floor((summary?.total_papers || 0) * 0.2), trend: "+20%" },
          { id: 5, metric: "平均影响因子", value: "3.45", trend: "+5%" },
          { id: 6, metric: "总被引用次数", value: "1,285", trend: "+18%" },
        ]
      case "专利申请进展报告":
        return [
          { id: 1, metric: "发明专利申请", value: Math.floor((summary?.total_patents || 0) * 0.7), trend: "+12%" },
          { id: 2, metric: "实用新型专利", value: Math.floor((summary?.total_patents || 0) * 0.2), trend: "+8%" },
          { id: 3, metric: "外观设计专利", value: Math.floor((summary?.total_patents || 0) * 0.1), trend: "+5%" },
          { id: 4, metric: "已授权专利", value: Math.floor((summary?.total_patents || 0) * 0.6), trend: "+15%" },
          { id: 5, metric: "PCT国际申请", value: Math.floor((summary?.total_patents || 0) * 0.1), trend: "+25%" },
        ]
      case "项目执行情况报告":
        return [
          { id: 1, metric: "国家级项目", value: Math.floor((summary?.total_projects || 0) * 0.2), trend: "+10%" },
          { id: 2, metric: "省部级项目", value: Math.floor((summary?.total_projects || 0) * 0.3), trend: "+15%" },
          { id: 3, metric: "企业合作项目", value: Math.floor((summary?.total_projects || 0) * 0.4), trend: "+20%" },
          { id: 4, metric: "已完成项目", value: Math.floor((summary?.total_projects || 0) * 0.5), trend: "+8%" },
          { id: 5, metric: "项目总经费(万元)", value: "2,450", trend: "+18%" },
        ]
      default:
        return [
          { id: 1, metric: "总体数据量", value: Object.values(summary || {}).reduce((sum: number, val: any) => sum + (typeof val === 'number' ? val : 0), 0), trend: "+14%" },
          { id: 2, metric: "数据完整度", value: "96%", trend: "+2%" },
          { id: 3, metric: "更新频率", value: "每日", trend: "稳定" },
        ]
    }
  }

  const viewHistoryReport = async (reportId: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`http://localhost:8000/api/analytics/reports/${reportId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('获取报告详情失败')
      const data = await response.json()
      setSelectedHistoryReport(data)
      setShowHistory(true)
    } catch (error) {
      console.error('获取报告详情失败:', error)
      alert('获取报告详情失败')
    }
  }

  const handleGenerateReport = async () => {
    setGenerating(true)
    try {
      const body = {
        report_type: selectedReport,
        report_format: reportFormat,
        start_date: dateRange?.from?.toISOString(),
        end_date: dateRange?.to?.toISOString()
      }
      
      console.log('生成报告请求:', body)
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch('http://localhost:8000/api/analytics/reports/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('报告生成成功:', data)
      console.log('报告已保存到MongoDB，ID:', data.report_id)
      
      setAiReport(data.ai_content)
      setReportStats(data.statistics)
      
      // 刷新历史报告列表
      await refetchHistory()
    } catch (error) {
      console.error('生成报告失败:', error)
      alert('报告生成失败，请检查后端服务是否正常运行')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadWord = () => {
    if (!aiReport) return
    
    // 创建Word文档内容（使用HTML格式）
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head><meta charset='utf-8'><title>${selectedReport}</title></head>
      <body>
        <h1>${selectedReport}</h1>
        <p><strong>报告格式：</strong>${reportFormat}</p>
        <p><strong>生成时间：</strong>${new Date().toLocaleString('zh-CN')}</p>
        <hr/>
        <div style='white-space: pre-wrap; font-family: SimSun, serif;'>${aiReport}</div>
      </body>
      </html>
    `
    
    const blob = new Blob(['\ufeff', htmlContent], { 
      type: 'application/msword' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport}_${new Date().toISOString().split('T')[0]}.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadTxt = () => {
    if (!aiReport) return
    
    const txtContent = `${selectedReport}\n\n报告格式：${reportFormat}\n生成时间：${new Date().toLocaleString('zh-CN')}\n\n${'='.repeat(60)}\n\n${aiReport}`
    
    const blob = new Blob([txtContent], { 
      type: 'text/plain;charset=utf-8' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedReport}_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const reportData = getReportData()
  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold">科研成果报表</h3>
          <p className="text-muted-foreground mt-1">生成各类科研活动的统计分析报告（AI生成内容自动存储MongoDB）</p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="mr-2 h-4 w-4" />
            生成报告
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            历史报告
            {historyReports?.total > 0 && (
              <Badge variant="secondary" className="ml-2">{historyReports.total}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 生成报告Tab */}
        <TabsContent value="generate" className="space-y-4">
      {/* 报告配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            报告生成配置
          </CardTitle>
          <CardDescription>选择报告类型、格式和时间范围</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">报告类型</label>
            <Select value={selectedReport} onValueChange={setSelectedReport}>
              <SelectTrigger>
                <SelectValue placeholder="选择报告类型" />
              </SelectTrigger>
              <SelectContent>
                {reportTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">报告格式</label>
            <Select value={reportFormat} onValueChange={setReportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="详细报告">详细报告</SelectItem>
                <SelectItem value="摘要报告">摘要报告</SelectItem>
                <SelectItem value="图表报告">图表报告</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">时间范围（留空为全部）</label>
            <DateRangePicker 
              date={dateRange}
              onDateChange={setDateRange}
            />
          </div>

          <div className="flex items-end md:col-span-2 gap-2">
            <Button 
              onClick={handleGenerateReport} 
              className="flex-1"
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI生成报告
                </>
              )}
            </Button>
            {aiReport && (
              <>
                <Button 
                  onClick={handleDownloadWord}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Word
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleDownloadTxt}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-1" />
                  TXT
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 报告内容 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold">{selectedReport}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4" />
                生成时间：{currentDate} | 数据范围：
                {dateRange?.from && dateRange?.to 
                  ? `${dateRange.from.toLocaleDateString('zh-CN')} - ${dateRange.to.toLocaleDateString('zh-CN')}`
                  : '全部时间'}
              </CardDescription>
            </div>
            <Badge variant="secondary">
              {reportFormat}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {generating ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Sparkles className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">正在生成AI报告...</p>
                <p className="text-xs text-muted-foreground mt-1">请稍候，大模型正在分析数据</p>
              </div>
            </div>
          ) : aiReport ? (
            <>
              {/* AI生成的报告内容 */}
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: aiReport.replace(/\n/g, '<br/>') }} />
              </div>
              
              {/* 统计数据 */}
              {reportStats && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-3">数据统计</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold text-primary">{reportStats.论文数量}</div>
                      <div className="text-xs text-muted-foreground mt-1">论文</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold text-primary">{reportStats.专利数量}</div>
                      <div className="text-xs text-muted-foreground mt-1">专利</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold text-primary">{reportStats.项目数量}</div>
                      <div className="text-xs text-muted-foreground mt-1">项目</div>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <div className="text-2xl font-bold text-primary">{reportStats.竞赛数量}</div>
                      <div className="text-xs text-muted-foreground mt-1">竞赛</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 下载按钮 */}
              <div className="flex justify-end space-x-2 mt-6">
                <Button onClick={handleDownloadWord} className="bg-blue-600 hover:bg-blue-700">
                  <FileDown className="mr-2 h-4 w-4" />
                  下载Word文档
                </Button>
                <Button onClick={handleDownloadTxt} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  下载TXT文本
                </Button>
              </div>
            </>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">正在加载报告数据...</p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60%]">指标项目</TableHead>
                    <TableHead className="text-center">数值</TableHead>
                    <TableHead className="text-center">趋势</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.metric}</TableCell>
                      <TableCell className="text-center font-bold">{row.value}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={row.trend.startsWith('+') ? 'default' : row.trend === '稳定' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {row.trend}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* 提示信息 */}
              <div className="mt-6 p-6 bg-muted/30 rounded-lg text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h4 className="font-semibold mb-2">请配置报告参数</h4>
                <p className="text-sm text-muted-foreground">
                  选择报告类型、格式和时间范围，然后点击“AI生成报告”按钮
                </p>
              </div>

              {/* 报告总结 */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">报告摘要</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedReport === "科研成果总结报告" && 
                    `本年度科研工作取得显著进展，各项指标均呈现良好增长态势。论文发表、专利申请、项目执行等核心业务稳步发展，整体科研实力持续提升。`}
                  {selectedReport === "论文发表统计报告" && 
                    `论文发表质量持续改善，SCI论文占比逐步提高，国际影响力不断增强。建议继续加强高水平论文的发表工作。`}
                  {selectedReport === "专利申请进展报告" && 
                    `专利申请工作进展顺利，发明专利申请量保持稳定增长，技术创新能力不断提升。`}
                  {!["科研成果总结报告", "论文发表统计报告", "专利申请进展报告"].includes(selectedReport) &&
                    `数据统计显示各项工作稳步推进，相关指标保持良好发展趋势，为后续工作奠定了坚实基础。`}
                </p>
              </div>

              {/* 下载按钮 */}
              <div className="flex justify-end space-x-2 mt-6">
                <Button onClick={handleDownloadWord} className="bg-blue-600 hover:bg-blue-700">
                  <FileDown className="mr-2 h-4 w-4" />
                  下载Word文档
                </Button>
                <Button onClick={handleDownloadTxt} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  下载TXT文本
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {/* 历史报告Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                历史报告
              </CardTitle>
              <CardDescription>查看和管理已生成的报告（存储于MongoDB）</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : historyReports?.reports?.length > 0 ? (
                <div className="space-y-3">
                  {historyReports.reports.map((report: any) => (
                    <div
                      key={report._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => viewHistoryReport(report._id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{report.report_type}</h4>
                          <Badge variant="outline">{report.report_format}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          生成时间: {new Date(report.generated_at).toLocaleString('zh-CN')}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                          <span>{report.word_count} 字</span>
                          {report.time_range?.start_date && (
                            <span>
                              {report.time_range.start_date} ~ {report.time_range.end_date || '至今'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (confirm('确定要删除这份报告吗？')) {
                              try {
                                const token = localStorage.getItem('auth_token')
                                const res = await fetch(`http://localhost:8000/api/analytics/reports/${report._id}`, {
                                  method: 'DELETE',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                })
                                if (res.ok) {
                                  await refetchHistory()
                                }
                              } catch (error) {
                                console.error('删除失败:', error)
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>还没有生成过报告</p>
                  <p className="text-sm mt-1">切换到"生成报告"标签页创建您的第一份报告</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 查看历史报告详情对话框 */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedHistoryReport?.report_type}</DialogTitle>
          </DialogHeader>
          {selectedHistoryReport && (
            <div className="space-y-4">
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Badge>{selectedHistoryReport.report_format}</Badge>
                <span>生成于 {new Date(selectedHistoryReport.generated_at).toLocaleString('zh-CN')}</span>
                <span>{selectedHistoryReport.word_count} 字</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {selectedHistoryReport.ai_content}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
