"use client"

import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { resolveDashboardPath } from "@/lib/auth"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function LoginPanel() {
  const router = useRouter()
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error ?? "No fue posible iniciar sesión.")
        return
      }

      toast.success("Sesión iniciada correctamente.")
      router.push(data.redirect_to ?? resolveDashboardPath(data.user.rol_clave))
      router.refresh()
    } catch {
      toast.error("No fue posible conectar con el servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="rounded-[1.45rem] border border-[#ddd9de] bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6">
      <Badge className="rounded-full border-0 bg-[#f3eaed] px-3 py-1 text-[10px] tracking-[0.18em] uppercase text-[#7a1730] hover:bg-[#f3eaed]">
        Acceso institucional
      </Badge>

      <div className="mt-4 space-y-1.5">
        <h2 className="font-heading text-3xl tracking-tight text-[#5f1024] sm:text-[2.2rem]">
          Iniciar sesión
        </h2>
        <p className="text-sm leading-6 text-[#63636b]">
          Ingresa con tu usuario y contraseña institucional.
        </p>
      </div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Field
            id="login"
            label="Usuario o correo"
            placeholder="usuario@ipn.mx"
            icon={<UserRound className="size-4" />}
            focusClassName="focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />

          <Field
            id="password"
            label="Contraseña"
            placeholder="••••••••"
            type={showPassword ? "text" : "password"}
            icon={<LockKeyhole className="size-4" />}
            focusClassName="focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            trailingAction={
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="inline-flex size-9 items-center justify-center rounded-full text-[#8a8a91] transition hover:bg-[#f5f1f3] hover:text-[#5f1024] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e8d7de]"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />

          <Button
            type="submit"
            disabled={isSubmitting || login.trim() === "" || password.trim() === ""}
            className="mt-1 h-10 w-full rounded-full bg-[#5f1024] text-sm font-semibold text-white hover:bg-[#4f0d1d]"
          >
            {isSubmitting ? "Entrando..." : "Continuar"}
          </Button>
      </form>
    </section>
  )
}

type FieldProps = {
  id: string
  label: string
  placeholder: string
  icon: React.ReactNode
  type?: string
  focusClassName: string
  value: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  trailingAction?: React.ReactNode
}

function Field({
  id,
  label,
  placeholder,
  icon,
  type = "text",
  focusClassName,
  value,
  onChange,
  trailingAction,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[#8a8a91]">
          {icon}
        </span>
        <Input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={cn(
            "h-11 rounded-[1.15rem] border-[#ddd9de] bg-white pl-11 text-sm text-[#35353b]",
            trailingAction ? "pr-12" : "pr-4",
            focusClassName,
          )}
        />
        {trailingAction ? (
          <span className="absolute inset-y-0 right-2 flex items-center">{trailingAction}</span>
        ) : null}
      </div>
    </div>
  )
}
