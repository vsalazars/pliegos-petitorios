"use client"

import { LogIn } from "lucide-react"

import { LoginPanel } from "@/components/auth/login-panel"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

type AccessModalProps = {
  triggerLabel?: string
  triggerClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  hideTrigger?: boolean
}

export function AccessModal({
  triggerLabel = "Iniciar sesión",
  triggerClassName,
  open,
  onOpenChange,
  hideTrigger = false,
}: AccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button className={cn("h-11 rounded-full px-5 text-sm font-semibold", triggerClassName)}>
            <LogIn className="size-4" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-lg gap-0 overflow-hidden rounded-[1.75rem] border-0 bg-transparent p-0 shadow-none sm:max-w-lg">
        <div className="overflow-hidden rounded-[1.75rem] border border-[#ddd8de] bg-white/92 p-4 shadow-[0_24px_64px_rgba(64,42,48,0.16)] backdrop-blur sm:p-5">
          <DialogHeader className="sr-only">
            <DialogTitle>Acceso al sistema</DialogTitle>
          </DialogHeader>
          <div className="bg-white/95">
            <LoginPanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
