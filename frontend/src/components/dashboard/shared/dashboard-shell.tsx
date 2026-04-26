"use client"

import { LogOut } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { Button } from "@/components/ui/button"

type DashboardShellProps = {
  title: string
  subtitle: string
  badge: string
  children: React.ReactNode
  widthClassName?: string
  lockViewport?: boolean
}

export function DashboardShell({
  title,
  subtitle,
  badge,
  children,
  widthClassName,
  lockViewport = false,
}: DashboardShellProps) {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <main
      className={`mx-auto flex w-full flex-col px-5 py-6 sm:px-8 lg:px-10 ${
        lockViewport ? "h-screen overflow-hidden" : "min-h-screen"
      } ${
        widthClassName ?? "max-w-7xl"
      }`}
    >
      <header className="flex flex-col gap-4 rounded-[2rem] border border-[#ddd8de] bg-white/88 p-6 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-5 md:items-center">
          <div className="relative h-20 w-20 shrink-0">
            <Image
              src="/ipn.png"
              alt="Logo del IPN"
              fill
              className="object-contain"
              sizes="80px"
              priority
            />
          </div>

          <div className="space-y-2">
            <div className="inline-flex rounded-full bg-[#f3eaed] px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-[#7a1730]">
              {badge}
            </div>
            <h1 className="font-heading text-4xl tracking-tight text-[#5f1024]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-[#606068]">{subtitle}</p>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          disabled={isLoggingOut}
          variant="outline"
          className="h-11 rounded-full border-[#d6d0d6] bg-white px-5 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
        >
          <LogOut className="size-4" />
          {isLoggingOut ? "Saliendo..." : "Cerrar sesión"}
        </Button>
      </header>

      <div className={lockViewport ? "min-h-0 flex-1 overflow-hidden py-8" : "py-8"}>
        {children}
      </div>
    </main>
  )
}
