"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { usePermissions } from "@/hooks/usePermissions"
import { useAuth } from "@/contexts/auth-context"
import Papa from "papaparse"

interface ImportDialogProps {
  entityType: string
  entityName: string
  apiEndpoint: string
  onImportSuccess?: () => void
  sampleFields?: string[]
}

export function ImportDialog({
  entityType,
  entityName,
  apiEndpoint,
  onImportSuccess,
  sampleFields = []
}: ImportDialogProps) {
  const { canImport } = usePermissions()
  const { token } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 避免hydration错误：只在客户端挂载后渲染Dialog
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile)
        setResult(null)
      } else {
        alert('请选择CSV文件')
      }
    }
  }

  const handleImport = async () => {
    if (!file) return
    if (!token) {
      alert('请先登录')
      return
    }

    setImporting(true)
    setResult(null)

    try {
      // 解析CSV文件
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: async (results) => {
          const data = results.data
          console.log(`解析到 ${data.length} 条记录`)

          // 批量导入数据
          let successCount = 0
          let failedCount = 0
          const errors: string[] = []

          for (let i = 0; i < data.length; i++) {
            try {
              // 处理数据：解析JSON字段
              const row = data[i] as Record<string, any>
              const processedRow: Record<string, any> = {}
              
              // 字段映射表 - 将CSV字段映射到API字段
              const fieldMappings: Record<string, Record<string, string>> = {
                'conferences': {
                  'level': 'category',
                  'participation_type': 'status',
                  'travel_budget': 'budget',
                  'travel_expense': 'used',
                  'visa_required': '__skip__',
                  'reminder_date': '__skip__',
                  'image_path': '__skip__',
                  'file_path': '__skip__'
                },
                'cooperations': {
                  'organization': 'name',
                  'cooperation_type': 'type',
                  'cooperation_value': 'value',
                  'pipeline_stage': '__skip__',
                  'next_follow_up': 'last_contact',
                  'start_date': 'established_date',
                  'content': 'description',
                  'image_path': '__skip__',
                  'file_path': '__skip__'
                },
                'competitions': {
                  'image_path': '__skip__',
                  'file_path': '__skip__'
                },
                'patents': {
                  'image_path': '__skip__',
                  'file_path': '__skip__'
                }
              }
              
              // 获取当前实体类型的映射
              const mapping = fieldMappings[entityType] || {}
              
              for (const [key, value] of Object.entries(row)) {
                if (value === '' || value === null || value === undefined) {
                  // 跳过空值
                  continue
                }
                
                // 应用字段映射
                const mappedKey = mapping[key] || key
                if (mappedKey === '__skip__') {
                  continue // 跳过不支持的字段
                }
                
                // 特殊处理keywords字段：将逗号分隔的字符串转为数组
                if (mappedKey === 'keywords' && typeof value === 'string') {
                  processedRow[mappedKey] = value.split(',').map(k => k.trim()).filter(k => k)
                  continue
                }
                
                // 特殊处理tags字段：将逗号分隔的字符串转为数组
                if (mappedKey === 'tags' && typeof value === 'string') {
                  processedRow[mappedKey] = value.split(',').map(k => k.trim()).filter(k => k)
                  continue
                }
                
                // 尝试解析可能是JSON字符串的字段
                if (typeof value === 'string' && (
                  value.trim().startsWith('[') || 
                  value.trim().startsWith('{')
                )) {
                  try {
                    const parsed = JSON.parse(value)
                    
                    // 特殊处理：将authors的list转为dict格式
                    if (mappedKey === 'authors' && Array.isArray(parsed)) {
                      processedRow[mappedKey] = { members: parsed }
                    }
                    // 特殊处理：将inventors的list转为dict格式
                    else if (mappedKey === 'inventors' && Array.isArray(parsed)) {
                      processedRow[mappedKey] = { members: parsed }
                    }
                    // 特殊处理：将team_members的list转为dict格式
                    else if (mappedKey === 'team_members' && Array.isArray(parsed)) {
                      processedRow[mappedKey] = { members: parsed }
                    }
                    // 特殊处理：将related_projects的list转为dict格式
                    else if (mappedKey === 'related_projects' && Array.isArray(parsed)) {
                      processedRow[mappedKey] = { projects: parsed }
                    }
                    // 特殊处理：将developers的list转为dict格式
                    else if (mappedKey === 'developers' && Array.isArray(parsed)) {
                      processedRow[mappedKey] = { members: parsed }
                    }
                    // participants保持为list
                    else if (mappedKey === 'participants' && Array.isArray(parsed)) {
                      processedRow[mappedKey] = parsed.map(p => typeof p === 'string' ? p : p.name || '')
                    }
                    else {
                      processedRow[mappedKey] = parsed
                    }
                  } catch {
                    processedRow[mappedKey] = value
                  }
                } else {
                  processedRow[mappedKey] = value
                }
              }
              
              const response = await fetch(`http://localhost:8000${apiEndpoint}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(processedRow),
              })

              if (response.ok) {
                successCount++
              } else {
                const error = await response.json()
                failedCount++
                errors.push(`第${i + 1}行: ${error.detail || '导入失败'}`)
              }
            } catch (error) {
              failedCount++
              errors.push(`第${i + 1}行: ${error instanceof Error ? error.message : '网络错误'}`)
            }
          }

          setResult({ success: successCount, failed: failedCount, errors: errors.slice(0, 10) })
          
          if (successCount > 0 && onImportSuccess) {
            onImportSuccess()
          }
          
          setImporting(false)
        },
        error: (error) => {
          setResult({ success: 0, failed: 0, errors: [`CSV解析失败: ${error.message}`] })
          setImporting(false)
        }
      })
    } catch (error) {
      setResult({ success: 0, failed: 0, errors: [`导入失败: ${error instanceof Error ? error.message : '未知错误'}`] })
      setImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = sampleFields.join(',') + '\n'
    const blob = new Blob(['\ufeff' + template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${entityType}_template.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const resetDialog = () => {
    setFile(null)
    setResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 在客户端挂载前，不显示
  if (!mounted) {
    return null
  }

  // 权限检查：只有超级管理员可以批量导入
  if (!canImport) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        resetDialog()
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          批量导入
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>批量导入{entityName}</DialogTitle>
          <DialogDescription>
            上传CSV文件批量导入{entityName}数据
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 文件选择 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                选择CSV文件
              </Button>
              {file && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{file.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* 模板下载 */}
          {sampleFields.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                第一次导入？
                <Button
                  variant="link"
                  className="h-auto p-0 ml-1"
                  onClick={handleDownloadTemplate}
                >
                  下载CSV模板
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* 导入结果 */}
          {result && (
            <div className="space-y-2">
              {result.success > 0 && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    成功导入 {result.success} 条记录
                  </AlertDescription>
                </Alert>
              )}
              
              {result.failed > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div>失败 {result.failed} 条记录</div>
                    {result.errors.length > 0 && (
                      <div className="mt-2 text-xs space-y-1">
                        {result.errors.map((error, index) => (
                          <div key={index}>• {error}</div>
                        ))}
                        {result.failed > result.errors.length && (
                          <div>• ... 还有 {result.failed - result.errors.length} 条错误</div>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* 使用说明 */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="font-medium">使用说明：</div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>下载CSV模板或使用系统生成的示例数据</li>
              <li>填写数据（确保格式正确）</li>
              <li>保存为UTF-8编码的CSV文件</li>
              <li>点击"选择CSV文件"上传</li>
              <li>点击"开始导入"执行批量导入</li>
            </ol>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              resetDialog()
            }}
            disabled={importing}
          >
            取消
          </Button>
          <Button
            onClick={handleImport}
            disabled={!file || importing}
          >
            {importing ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                导入中...
              </>
            ) : (
              '开始导入'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
