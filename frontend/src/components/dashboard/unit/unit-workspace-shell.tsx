"use client"

import {
  Eye,
  EyeOff,
  FileStack,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Pencil,
  X,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [unidadNombre, setUnidadNombre] = useState("Unidad Académica")
  const [sessionUser, setSessionUser] = useState<Pick<
    AuthUser,
    | "nombre"
    | "apellido_paterno"
    | "apellido_materno"
    | "correo"
    | "username"
    | "rol_nombre"
    | "rol_clave"
  > | null>(null)
  const [profileForm, setProfileForm] = useState({
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    correo: "",
    username: "",
    password: "",
    password_confirmation: "",
  })
  const [showProfilePassword, setShowProfilePassword] = useState(false)
  const [showProfilePasswordConfirmation, setShowProfilePasswordConfirmation] =
    useState(false)

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
          apellido_paterno: payload.user.apellido_paterno,
          apellido_materno: payload.user.apellido_materno,
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

  const openProfileEditor = () => {
    if (!sessionUser) {
      return
    }

    setProfileForm({
      nombre: (sessionUser.nombre ?? "").trim() || sessionUser.username,
      apellido_paterno: sessionUser.apellido_paterno ?? "",
      apellido_materno: sessionUser.apellido_materno ?? "",
      correo: sessionUser.correo,
      username: sessionUser.username,
      password: "",
      password_confirmation: "",
    })
    setIsProfileOpen(true)
  }

  const handleSaveProfile = async () => {
    if (!sessionUser) {
      return
    }

    if (profileForm.password !== profileForm.password_confirmation) {
      toast.error("La confirmación de contraseña no coincide.")
      return
    }

    setIsSavingProfile(true)
    try {
      const response = await fetch("/api/unidad/mi-cuenta", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: profileForm.nombre.trim(),
          apellido_paterno: emptyToNull(profileForm.apellido_paterno),
          apellido_materno: emptyToNull(profileForm.apellido_materno),
          correo: profileForm.correo.trim(),
          username: profileForm.username.trim(),
          password: profileForm.password.trim() === "" ? null : profileForm.password,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible actualizar tus datos.")
        return
      }

      setSessionUser({
        nombre: payload.item.nombre,
        apellido_paterno: payload.item.apellido_paterno,
        apellido_materno: payload.item.apellido_materno,
        correo: payload.item.correo,
        username: payload.item.username,
        rol_nombre: payload.item.rol_nombre,
        rol_clave: payload.item.rol_clave,
      })
      setIsProfileOpen(false)
      setProfileForm((current) => ({
        ...current,
        password: "",
        password_confirmation: "",
      }))
      toast.success("Tus datos se actualizaron correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSavingProfile(false)
    }
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
            <div className="my-3 h-px w-28 rounded-full bg-[#e4dde1]" aria-hidden="true" />
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
            <div className="flex items-start justify-between gap-3">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
                Sesión activa
              </p>
              <button
                type="button"
                onClick={openProfileEditor}
                className="inline-flex size-8 items-center justify-center rounded-full border border-[#e1d8dd] bg-white text-[#7a1730] transition hover:border-[#c9b2ba] hover:bg-[#fffdfd]"
                aria-label="Editar datos de la cuenta"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
            <p className="mt-2 truncate font-medium text-[#4a4a52]">
              {resolveSessionDisplayName(sessionUser)}
            </p>
            <p className="mt-1 truncate text-sm text-[#6c6c74]">{sessionUser.correo}</p>
            <div className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-[#7a1730] shadow-sm">
              {resolveRoleLabel(sessionUser.rol_nombre, sessionUser.rol_clave)}
            </div>
          </div>
        ) : null}

      </aside>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] rounded-[1.75rem] border border-[#e4dde1] bg-white p-0 sm:max-w-2xl">
          <div className="space-y-6 px-6 py-6">
            <DialogHeader className="space-y-2">
              <DialogTitle className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Editar mi cuenta
              </DialogTitle>
              <DialogDescription className="text-sm text-[#6b6b73]">
                Actualiza tus datos de acceso y, si lo necesitas, registra una nueva contraseña.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-nombre">Nombre</Label>
                <Input
                  id="profile-nombre"
                  value={profileForm.nombre}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                  className="h-12 rounded-2xl border-[#ddd9de]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-username">Usuario</Label>
                <Input
                  id="profile-username"
                  value={profileForm.username}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, username: event.target.value }))
                  }
                  className="h-12 rounded-2xl border-[#ddd9de]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-apellido-paterno">Apellido paterno</Label>
                <Input
                  id="profile-apellido-paterno"
                  value={profileForm.apellido_paterno}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      apellido_paterno: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border-[#ddd9de]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile-apellido-materno">Apellido materno</Label>
                <Input
                  id="profile-apellido-materno"
                  value={profileForm.apellido_materno}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      apellido_materno: event.target.value,
                    }))
                  }
                  className="h-12 rounded-2xl border-[#ddd9de]"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profile-correo">Correo institucional</Label>
                <Input
                  id="profile-correo"
                  type="email"
                  value={profileForm.correo}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, correo: event.target.value }))
                  }
                  className="h-12 rounded-2xl border-[#ddd9de]"
                />
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[#ece6e9] bg-[#fbf8f9] px-4 py-4">
              <div className="flex items-center gap-2 text-[#7a1730]">
                <KeyRound className="size-4" />
                <p className="text-sm font-medium">Cambiar contraseña</p>
              </div>
              <p className="mt-1 text-sm text-[#73737b]">
                Déjala vacía si quieres conservar la actual.
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile-password">Nueva contraseña</Label>
                  <div className="relative">
                    <Input
                      id="profile-password"
                      type={showProfilePassword ? "text" : "password"}
                      value={profileForm.password}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, password: event.target.value }))
                      }
                      className="h-12 rounded-2xl border-[#ddd9de] pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowProfilePassword((current) => !current)}
                      className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8a8a91] transition hover:bg-[#f5f1f3] hover:text-[#5f1024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d7de]"
                      aria-label={
                        showProfilePassword
                          ? "Ocultar nueva contraseña"
                          : "Mostrar nueva contraseña"
                      }
                      aria-pressed={showProfilePassword}
                    >
                      {showProfilePassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-password-confirmation">Confirmar contraseña</Label>
                  <div className="relative">
                    <Input
                      id="profile-password-confirmation"
                      type={showProfilePasswordConfirmation ? "text" : "password"}
                      value={profileForm.password_confirmation}
                      onChange={(event) =>
                        setProfileForm((current) => ({
                          ...current,
                          password_confirmation: event.target.value,
                        }))
                      }
                      className="h-12 rounded-2xl border-[#ddd9de] pr-12"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowProfilePasswordConfirmation((current) => !current)
                      }
                      className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#8a8a91] transition hover:bg-[#f5f1f3] hover:text-[#5f1024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d7de]"
                      aria-label={
                        showProfilePasswordConfirmation
                          ? "Ocultar confirmación de contraseña"
                          : "Mostrar confirmación de contraseña"
                      }
                      aria-pressed={showProfilePasswordConfirmation}
                    >
                      {showProfilePasswordConfirmation ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsProfileOpen(false)}
                className="h-11 rounded-full border-[#d6d0d6] px-5"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#741732]"
              >
                {isSavingProfile ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function resolveSessionDisplayName(
  user: Pick<
    AuthUser,
    "nombre" | "apellido_paterno" | "apellido_materno" | "username"
  >,
) {
  const parts = [
    user.nombre?.trim(),
    user.apellido_paterno?.trim(),
    user.apellido_materno?.trim(),
  ].filter((value): value is string => Boolean(value))

  if (parts.length > 0) {
    return parts.join(" ")
  }

  return user.username
}
