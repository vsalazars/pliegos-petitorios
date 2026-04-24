"use client"

import { LoaderCircle, Pencil, Save, SendHorizonal, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PointAttentionDialog } from "@/components/dashboard/unit/point-attention-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CategoriaPuntoOption, PrioridadOption } from "@/lib/punto-catalogos"
import type { UnidadPliegoPunto } from "@/lib/unidad-dashboard"

type UnitPliegoPointCardProps = {
  pliegoId: number
  punto: UnidadPliegoPunto
  evidenceCount: number
  prioridades: PrioridadOption[]
  categorias: CategoriaPuntoOption[]
  onSaved: () => Promise<void> | void
}

export function UnitPliegoPointCard({
  pliegoId,
  punto,
  evidenceCount,
  prioridades,
  categorias,
  onSaved,
}: UnitPliegoPointCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(punto.texto_final)
  const [draftPrioridadId, setDraftPrioridadId] = useState(String(punto.prioridad_id))
  const [draftCategoriaId, setDraftCategoriaId] = useState(
    punto.categoria_id ? String(punto.categoria_id) : "",
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false)
  const [sendComment, setSendComment] = useState("")

  const canSendToDES = !punto.requiere_validacion && evidenceCount > 0

  const handleCancel = () => {
    setDraft(punto.texto_final)
    setDraftPrioridadId(String(punto.prioridad_id))
    setDraftCategoriaId(punto.categoria_id ? String(punto.categoria_id) : "")
    setIsEditing(false)
  }

  const handleSave = async () => {
    const normalizedDraft = draft.trim()
    if (normalizedDraft === "" || draftPrioridadId.trim() === "") {
      toast.error("Texto final y prioridad son obligatorios.")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(
        `/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}/completo`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texto_final: normalizedDraft,
            prioridad_id: Number(draftPrioridadId),
            estado_punto_id: punto.estado_punto_id,
            categoria_id:
              draftCategoriaId.trim() === "" ? null : Number(draftCategoriaId),
          }),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible actualizar el texto final.")
        return
      }

      setIsEditing(false)
      await onSaved()
      toast.success(`Punto ${punto.numero_punto} actualizado.`)
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(
        `/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}`,
        {
          method: "DELETE",
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible eliminar el punto.")
        return
      }

      setIsDeleteDialogOpen(false)
      await onSaved()
      toast.success(`Punto ${punto.numero_punto} eliminado.`)
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSendToDES = async () => {
    if (!canSendToDES) {
      toast.error("Agrega al menos una evidencia antes de enviar a DES.")
      return
    }

    setIsSending(true)

    try {
      const response = await fetch(
        `/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}/enviar-validacion`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comentario: sendComment.trim() === "" ? null : sendComment.trim(),
          }),
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible enviar el punto a DES.")
        return
      }

      setIsSendDialogOpen(false)
      setSendComment("")
      await onSaved()
      toast.success(`Punto ${punto.numero_punto} enviado a revisión DES.`)
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <article className="rounded-[1.35rem] border border-[#ece8ec] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="font-medium text-[#3f4046]">Punto {punto.numero_punto}</p>
            {!isEditing ? (
              <div className="flex flex-wrap items-center gap-2">
                <MetaBadge
                  label="Registro"
                  value={formatDate(punto.fecha_registro)}
                  tone="slate"
                />
                <MetaBadge
                  label="Prioridad"
                  value={punto.prioridad_nombre}
                  tone={resolvePriorityTone(punto.prioridad_clave)}
                />
                {punto.categoria_nombre ? (
                  <MetaBadge
                    label="Categoría"
                    value={punto.categoria_nombre}
                    tone="green"
                  />
                ) : null}
                <MetaBadge
                  label="Estado"
                  value={resolveDisplayStatus(punto)}
                  tone={resolveStatusToneForDisplay(punto)}
                />
                <MetaBadge
                  label="Evidencias"
                  value={String(evidenceCount)}
                  tone={resolveEvidenceTone(punto, evidenceCount)}
                />
              </div>
            ) : null}
          </div>

          {isEditing ? (
            <div className="mt-3 space-y-3">
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  id={`prioridad-${punto.id}`}
                  label="Prioridad"
                  value={draftPrioridadId}
                  onChange={setDraftPrioridadId}
                  options={prioridades.map((item) => ({
                    value: String(item.id),
                    label: item.nombre,
                  }))}
                />
                <SelectField
                  id={`categoria-${punto.id}`}
                  label="Categoría"
                  value={draftCategoriaId}
                  onChange={setDraftCategoriaId}
                  options={categorias.map((item) => ({
                    value: String(item.id),
                    label: item.nombre,
                  }))}
                  placeholder="Sin categoría"
                />
              </div>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-32 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 py-3 text-sm leading-7 text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || isDeleting}
                  className="h-10 rounded-full bg-[#5f1024] px-4 text-white hover:bg-[#4f0d1d]"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Guardar texto final
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving || isDeleting}
                  className="h-10 rounded-full border-[#d6d0d6] bg-white px-4 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 text-[#4c4c54]">{punto.texto_final}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-start justify-end gap-2">
          {!isEditing ? (
            <>
              <ActionTooltip label="Adjuntar y revisar evidencias">
                <PointAttentionDialog
                  pliegoId={pliegoId}
                  punto={punto}
                  onSaved={onSaved}
                />
              </ActionTooltip>
              <ActionTooltip
                label={
                  canSendToDES
                    ? "Enviar a revisión DES"
                    : punto.requiere_validacion
                      ? "Punto ya enviado a DES"
                      : "Agrega evidencia antes de enviar"
                }
              >
                <AlertDialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      disabled={!canSendToDES || isSending}
                      aria-label={`Enviar punto ${punto.numero_punto} a revisión DES`}
                      className="size-10 rounded-full bg-[#7a1730] p-0 text-white hover:bg-[#651227] disabled:bg-[#d7c7cd] disabled:text-[#82666f]"
                    >
                      {isSending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <SendHorizonal className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-[1.75rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)]">
                    <div className="p-6">
                      <AlertDialogHeader className="items-start text-left">
                        <AlertDialogTitle className="text-xl text-[#5f1024]">
                          Enviar punto a revisión de la Dirección de Educación Superior
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm leading-7 text-[#66666d]">
                          Se enviará el punto {punto.numero_punto} a revisión con{" "}
                          {evidenceCount} evidencia(s) registrada(s).
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="mt-4 space-y-2">
                        <Label
                          className="text-sm font-medium text-[#5d5d65]"
                          htmlFor={`send-comment-${punto.id}`}
                        >
                          Comentario
                        </Label>
                        <Textarea
                          id={`send-comment-${punto.id}`}
                          value={sendComment}
                          onChange={(event) => setSendComment(event.target.value)}
                          placeholder="Opcional: agrega contexto o una nota de envío."
                          className="min-h-24 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
                        />
                      </div>
                    </div>
                    <AlertDialogFooter className="rounded-b-[1.75rem] border-t border-[#ebe6ea] bg-[#faf7f8]">
                      <AlertDialogCancel
                        onClick={() => setSendComment("")}
                        className="h-10 rounded-full border-[#d6d0d6] bg-white px-4 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
                      >
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSendToDES}
                        className="h-10 rounded-full bg-[#7a1730] px-4 text-white hover:bg-[#651227]"
                      >
                        Confirmar envío
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </ActionTooltip>
              <ActionTooltip label="Editar clasificación del punto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDraft(punto.texto_final)
                    setDraftPrioridadId(String(punto.prioridad_id))
                    setDraftCategoriaId(punto.categoria_id ? String(punto.categoria_id) : "")
                    setIsEditing(true)
                  }}
                  aria-label={`Editar texto OCR del punto ${punto.numero_punto}`}
                  className="size-10 rounded-full border-[#d6d0d6] bg-white p-0 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
                >
                  <Pencil className="size-4" />
                </Button>
              </ActionTooltip>
              <ActionTooltip label="Eliminar punto">
                <AlertDialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isDeleting || isSaving}
                      aria-label={`Eliminar punto ${punto.numero_punto}`}
                      className="size-10 rounded-full border-[#e6cfd6] bg-white p-0 text-[#8a2a42] hover:border-[#8a2a42] hover:text-[#6f1d31]"
                    >
                      {isDeleting ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                <AlertDialogContent className="rounded-[1.75rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)]">
                  <div className="p-6">
                    <AlertDialogHeader className="items-start text-left">
                      <AlertDialogTitle className="text-xl text-[#5f1024]">
                        Eliminar punto
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-sm leading-7 text-[#66666d]">
                        Se eliminará el punto {punto.numero_punto}. Esta acción no se puede
                        deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                  </div>
                  <AlertDialogFooter className="rounded-b-[1.75rem] border-t border-[#ebe6ea] bg-[#faf7f8]">
                    <AlertDialogCancel className="h-10 rounded-full border-[#d6d0d6] bg-white px-4 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="h-10 rounded-full bg-[#7a1730] px-4 text-white hover:bg-[#651227]"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialog>
              </ActionTooltip>
            </>
          ) : null}
        </div>
      </div>

      {punto.observaciones ? (
        <div className="mt-4 rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#8b8b92]">
            Observaciones
          </p>
          <p className="mt-2 text-sm leading-7 text-[#4a4a52]">{punto.observaciones}</p>
        </div>
      ) : null}
    </article>
  )
}

function ActionTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="group relative flex">
      {children}
      <div className="pointer-events-none absolute -top-11 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#3f4046] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-[0_10px_24px_rgba(30,31,36,0.24)] transition duration-150 group-hover:opacity-100">
        {label}
      </div>
    </div>
  )
}

