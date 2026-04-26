"use client"

import { LoaderCircle, Pencil, Power } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  isDESRole,
  isUnidadRole,
  resolveFullName,
  resolveRoleDisplayName,
  resolveUserRoleDisplayName,
  type DESAccountScope,
  type DESRole,
  type DESUnidad,
  type DESUser,
} from "@/lib/des-admin"

type DESUserListProps = {
  users: DESUser[]
  unidades: DESUnidad[]
  roles: DESRole[]
  scope: DESAccountScope
  disabled?: boolean
  onSaved: () => Promise<void> | void
}

type EditFormState = {
  ambito: DESAccountScope
  unidad_id: string
  rol_id: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  correo: string
  username: string
  password: string
}

export function DESUserList({
  users,
  unidades,
  roles,
  scope,
  disabled = false,
  onSaved,
}: DESUserListProps) {
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<EditFormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [togglingUserId, setTogglingUserId] = useState<number | null>(null)

  const pageSize = 2

  const unidadRoles = useMemo(
    () => roles.filter((item) => item.clave.endsWith("_UNIDAD")),
    [roles],
  )
  const desRoles = useMemo(
    () => roles.filter((item) => isDESRole(item.clave)),
    [roles],
  )

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const scopedUsers = users.filter((item) =>
      scope === "DES" ? isDESRole(item.rol_clave) : isUnidadRole(item.rol_clave),
    )

    if (normalizedSearch === "") {
      return scopedUsers
    }

    return scopedUsers.filter((item) => {
      const fullName = resolveFullName(item).toLowerCase()
      const unidadLabel = `${item.unidad_clave ?? ""} ${item.unidad_nombre ?? ""}`.toLowerCase()

      return (
        fullName.includes(normalizedSearch) ||
        item.correo.toLowerCase().includes(normalizedSearch) ||
        item.username.toLowerCase().includes(normalizedSearch) ||
        item.rol_nombre.toLowerCase().includes(normalizedSearch) ||
        unidadLabel.includes(normalizedSearch)
      )
    })
  }, [scope, search, users])

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize))
  const effectiveCurrentPage = Math.min(currentPage, pageCount)
  const paginatedUsers = filteredUsers.slice(
    (effectiveCurrentPage - 1) * pageSize,
    effectiveCurrentPage * pageSize,
  )

  const startEditing = (user: DESUser) => {
    setEditingUserId(user.id)
    setEditForm({
      ambito: isUnidadRole(user.rol_clave) ? "UNIDAD" : "DES",
      unidad_id: String(user.unidad_id ?? ""),
      rol_id: String(user.rol_id),
      nombre: user.nombre,
      apellido_paterno: user.apellido_paterno ?? "",
      apellido_materno: user.apellido_materno ?? "",
      correo: user.correo,
      username: user.username,
      password: "",
    })
  }

  const cancelEditing = () => {
    setEditingUserId(null)
    setEditForm(null)
  }

  const saveUser = async (userId: number) => {
    if (!editForm) {
      return
    }

    if (editForm.ambito === "UNIDAD" && editForm.unidad_id.trim() === "") {
      toast.error("Selecciona una unidad académica para esta cuenta.")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/usuarios/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unidad_id: editForm.ambito === "DES" ? null : Number(editForm.unidad_id),
          rol_id: Number(editForm.rol_id),
          nombre: editForm.nombre.trim(),
          apellido_paterno: emptyToNull(editForm.apellido_paterno),
          apellido_materno: emptyToNull(editForm.apellido_materno),
          correo: editForm.correo.trim(),
          username: editForm.username.trim(),
          password: editForm.password.trim() === "" ? null : editForm.password,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible actualizar la cuenta.")
        return
      }

      await onSaved()
      cancelEditing()
      toast.success("Cuenta actualizada correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActivo = async (user: DESUser) => {
    setTogglingUserId(user.id)
    try {
      const response = await fetch(`/api/admin/usuarios/${user.id}/activo`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activo: !user.activo,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible actualizar el estado de la cuenta.")
        return
      }

      await onSaved()
      toast.success(user.activo ? "Cuenta desactivada correctamente." : "Cuenta activada correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setTogglingUserId(null)
    }
  }

  return (
    <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-2xl text-[#5f1024]">
          {scope === "DES" ? "Cuentas DES" : "Cuentas de unidades"}
        </CardTitle>
        <CardDescription>
          {scope === "DES"
            ? "Usuarios DES ya registrados, con perfil ejecutivo u operativo y estado de acceso."
            : "Usuarios de unidad ya registrados, con perfil, unidad y estado de acceso."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-6 pb-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setCurrentPage(1)
              }}
              placeholder={
                scope === "DES"
                  ? "Buscar por nombre, usuario, correo o perfil DES"
                  : "Buscar por nombre, usuario, correo, perfil o unidad"
              }
              className="h-11 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
            />
            <p className="text-sm text-[#7a7a81]">
              {filteredUsers.length} cuenta(s) · página {effectiveCurrentPage} de {pageCount}
            </p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
            {users.length === 0
              ? scope === "DES"
                ? "Todavía no hay cuentas DES registradas."
                : "Todavía no hay cuentas de unidad registradas."
              : "No encontramos cuentas con ese criterio de búsqueda."}
          </div>
        ) : (
          paginatedUsers.map((item) => (
            <div
              key={item.id}
              className="rounded-[1.35rem] border border-[#ece8ec] bg-white px-4 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#404149]">{resolveFullName(item)}</p>
                  <p className="mt-1 text-sm text-[#73737b]">{item.correo}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    item.activo
                      ? "bg-[#edf6f1] text-[#2f6b4f]"
                      : "bg-[#f2f4f7] text-[#55606d]"
                  }`}
                >
                  {item.activo ? "Activa" : "Inactiva"}
                </span>
              </div>

              {editingUserId === item.id && editForm ? (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <SelectField
                      id={`rol-${item.id}`}
                      label="Perfil"
                      value={editForm.rol_id}
                      onChange={(value) =>
                        setEditForm((current) => (current ? { ...current, rol_id: value } : current))
                      }
                      options={(scope === "DES" ? desRoles : unidadRoles).map((rol) => ({
                        value: String(rol.id),
                        label: resolveRoleDisplayName(rol),
                      }))}
                    />
                  </div>

                  {scope === "UNIDAD" ? (
                    <SelectField
                      id={`unidad-${item.id}`}
                      label="Unidad académica"
                      value={editForm.unidad_id}
                      onChange={(value) =>
                        setEditForm((current) => (current ? { ...current, unidad_id: value } : current))
                      }
                      options={unidades
                        .filter((unidad) => unidad.activo)
                        .map((unidad) => ({
                          value: String(unidad.id),
                          label: `${unidad.clave} · ${unidad.nombre}`,
                        }))}
                    />
                  ) : null}

                  <div className="grid gap-4 md:grid-cols-3">
                    <Field
                      id={`nombre-${item.id}`}
                      label="Nombre"
                      value={editForm.nombre}
                      onChange={(value) =>
                        setEditForm((current) => (current ? { ...current, nombre: value } : current))
                      }
                    />
                    <Field
                      id={`apellido-paterno-${item.id}`}
                      label="Apellido paterno"
                      value={editForm.apellido_paterno}
                      onChange={(value) =>
                        setEditForm((current) =>
                          current ? { ...current, apellido_paterno: value } : current,
                        )
                      }
                    />
                    <Field
                      id={`apellido-materno-${item.id}`}
                      label="Apellido materno"
                      value={editForm.apellido_materno}
                      onChange={(value) =>
                        setEditForm((current) =>
                          current ? { ...current, apellido_materno: value } : current,
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id={`correo-${item.id}`}
                      label="Correo"
                      value={editForm.correo}
                      onChange={(value) =>
                        setEditForm((current) => (current ? { ...current, correo: value } : current))
                      }
                    />
                    <Field
                      id={`username-${item.id}`}
                      label="Usuario"
                      value={editForm.username}
                      onChange={(value) =>
                        setEditForm((current) => (current ? { ...current, username: value } : current))
                      }
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id={`password-${item.id}`}
                      label="Nueva contraseña"
                      type="password"
                      value={editForm.password}
                      onChange={(value) =>
                        setEditForm((current) => (current ? { ...current, password: value } : current))
                      }
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={() => void saveUser(item.id)}
                      className="h-10 rounded-full bg-[#5f1024] px-4 text-white hover:bg-[#4f0d1d]"
                    >
                      {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                      Guardar cambios
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSaving}
                      onClick={cancelEditing}
                      className="h-10 rounded-full border-[#d6d0d6] px-4 text-[#5d5d65]"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#66666d]">
                    <span>Usuario {item.username}</span>
                    <span>{resolveUserRoleDisplayName(item)}</span>
                    <span>
                      {item.unidad_clave
                        ? `${item.unidad_clave} · ${item.unidad_nombre}`
                        : "DES · Dirección de Educación Superior"}
                    </span>
                  </div>

                  {!disabled ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => startEditing(item)}
                        className="h-9 rounded-full border-[#d6d0d6] px-3 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
                      >
                        <Pencil className="size-4" />
                        Editar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={togglingUserId === item.id}
                        onClick={() => void toggleActivo(item)}
                        className={`h-9 rounded-full px-3 ${
                          item.activo
                            ? "border-[#ead5db] text-[#7a1730] hover:border-[#7a1730] hover:bg-[#fbf5f7]"
                            : "border-[#d8e5db] text-[#2f6b4f] hover:border-[#2f6b4f] hover:bg-[#f5faf6]"
                        }`}
                      >
                        {togglingUserId === item.id ? (
                          <LoaderCircle className="size-4 animate-spin" />
                        ) : (
                          <Power className="size-4" />
                        )}
                        {item.activo ? "Desactivar" : "Activar"}
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          ))
        )}

        {filteredUsers.length > pageSize ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-[#7a7a81]">
              Mostrando {Math.min((effectiveCurrentPage - 1) * pageSize + 1, filteredUsers.length)} -{" "}
              {Math.min(effectiveCurrentPage * pageSize, filteredUsers.length)} de {filteredUsers.length}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={effectiveCurrentPage === 1}
                onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
                className="h-9 rounded-full border-[#d6d0d6] px-4 text-[#5d5d65]"
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={effectiveCurrentPage === pageCount}
                onClick={() => setCurrentPage((current) => Math.min(pageCount, current + 1))}
                className="h-9 rounded-full border-[#d6d0d6] px-4 text-[#5d5d65]"
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-[#5d5d65]">
        {label}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
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
        className="h-11 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
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
