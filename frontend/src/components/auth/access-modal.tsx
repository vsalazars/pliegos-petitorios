"use client"

import { LogIn } from "lucide-react"

import { LoginPanel } from "@/components/auth/login-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
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

      <DialogContent className="max-w-4xl gap-0 overflow-hidden rounded-[2rem] border-0 bg-transparent p-0 shadow-none sm:max-w-4xl">
        <div className="grid overflow-hidden rounded-[2rem] border border-[#ddd8de] bg-white/92 shadow-[0_30px_80px_rgba(64,42,48,0.18)] backdrop-blur xl:grid-cols-[0.95fr_1.05fr]">
          <div className="bg-[#4e0f21] p-7 text-white">
            <DialogHeader>
              <Badge className="w-fit rounded-full border-0 bg-white/14 px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-white hover:bg-white/14">
                Acceso al sistema
              </Badge>
              <DialogTitle className="pt-5 font-heading text-4xl leading-none tracking-tight text-white sm:text-5xl">
                Un acceso simple para entrar al sistema.
              </DialogTitle>
              <DialogDescription className="max-w-md text-sm leading-7 text-white/78">
                Ingresa con tu usuario institucional. El sistema identifica
                automáticamente si tu perfil corresponde a DES o a una unidad académica.
              </DialogDescription>
            </DialogHeader>

            <Separator className="my-6 bg-white/12" />

            <div className="mt-6 space-y-4">
              <p className="text-sm leading-7 text-white/78">
                Después del login, el acceso se resuelve según tu rol y se mostrará
                la experiencia correspondiente.
              </p>

              <ul className="space-y-3">
                {[
                  "Acceso para DES y unidades académicas",
                  "Una sola autenticación para todo el sistema",
                  "Redirección según rol y alcance institucional",
                ].map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-sm text-white/86">
                    <span className="size-2 rounded-full bg-[#d4d4d8]" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white/95 p-6 sm:p-7">
            <LoginPanel />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
