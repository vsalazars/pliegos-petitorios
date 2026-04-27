"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { DashboardState } from "@/components/dashboard/shared/dashboard-state"
import { NewPliegoDialog } from "@/components/dashboard/unit/new-pliego-dialog"
import { UnitPageHeader } from "@/components/dashboard/unit/unit-page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { UnidadPliego } from "@/lib/unidad-dashboard"

type UnidadPliegosResponse = {
  user: AuthUser
  items: UnidadPliego[]
  total: number
}

export function UnitPliegosPage() {
  const [data, setData] = useState<UnidadPliegosResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    try {
      const response = await fetch("/api/unidad/pliegos", { cache: "no-store" })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload.error ?? "No fue posible cargar los pliegos.")
        return
      }

      setError(null)
      setData(payload)
    } catch {
      setError("No fue posible conectar con el backend de pliegos.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await load()
    })()
  }, [])

  if (isLoading) {
    return (
      <DashboardState
        title="Cargando pliegos"
        description="Estamos consultando el listado completo de pliegos de la unidad."
      />
    )
  }

  if (error || !data) {
    return (
      <DashboardState
        title="No pudimos abrir tus pliegos"
        description={error ?? "Intenta iniciar sesión otra vez para recuperar la sesión."}
      />
    )
  }

  const orderedItems = [...data.items].sort(
    (left, right) =>
      new Date(left.fecha_registro).getTime() -
      new Date(right.fecha_registro).getTime(),
  )

  return (
    <div className="space-y-6">
      <UnitPageHeader
        eyebrow="Gestión de pliegos"
        title="Pliegos petitorios"
        description="Consulta el listado actual y prepara el siguiente paso para registrar nuevos pliegos desde la unidad académica."
        actions={<NewPliegoDialog onCreated={load} />}
      />

      <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-2xl text-[#5f1024]">
            Listado de pliegos
          </CardTitle>
          <CardDescription>
            {data.total} registros visibles para la unidad autenticada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6">
          {orderedItems.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Todavía no hay pliegos registrados para esta unidad.
            </div>
          ) : (
            orderedItems.map((item) => (
              <PliegoListItem key={item.id} item={item} onChanged={load} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PliegoListItem({
  item,
  onChanged,
}: {
  item: UnidadPliego
  onChanged: () => Promise<void> | void
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [form, setForm] = useState({
    folio: item.folio,
    titulo: item.titulo,
    descripcion: item.descripcion ?? "",
    periodo: item.periodo ?? "",
    anio: String(new Date().getFullYear()),
    fecha_recepcion: toDateInputValue(item.fecha_recepcion),
  })

  const resetForm = () => {
    setForm({
      folio: item.folio,
      titulo: item.titulo,
      descripcion: item.descripcion ?? "",
      periodo: item.periodo ?? "",
      anio: String(new Date().getFullYear()),
      fecha_recepcion: toDateInputValue(item.fecha_recepcion),
    })
  }

  const handleDelete = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/unidad/pliegos/${item.id}`, {
        method: "DELETE",
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible eliminar el pliego.")
        return
      }

      await onChanged()
      setDeleteOpen(false)
      toast.success(payload.message ?? "Pliego eliminado correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend de pliegos.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      const response = await fetch(`/api/unidad/pliegos/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folio: form.folio.trim(),
          titulo: form.titulo.trim(),
          descripcion: emptyToNull(form.descripcion),
          periodo: emptyToNull(form.periodo),
          anio: form.anio.trim() === "" ? null : Number(form.anio),
          fecha_recepcion: form.fecha_recepcion,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible actualizar el pliego.")
        return
      }

      setEditOpen(false)
      await onChanged()
      toast.success(payload.message ?? "Pliego actualizado correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend de pliegos.")
    }
  }

  return (
    <>
      <Link
        href={`/dashboard/unidad/pliegos/${item.id}`}
        className="block rounded-[1.5rem] border border-[#ece8ec] bg-white px-4 py-4 transition hover:border-[#d8c5cc] hover:bg-[#fffdfd] hover:shadow-[0_12px_28px_rgba(95,16,36,0.06)]"
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1">
              <p className="truncate text-base font-medium text-[#3f4046]">{item.titulo}</p>
              <p className="text-sm text-[#7a7a81]">{item.folio}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              aria-label={`Editar pliego ${item.folio}`}
              title="Editar pliego"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                resetForm()
                setEditOpen(true)
              }}
              className="h-9 rounded-full border-[#d6d0d6] px-3 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
            >
              <Pencil className="size-4" />
              Editar
            </Button>
            <Button
              type="button"
              variant="outline"
              aria-label={`Eliminar pliego ${item.folio}`}
              title="Eliminar pliego"
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setDeleteOpen(true)
              }}
              className="h-9 rounded-full border-[#ead5db] px-3 text-[#7a1730] hover:border-[#7a1730] hover:bg-[#fbf5f7]"
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#66666d]">
          <ListMeta label="Recepción" value={formatDate(item.fecha_recepcion)} tone="slate" />
          <ListMeta label="Registro" value={formatDate(item.fecha_registro)} tone="slate" />
          <ListMeta
            label="Revisión final"
            value={item.texto_revision_final ? "Disponible" : "Pendiente"}
            tone={item.texto_revision_final ? "green" : "amber"}
          />
        </div>
      </Link>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl rounded-[1.8rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)] sm:max-w-2xl">
          <div className="p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Editar pliego
              </DialogTitle>
              <DialogDescription className="text-sm leading-7 text-[#65656d]">
                Actualiza la información principal del pliego sin alterar sus puntos registrados.
              </DialogDescription>
            </DialogHeader>

            <form className="mt-8 space-y-5" onSubmit={(event) => void handleEditSubmit(event)}>
              <div className="grid gap-5 md:grid-cols-2">
                <PliegoField
                  id={`folio-${item.id}`}
                  label="Folio"
                  value={form.folio}
                  onChange={(value) => setForm((current) => ({ ...current, folio: value }))}
                />
                <PliegoField
                  id={`fecha_recepcion-${item.id}`}
                  label="Fecha de recepción"
                  type="date"
                  value={form.fecha_recepcion}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, fecha_recepcion: value }))
                  }
                />
              </div>

              <PliegoField
                id={`titulo-${item.id}`}
                label="Título"
                value={form.titulo}
                onChange={(value) => setForm((current) => ({ ...current, titulo: value }))}
              />

              <div className="grid gap-5 md:grid-cols-[1fr_180px]">
                <PliegoField
                  id={`periodo-${item.id}`}
                  label="Periodo"
                  value={form.periodo}
                  onChange={(value) => setForm((current) => ({ ...current, periodo: value }))}
                />
                <PliegoReadonlyField label="Año" value={form.anio} />
              </div>

              <PliegoTextArea
                id={`descripcion-${item.id}`}
                label="Descripción"
                value={form.descripcion}
                onChange={(value) =>
                  setForm((current) => ({ ...current, descripcion: value }))
                }
              />

              <div className="flex flex-col-reverse gap-3 border-t border-[#ebe6ea] pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditOpen(false)}
                  className="h-11 rounded-full border-[#d7d1d6] px-5 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    form.folio.trim() === "" ||
                    form.titulo.trim() === "" ||
                    form.fecha_recepcion.trim() === ""
                  }
                  className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#4f0d1d]"
                >
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-lg rounded-[1.8rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)] sm:max-w-lg">
          <div className="p-6 sm:p-7">
            <DialogHeader>
              <DialogTitle className="font-heading text-2xl tracking-tight text-[#5f1024]">
                Eliminar pliego
              </DialogTitle>
              <DialogDescription className="text-sm leading-7 text-[#65656d]">
                Esta acción eliminará el pliego{" "}
                <span className="font-medium text-[#4a4a52]">&quot;{item.titulo}&quot;</span>{" "}
                y también sus puntos registrados. No se podrá deshacer.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 rounded-2xl border border-[#f0d9df] bg-[#fdf7f8] px-4 py-4 text-sm leading-7 text-[#7a1730]">
              Confirma solo si ya no necesitas conservar este pliego dentro de la unidad académica.
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={isDeleting}
                onClick={() => setDeleteOpen(false)}
                className="h-11 rounded-full border-[#d7d1d6] px-5 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={isDeleting}
                onClick={(event) => void handleDelete(event)}
                className="h-11 rounded-full bg-[#7a1730] px-5 text-white hover:bg-[#681328]"
              >
                {isDeleting ? "Eliminando..." : "Eliminar pliego"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ListMeta({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "slate" | "green" | "amber" | "rose"
}) {
  const toneClassName = {
    slate: "bg-[#f2f4f7] text-[#55606d]",
    green: "bg-[#edf6f1] text-[#2f6b4f]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
    rose: "bg-[#f8ebef] text-[#8b2740]",
  }[tone]

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${toneClassName}`}
    >
      <span className="text-[11px] uppercase tracking-[0.16em] opacity-75">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}


function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function toDateInputValue(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function PliegoField({
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
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
      />
    </div>
  )
}

function PliegoTextArea({
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
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-28 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 py-3 text-sm text-[#35353b] outline-none transition placeholder:text-[#9a9aa1] focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      />
    </div>
  )
}

function PliegoReadonlyField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]">{label}</Label>
      <div className="flex h-12 items-center rounded-2xl border border-dashed border-[#ddd9de] bg-[#faf7f8] px-4 text-sm font-medium text-[#5d5d65]">
        {value}
      </div>
    </div>
  )
}
