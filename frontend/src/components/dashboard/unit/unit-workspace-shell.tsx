"use client"

import { FileStack, LayoutDashboard, LogOut, Menu, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import type { AuthUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

const unitNavigation = [
  {
    href: "/dashboard/unidad",
    label: "Dashboard",
    Icon: LayoutDashboard,
  },
  {
    href: "/dashboard/unidad/pliegos",
    label: "Pliegos",
    Icon: FileStack,
  },
]

const titlesByPath: Record<string, { title: string; subtitle: string }> = {
  "/dashboard/unidad": {
    title: "Dashboard",
    subtitle: "Numeralia general y focos inmediatos de la unidad académica.",
  },
  "/dashboard/unidad/pliegos": {
    title: "Pliegos",
    subtitle: "Consulta los pliegos registrados y prepara la creación de nuevos ingresos.",
  },
}

type UnitWorkspaceShellProps = {
  children: React.ReactNode
}

export function UnitWorkspaceShell({ children }: UnitWorkspaceShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [unidadNombre, setUnidadNombre] = useState("Unidad Académica")
  const [sessionUser, setSessionUser] = useState<Pick<
    AuthUser,
    "nombre" | "correo" | "username" | "rol_nombre" | "rol_clave"
  > | null>(null)

  const headerCopy = useMemo(() => {
    if (pathname.startsWith("/dashboard/unidad/pliegos/")) {
      return {
        title: "Detalle de pliego",
        subtitle: "Revisa el documento, su estado actual y los puntos registrados.",
      }
    }

    return titlesByPath[pathname] ?? titlesByPath["/dashboard/unidad"]
  }, [pathname])

  useEffect(() => {
    const loadUnidad = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const payload = (await response.json()) as { user?: AuthUser; error?: string }

        if (!response.ok || !payload.user?.unidad_nombre) {
          return
        }

        setUnidadNombre(payload.user.unidad_nombre)
        setSessionUser({
          nombre: payload.user.nombre,
          correo: payload.user.correo,
          username: payload.user.username,
          rol_nombre: payload.user.rol_nombre,
          rol_clave: payload.user.rol_clave,
        })
      } catch {
        // keep fallback label when the session context cannot be resolved
      }
    }

    loadUnidad()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-transparent">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#ddd8de] bg-white/92 px-5 py-6 shadow-[12px_0_40px_rgba(69,42,49,0.08)] backdrop-blur transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <Image
                src="/logo-ipn.webp"
                alt="Instituto Politécnico Nacional"
                width={144}
                height={144}
                className="h-36 w-auto object-contain"
                priority
              />
            </div>
            <p className="font-heading text-2xl tracking-tight text-[#5f1024]">
              Administración de pliegos petitorios
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
              IPN · Secretaría Académica
            </p>
            <p className="text-xs text-[#8a8a91]">Dirección de Educación Superior</p>
            <p className="text-sm text-[#696971]">{unidadNombre}</p>
          </div>

          <button
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#ddd8de] text-[#5f1024] lg:hidden"
            onClick={() => setIsOpen(false)}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="mt-10 space-y-2">
          {unitNavigation.map((item) => {
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-[#5f1024] text-white shadow-sm"
                    : "text-[#5d5d65] hover:bg-[#f6f2f4] hover:text-[#5f1024]",
                )}
              >
                <item.Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        {sessionUser ? (
          <div className="mt-auto rounded-[1.4rem] border border-[#e7e0e4] bg-[#faf7f8] px-4 py-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
              Sesión activa
            </p>
            <p className="mt-2 truncate font-medium text-[#4a4a52]">
              {sessionUser.nombre?.trim() || sessionUser.username}
            </p>
            <p className="mt-1 truncate text-sm text-[#6c6c74]">{sessionUser.correo}</p>
            <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7a1730] shadow-sm">
              {resolveRoleLabel(sessionUser.rol_nombre, sessionUser.rol_clave)}
            </div>
          </div>
        ) : null}

      </aside>

      {isOpen ? (
        <button
          className="fixed inset-0 z-30 bg-[#2f2f34]/20 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-[#e4dde2] bg-white/80 backdrop-blur">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-10">
            <div className="flex items-center gap-3">
              <button
                className="inline-flex size-11 items-center justify-center rounded-full border border-[#ddd8de] bg-white text-[#5f1024] lg:hidden"
                onClick={() => setIsOpen(true)}
                type="button"
              >
                <Menu className="size-4" />
              </button>

              <div>
                <p className="font-heading text-2xl tracking-tight text-[#5f1024]">
                  {headerCopy.title}
                </p>
                <p className="text-sm text-[#6b6b73]">{headerCopy.subtitle}</p>
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
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}

function resolveRoleLabel(rolNombre?: string, rolClave?: string) {
  if (rolNombre?.trim()) {
    return rolNombre
  }

  switch (rolClave) {
    case "ADMIN_UNIDAD":
      return "Administrador de unidad"
    case "CAPTURISTA_UNIDAD":
      return "Capturista de unidad"
    case "CONSULTA_UNIDAD":
      return "Consulta de unidad"
    default:
      return "Unidad académica"
  }
}
