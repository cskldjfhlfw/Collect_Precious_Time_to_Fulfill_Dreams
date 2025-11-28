"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  onSubmit?: () => void | Promise<void>
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  loading?: boolean
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl"
  maxHeight?: string
  className?: string
  footerClassName?: string
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  onSubmit,
  onCancel,
  submitText = "确定",
  cancelText = "取消",
  loading = false,
  maxWidth = "lg",
  maxHeight = "80vh",
  className,
  footerClassName,
}: FormDialogProps) {
  const handleSubmit = async () => {
    if (onSubmit) {
      await onSubmit()
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => !loading && onOpenChange(open)}>
      <DialogContent 
        className={cn(maxWidthClasses[maxWidth], "flex flex-col", className)}
        style={{ maxHeight }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-6 px-6 overflow-auto" style={{ height: `calc(${maxHeight} - 180px)`, minHeight: "300px" }}>
          <div className="space-y-4 py-2">
            {children}
          </div>
        </ScrollArea>

        {(onSubmit || onCancel) && (
          <DialogFooter className={cn("flex-shrink-0 pt-4", footerClassName)}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
            {onSubmit && (
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitText}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
