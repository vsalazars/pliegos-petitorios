"use client"

import { LoaderCircle, UserPlus } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { DESRole, DESUnidad } from "@/lib/des-admin"

type DESUserCreateFormProps = {
  unidades: DESUnidad[]
  roles: DESRole[]
  disabled?: boolean
  onCreated: () => Promise<void> | void
}

type FormState = {
  unidad_id: string
  rol_id: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string
  username: string
  password: string
}

const initialForm: FormState = {
  unidad_id: "",
  rol_id: "",
  nombre: "",
  apellido_paterno: "",
  apellido_materno: "",
  correo: "",
  username: "",
  password: "",
}

export function DESUserCreateForm({
  unidades,
  roles,
  disabled = false,
  onCreated,
}: DESUserCreateFormProps) {
  const [form, setForm] = useState<FormState>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const unidadRoles = useMemo(
    () => roles.filter((item) => item.clave.endsWith("_UNIDAD")),
    [roles],
  )

  const canSubmit =
    !disabled &&
    !isSubmitting &&
    form.unidad_id.trim() !== "" &&
    form.rol_id.trim() !== "" &&
    form.nombre.trim() !== "" &&
    form.correo.trim() !== "" &&
    form.username.trim() !== "" &&
    form.password.trim() !== ""

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidad_id: Number(form.unidad_id),
          rol_id: Number(form.rol_id),
          nombre: form.nombre.trim(),
          apellido_paterno: emptyToNull(form.apellido_paterno),
          apellido_materno: emptyToNull(form.apellido_materno),
          correo: form.correo.trim(),
          username: form.username.trim(),
          password: form.password,
          debe_cambiar_password: true,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible crear la cuenta.")
        return
      }

      setForm(initialForm)
      await onCreated()
      toast.success("Cuenta de unidad creada correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-2xl text-[#5f1024]">Crear cuenta de unidad</CardTitle>
        <CardDescription>
          Registra usuarios operativos para una unidad académica con acceso inmediato al sistema.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {disabled ? (
          <div className="rounded-2xl border border-[#ead5db] bg-[#fbf5f7] px-4 py-4 text-sm text-[#7a1730]">
            Esta acción está reservada para el perfil superadministrador DES.
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                id="unidad_id"
                label="Unidad académica"
                value={form.unidad_id}
                onChange={(value) => updateField("unidad_id", value)}
                options={unidades
                  .filter((item) => item.activo)
                  .map((item) => ({ value: String(item.id), label: `${item.clave} · ${item.nombre}` }))}
              />
              <SelectField
                id="rol_id"
                label="Perfil"
                value={form.rol_id}
                onChange={(value) => updateField("rol_id", value)}
                options={unidadRoles.map((item) => ({
                  value: String(item.id),
                  label: item.nombre,
                }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field id="nombre" label="Nombre" value={form.nombre} onChange={(v) => updateField("nombre", v)} />
              <Field id="apellido_paterno" label="Apellido paterno" value={form.apellido_paterno} onChange={(v) => updateField("apellido_paterno", v)} />
              <Field id="apellido_materno" label="Apellido materno" value={form.apellido_materno} onChange={(v) => updateField("apellido_materno", v)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field id="correo" label="Correo institucional" type="email" value={form.correo} onChange={(v) => updateField("correo", v)} />
              <Field id="username" label="Usuario" value={form.username} onChange={(v) => updateField("username", v)} />
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <Field id="password" label="Contraseña temporal" type="password" value={form.password} onChange={(v) => updateField("password", v)} />
              <Button
                type="submit"
                disabled={!canSubmit}
                className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#4f0d1d]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="size-4" />
                    Crear cuenta
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#5d5d65]">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
      />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#5d5d65]">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function emptyToNull(value: string) {
  const normalized = value.trim()
  return normalized === "" ? null : normalized
}