function MetaBadge({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: "slate" | "green" | "amber" | "red" | "rose"
}) {
  const toneClassName = {
    slate: "bg-[#f2f4f7] text-[#55606d]",
    green: "bg-[#edf6f1] text-[#2f6b4f]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
    red: "bg-[#fdeaea] text-[#9d2d2d]",
    rose: "bg-[#f8ebef] text-[#8b2740]",
  }[tone]

  return (
    <Badge
      className={`rounded-full border-0 px-2.5 py-1 text-[12px] shadow-none hover:${toneClassName} ${toneClassName}`}
    >
      <span className="font-medium/none uppercase tracking-[0.12em] opacity-75">
        {label}
      </span>
      <span className="ml-1.5 text-[12px] font-semibold">{value}</span>
    </Badge>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function resolvePriorityTone(
  clave: string,
): "slate" | "green" | "amber" | "red" | "rose" {
  if (clave === "urgente") {
    return "red"
  }
  if (clave === "alta") {
    return "amber"
  }
  if (clave === "media") {
    return "rose"
  }
  return "slate"
}

function resolveStatusTone(
  clave: string,
): "slate" | "green" | "amber" | "red" | "rose" {
  if (clave === "validado") {
    return "green"
  }
  if (clave === "rechazado") {
    return "red"
  }
  if (clave === "detectado" || clave === "requiere_informacion") {
    return "rose"
  }
  if (clave === "en_proceso" || clave === "enviado_validacion") {
    return "amber"
  }
  return "slate"
}

function resolveDisplayStatus(punto: UnidadPliegoPunto) {
  if (punto.requiere_validacion) {
    return "En validación DES"
  }

  if (punto.estado_punto_clave === "detectado") {
    return "Pendiente de atención"
  }

  if (punto.estado_punto_clave === "en_proceso") {
    return "En atención"
  }

  if (punto.estado_punto_clave === "requiere_informacion") {
    return "Con observación DES"
  }

  return punto.estado_punto_nombre
}

function resolveStatusToneForDisplay(
  punto: UnidadPliegoPunto,
): "slate" | "green" | "amber" | "red" | "rose" {
  if (punto.requiere_validacion) {
    return "amber"
  }

  return resolveStatusTone(punto.estado_punto_clave)
}

function resolveEvidenceTone(
  punto: UnidadPliegoPunto,
  evidenceCount: number,
): "slate" | "green" | "amber" | "red" | "rose" {
  if (punto.requiere_validacion) {
    return "amber"
  }

  if (evidenceCount > 0) {
    return "green"
  }

  return "slate"
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecciona una opción",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
