"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Filter, X, RotateCcw, Settings2 } from "lucide-react"

export interface FilterConfig {
  key: string
  label: string
  type: "select" | "input" | "date" | "dateRange"
  options?: { value: string; label: string }[]
  placeholder?: string
}

export interface FilterValue {
  [key: string]: any
}

interface FilterPanelProps {
  configs: FilterConfig[]
  values: FilterValue
  onChange: (values: FilterValue) => void
  onClear?: () => void
  className?: string
  variant?: "popover" | "sheet" | "inline"
  triggerText?: string
  showActiveCount?: boolean
}

export function FilterPanel({
  configs,
  values,
  onChange,
  onClear,
  className = "",
  variant = "popover",
  triggerText = "筛选",
  showActiveCount = true,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false)

  const activeFilters = Object.entries(values).filter(([key, value]) => {
    if (typeof value === "string") return value.trim() !== ""
    if (typeof value === "object" && value !== null) {
      return Object.values(value).some(v => v && String(v).trim() !== "")
    }
    return value !== null && value !== undefined && value !== ""
  })

  const handleValueChange = (key: string, newValue: any) => {
    onChange({
      ...values,
      [key]: newValue,
    })
  }

  const handleClear = () => {
    const clearedValues: FilterValue = {}
    configs.forEach(config => {
      if (config.type === "dateRange") {
        clearedValues[config.key] = { start: "", end: "" }
      } else {
        clearedValues[config.key] = ""
      }
    })
    onChange(clearedValues)
    onClear?.()
  }

  const renderFilterInput = (config: FilterConfig) => {
    const value = values[config.key]

    switch (config.type) {
      case "select":
        return (
          <Select
            value={value || undefined}
            onValueChange={(newValue) => handleValueChange(config.key, newValue === "___CLEAR___" ? "" : newValue)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder={config.placeholder || "请选择"} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((option) => (
                <SelectItem 
                  key={option.value || "___CLEAR___"} 
                  value={option.value || "___CLEAR___"}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "input":
        return (
          <Input
            placeholder={config.placeholder || "输入关键词"}
            value={value || ""}
            onChange={(e) => handleValueChange(config.key, e.target.value)}
            className="h-9"
          />
        )

      case "date":
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => handleValueChange(config.key, e.target.value)}
            className="h-9"
          />
        )

      case "dateRange":
        return (
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="开始日期"
              value={value?.start || ""}
              onChange={(e) => handleValueChange(config.key, { ...value, start: e.target.value })}
              className="h-9"
            />
            <Input
              type="date"
              placeholder="结束日期"
              value={value?.end || ""}
              onChange={(e) => handleValueChange(config.key, { ...value, end: e.target.value })}
              className="h-9"
            />
          </div>
        )

      default:
        return null
    }
  }

  const renderActiveFilters = () => {
    if (activeFilters.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {activeFilters.map(([key, value]) => {
          const config = configs.find(c => c.key === key)
          if (!config) return null

          let displayValue = ""
          if (config.type === "dateRange" && typeof value === "object") {
            const parts = []
            if (value.start) parts.push(`从 ${value.start}`)
            if (value.end) parts.push(`到 ${value.end}`)
            displayValue = parts.join(" ")
          } else if (config.type === "select") {
            const option = config.options?.find(opt => opt.value === value)
            displayValue = option?.label || value
          } else {
            displayValue = String(value)
          }

          return (
            <Badge
              key={key}
              variant="secondary"
              className="text-xs h-6 px-2 gap-1"
            >
              <span className="text-muted-foreground">{config.label}:</span>
              <span>{displayValue}</span>
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => {
                  if (config.type === "dateRange") {
                    handleValueChange(key, { start: "", end: "" })
                  } else {
                    handleValueChange(key, "")
                  }
                }}
              />
            </Badge>
          )
        })}
      </div>
    )
  }

  const FilterContent = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">筛选条件</h4>
        {activeFilters.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 px-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            清除
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {configs.map((config) => (
          <div key={config.key} className="space-y-2">
            <Label className="text-xs font-medium">{config.label}</Label>
            {renderFilterInput(config)}
          </div>
        ))}
      </div>

      {variant === "sheet" && (
        <div className="pt-4 border-t">
          <Button
            onClick={() => setOpen(false)}
            className="w-full"
            size="sm"
          >
            应用筛选
          </Button>
        </div>
      )}
    </div>
  )

  if (variant === "inline") {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">筛选条件</span>
            {showActiveCount && activeFilters.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {activeFilters.length}
              </Badge>
            )}
          </div>
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-7 px-2 text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              清除
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {configs.map((config) => (
            <div key={config.key} className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{config.label}</Label>
              {renderFilterInput(config)}
            </div>
          ))}
        </div>

        {renderActiveFilters()}
      </div>
    )
  }

  const TriggerButton = (
    <Button
      variant="outline"
      size="sm"
      className={`gap-2 ${className}`}
    >
      <Filter className="h-4 w-4" />
      {triggerText}
      {showActiveCount && activeFilters.length > 0 && (
        <Badge variant="secondary" className="h-4 px-1.5 text-xs ml-1">
          {activeFilters.length}
        </Badge>
      )}
    </Button>
  )

  if (variant === "sheet") {
    return (
      <div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            {TriggerButton}
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle>筛选条件</SheetTitle>
              <SheetDescription>
                设置筛选条件来精确查找内容
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
        {renderActiveFilters()}
      </div>
    )
  }

  return (
    <div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {TriggerButton}
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <FilterContent />
        </PopoverContent>
      </Popover>
      {renderActiveFilters()}
    </div>
  )
}
