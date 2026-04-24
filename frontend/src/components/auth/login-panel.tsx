"use client"

import { LockKeyhole, UserRound } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

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
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
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
        setError(data.error ?? "No fue posible iniciar sesión.")
        return
      }

      router.push(data.redirect_to ?? resolveDashboardPath(data.user.rol_clave))
      router.refresh()
    } catch {
      setError("No fue posible conectar con el servidor.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="flex h-full flex-col justify-between rounded-[1.6rem] border border-[#ddd9de] bg-white p-6 shadow-sm">
      <div>
        <Badge className="rounded-full border-0 bg-[#f3eaed] px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-[#7a1730] hover:bg-[#f3eaed]">
          Acceso institucional
        </Badge>

        <div className="mt-5 space-y-2">
          <h2 className="font-heading text-4xl tracking-tight text-[#5f1024]">Iniciar sesión</h2>
          <p className="text-sm leading-7 text-[#63636b]">
            Usa tus credenciales institucionales. El sistema identifica automáticamente
            si perteneces a DES o a una unidad académica.
          </p>
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <Field
            id="login"
            label="Usuario o correo"
            placeholder="admin@ipn.mx"
            icon={<UserRound className="size-4" />}
            focusClassName="focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
            value={login}
            onChange={(event) => setLogin(event.target.value)}
          />

          <Field
            id="password"
            label="Contraseña"
            placeholder="••••••••"
            type="password"
            icon={<LockKeyhole className="size-4" />}
            focusClassName="focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {error ? (
            <div className="rounded-2xl border border-[#ead5db] bg-[#fbf5f7] px-4 py-3 text-sm text-[#7a1730]">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting || login.trim() === "" || password.trim() === ""}
            className="h-11 w-full rounded-full bg-[#5f1024] text-sm font-semibold text-white hover:bg-[#4f0d1d]"
          >
            {isSubmitting ? "Entrando..." : "Continuar"}
          </Button>
        </form>
      </div>

      <div className="mt-6 rounded-[1.3rem] border border-[#e1dde2] bg-[#faf7f8] px-4 py-3 text-sm leading-6 text-[#66666d]">
        Siguiente paso: conectar este formulario con <code>/auth/login</code> y redirigir
        automáticamente según el rol devuelto por backend.
      </div>
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
}: FieldProps) {
  return (
    <div className="space-y-2">
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
          className={cn("h-12 rounded-2xl border-[#ddd9de] bg-white pl-11 pr-4 text-sm text-[#35353b]", focusClassName)}
        />
      </div>
    </div>
  )
}
