"use client"

import { LogOut, Menu } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type DESExecutiveMobileShellProps = {
  children: React.ReactNode
}

export function DESExecutiveMobileShell({
  children,
}: DESExecutiveMobileShellProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <main className="mx-auto h-screen w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-y-contain bg-[linear-gradient(180deg,#fff8fa_0%,#f7f1f4_34%,#eef4fb_100%)] px-4 py-4 pb-8 sm:max-w-md">
      <header className="sticky top-0 z-30 w-full overflow-hidden rounded-[1.8rem] border border-[#e2dbe0] bg-white/92 px-4 py-3.5 shadow-[0_12px_28px_rgba(95,16,36,0.08)] backdrop-blur">
        <div className="flex items-start gap-2.5">
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src="/ipn.png"
              alt="Logo del IPN"
              fill
              className="object-contain"
              sizes="48px"
              priority
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a8d93]">
              Dirección de Educación Superior
            </p>
            <h1 className="mt-1 font-heading text-[clamp(0.86rem,4.15vw,1.08rem)] leading-[1.14] tracking-tight text-[#5f1024]">
              Gestión de pliegos petitorios
            </h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full border border-[#ddd8de] bg-white text-[#5f1024]"
                aria-label="Abrir menú"
              >
                <Menu className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-[1.25rem] border border-[#e4dde1] p-2"
            >
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-[1rem] px-3 py-3 text-sm text-[#5d5d65]"
              >
                <LogOut className="size-4" />
                {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="pt-4">{children}</div>
    </main>
  )
}
