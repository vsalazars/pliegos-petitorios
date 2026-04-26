"use client"

import { LoaderCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type {
  DESEvidenceDetailItem,
  DESMotivoRechazo,
  DESValidationDetailItem,
  DESValidationQueueItem,
} from "@/lib/des-dashboard"

type DESValidationDetailPanelProps = {
  points: DESValidationQueueItem[]
  item: DESValidationQueueItem | null
  selectedPointFilter: "all" | "evidence:with"
  selectedStaleResponseFilter: string
  selectedPrioridadFilter: string
  selectedCategoriaFilter: string
  priorityFilterOptions: Array<{ key: string; label: string; count: number }>
  categoryFilterOptions: Array<{ key: string; label: string; count: number }>
  staleResponseFilterOptions: Array<{ key: string; label: string; count: number }>
  onSelectPoint: (pointId: number) => void
  onSelectPointFilter: (value: "all" | "evidence:with") => void
  onSelectStaleResponseFilter: (value: string) => void
  onSelectPrioridadFilter: (value: string) => void
  onSelectCategoriaFilter: (value: string) => void
  onValidated: () => Promise<void> | void
  className?: string
}

export function DESValidationDetailPanel({
  points,
  item,
  selectedPointFilter,
  selectedStaleResponseFilter,
  selectedPrioridadFilter,
  selectedCategoriaFilter,
  priorityFilterOptions,
  categoryFilterOptions,
  staleResponseFilterOptions,
  onSelectPoint,
  onSelectPointFilter,
  onSelectStaleResponseFilter,
  onSelectPrioridadFilter,
  onSelectCategoriaFilter,
  onValidated,
  className,
}: DESValidationDetailPanelProps) {
  const [evidencias, setEvidencias] = useState<DESEvidenceDetailItem[]>([])
  const [validaciones, setValidaciones] = useState<DESValidationDetailItem[]>([])
  const [motivos, setMotivos] = useState<DESMotivoRechazo[]>([])
  const [comentario, setComentario] = useState("")
  const [motivoRechazoId, setMotivoRechazoId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!item) {
      return
    }

    let isActive = true

    const loadDetail = async () => {
      setIsLoading(true)
      try {
        const [evidenciasResponse, validacionesResponse, motivosResponse] =
          await Promise.all([
            fetch(`/api/admin/puntos/${item.id}/evidencias`, { cache: "no-store" }),
            fetch(`/api/admin/puntos/${item.id}/validaciones`, { cache: "no-store" }),
            fetch("/api/admin/catalogos/motivos-rechazo", { cache: "no-store" }),
          ])

        const [evidenciasPayload, validacionesPayload, motivosPayload] = await Promise.all([
          evidenciasResponse.json(),
          validacionesResponse.json(),
          motivosResponse.json(),
        ])

        if (!isActive) {
          return
        }

        if (!evidenciasResponse.ok) {
          toast.error(evidenciasPayload.error ?? "No fue posible cargar evidencias.")
          return
        }
        if (!validacionesResponse.ok) {
          toast.error(validacionesPayload.error ?? "No fue posible cargar validaciones.")
          return
        }
        if (!motivosResponse.ok) {
          toast.error(motivosPayload.error ?? "No fue posible cargar motivos de rechazo.")
          return
        }

        setEvidencias((evidenciasPayload.items ?? []) as DESEvidenceDetailItem[])
        setValidaciones((validacionesPayload.items ?? []) as DESValidationDetailItem[])
        setMotivos((motivosPayload.items ?? []) as DESMotivoRechazo[])
        setComentario("")
        setMotivoRechazoId("")
      } catch {
        if (isActive) {
          toast.error("No fue posible conectar con el detalle del punto.")
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadDetail()

    return () => {
      isActive = false
    }
  }, [item])

  const submitValidation = async (resultado: "aprobado" | "rechazado") => {
    if (!item) {
      return
    }

    if (resultado === "rechazado" && motivoRechazoId.trim() === "") {
      toast.error("Selecciona un motivo de rechazo.")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/admin/puntos/${item.id}/validaciones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resultado,
          comentario: comentario.trim() === "" ? null : comentario.trim(),
          motivo_rechazo_id:
            resultado === "rechazado" ? Number(motivoRechazoId) : null,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible registrar la validación.")
        return
      }

      const nextValidation = payload.item as DESValidationDetailItem | undefined
      if (nextValidation) {
        setValidaciones((current) => [nextValidation, ...current])
      }
      setComentario("")
      setMotivoRechazoId("")
      await onValidated()
      toast.success("Validación registrada correctamente.")
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!item) {
    return (
      <Card className={`flex h-full min-h-0 flex-col rounded-[1.8rem] border-[#ddd8de] py-0 ${className ?? ""}`}>
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-2xl text-[#5f1024]">Detalle para validación</CardTitle>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 pb-6">
          <StickyDetailControls>
            <PointFiltersRow
              totalCount={points.length}
              evidenceCount={points.filter((point) => (point.evidencias_count ?? 0) > 0).length}
              selectedPointFilter={selectedPointFilter}
              selectedStaleResponseFilter={selectedStaleResponseFilter}
              selectedPrioridadFilter={selectedPrioridadFilter}
              selectedCategoriaFilter={selectedCategoriaFilter}
              priorityFilterOptions={priorityFilterOptions}
              categoryFilterOptions={categoryFilterOptions}
              staleResponseFilterOptions={staleResponseFilterOptions}
              onSelectPointFilter={onSelectPointFilter}
              onSelectStaleResponseFilter={onSelectStaleResponseFilter}
              onSelectPrioridadFilter={onSelectPrioridadFilter}
              onSelectCategoriaFilter={onSelectCategoriaFilter}
            />
            <PointSwitcher points={points} activePointId={null} onSelectPoint={onSelectPoint} />
          </StickyDetailControls>
          <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
            Selecciona un punto del pliego para ver evidencias y validar.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`flex h-full min-h-0 flex-col rounded-[1.8rem] border-[#ddd8de] py-0 ${className ?? ""}`}>
      <CardHeader className="px-6 pt-6">
        <CardTitle className="text-2xl text-[#5f1024]">Detalle para validación</CardTitle>
        <CardDescription>
          {[item.unidad_clave, item.folio_pliego, `Punto ${item.numero_punto}`]
            .filter(Boolean)
            .join(" · ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 pb-6">
        <StickyDetailControls>
          <PointFiltersRow
            totalCount={points.length}
            evidenceCount={points.filter((point) => (point.evidencias_count ?? 0) > 0).length}
            selectedPointFilter={selectedPointFilter}
            selectedStaleResponseFilter={selectedStaleResponseFilter}
            selectedPrioridadFilter={selectedPrioridadFilter}
            selectedCategoriaFilter={selectedCategoriaFilter}
            priorityFilterOptions={priorityFilterOptions}
            categoryFilterOptions={categoryFilterOptions}
            staleResponseFilterOptions={staleResponseFilterOptions}
            onSelectPointFilter={onSelectPointFilter}
            onSelectStaleResponseFilter={onSelectStaleResponseFilter}
            onSelectPrioridadFilter={onSelectPrioridadFilter}
            onSelectCategoriaFilter={onSelectCategoriaFilter}
          />

          <PointSwitcher points={points} activePointId={item.id} onSelectPoint={onSelectPoint} />
        </StickyDetailControls>

        <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm leading-7 text-[#4c4c54]">
          {item.texto_final}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DetailMetaBadge tone={resolvePriorityTone(item.prioridad_clave)}>
            {item.prioridad_nombre}
          </DetailMetaBadge>
          {item.categoria_nombre ? (
            <DetailMetaBadge tone="category">{item.categoria_nombre}</DetailMetaBadge>
          ) : null}
          {item.titulo_pliego?.trim() ? (
            <DetailMetaBadge tone="date">{item.titulo_pliego}</DetailMetaBadge>
          ) : null}
        </div>

        <section className="space-y-3">
          <h3 className="font-medium text-[#5f1024]">Evidencias</h3>
          {isLoading ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Cargando evidencias...
            </div>
          ) : evidencias.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Este punto todavía no tiene evidencias visibles para la DES.
            </div>
          ) : (
            evidencias.map((evidencia) => (
              <div
                key={evidencia.id}
                className="rounded-[1.3rem] border border-[#ece8ec] bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-[#404149]">
                      {evidencia.titulo ?? evidencia.archivo.nombre_original}
                    </p>
                    <p className="mt-1 text-sm text-[#73737b]">{evidencia.tipo_evidencia_nombre}</p>
                  </div>
                  <a
                    href={`/api/admin/evidencias/${evidencia.id}/archivo`}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 rounded-full border border-[#d8c5cc] px-3 py-2 text-sm font-medium text-[#7a1730] transition hover:border-[#8f1d35] hover:bg-[#fbf6f7]"
                  >
                    Abrir archivo
                  </a>
                </div>
                {evidencia.descripcion ? (
                  <p className="mt-2 text-sm leading-7 text-[#66666d]">{evidencia.descripcion}</p>
                ) : null}
              </div>
            ))
          )}
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-[#5f1024]">Dictamen DES</h3>
          <div className="space-y-2">
            <Label htmlFor="comentario-validacion">Comentario</Label>
            <Textarea
              id="comentario-validacion"
              value={comentario}
              onChange={(event) => setComentario(event.target.value)}
              placeholder="Agrega contexto para la unidad o el historial DES."
              className="min-h-24 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo-rechazo">Motivo de rechazo</Label>
            <select
              id="motivo-rechazo"
              value={motivoRechazoId}
              onChange={(event) => setMotivoRechazoId(event.target.value)}
              className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
            >
              <option value="">Solo necesario al rechazar</option>
              {motivos.filter((item) => item.activo).map((motivo) => (
                <option key={motivo.id} value={String(motivo.id)}>
                  {motivo.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitValidation("aprobado")}
              className="h-11 rounded-full bg-[#2f6b4f] px-4 text-white hover:bg-[#285b43]"
            >
              {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Aprobar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void submitValidation("rechazado")}
              className="h-11 rounded-full bg-[#7a1730] px-4 text-white hover:bg-[#651227]"
            >
              Rechazar
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-medium text-[#5f1024]">Historial de validaciones</h3>
          {validaciones.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Aún no hay historial de validación para este punto.
            </div>
          ) : (
            validaciones.map((validacion) => (
              <div
                key={validacion.id}
                className="rounded-[1.3rem] border border-[#ece8ec] bg-white px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-[#404149]">{validacion.resultado}</p>
                  <span className="text-sm text-[#73737b]">
                    {formatDate(validacion.created_at)}
                  </span>
                </div>
                {validacion.comentario ? (
                  <p className="mt-2 text-sm leading-7 text-[#66666d]">{validacion.comentario}</p>
                ) : null}
                {validacion.motivo_rechazo_nombre ? (
                  <p className="mt-2 text-sm text-[#7a1730]">
                    Motivo: {validacion.motivo_rechazo_nombre}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </section>
      </CardContent>
    </Card>
  )
}

function StickyDetailControls({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-2 space-y-4 bg-white/98 px-2 pb-4 pt-1 backdrop-blur">
      {children}
    </div>
  )
}

function PointFiltersRow({
  totalCount,
  evidenceCount,
  selectedPointFilter,
  selectedStaleResponseFilter,
  selectedPrioridadFilter,
  selectedCategoriaFilter,
  priorityFilterOptions,
  categoryFilterOptions,
  staleResponseFilterOptions,
  onSelectPointFilter,
  onSelectStaleResponseFilter,
  onSelectPrioridadFilter,
  onSelectCategoriaFilter,
}: {
  totalCount: number
  evidenceCount: number
  selectedPointFilter: "all" | "evidence:with"
  selectedStaleResponseFilter: string
  selectedPrioridadFilter: string
  selectedCategoriaFilter: string
  priorityFilterOptions: Array<{ key: string; label: string; count: number }>
  categoryFilterOptions: Array<{ key: string; label: string; count: number }>
  staleResponseFilterOptions: Array<{ key: string; label: string; count: number }>
  onSelectPointFilter: (value: "all" | "evidence:with") => void
  onSelectStaleResponseFilter: (value: string) => void
  onSelectPrioridadFilter: (value: string) => void
  onSelectCategoriaFilter: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterPill
        label="Ver todo"
        count={totalCount}
        active={selectedPointFilter === "all"}
        tone="date"
        onClick={() => {
          onSelectPointFilter("all")
          onSelectStaleResponseFilter("all")
          onSelectPrioridadFilter("all")
          onSelectCategoriaFilter("all")
        }}
      />
      <FilterPill
        label="Con evidencia"
        count={evidenceCount}
        active={selectedPointFilter === "evidence:with"}
        tone="success"
        onClick={() => onSelectPointFilter("evidence:with")}
      />
      <select
        value={selectedStaleResponseFilter}
        onChange={(event) => onSelectStaleResponseFilter(event.target.value)}
        className="h-10 min-w-[150px] rounded-full border border-[#ddd9de] bg-white px-4 text-sm text-[#5f5f67] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        {staleResponseFilterOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
      <select
        value={selectedPrioridadFilter}
        onChange={(event) => onSelectPrioridadFilter(event.target.value)}
        className="h-10 min-w-[132px] rounded-full border border-[#ddd9de] bg-white px-4 text-sm text-[#5f5f67] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        <option value="all">Prioridad</option>
        {priorityFilterOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
      <select
        value={selectedCategoriaFilter}
        onChange={(event) => onSelectCategoriaFilter(event.target.value)}
        className="h-10 min-w-[132px] rounded-full border border-[#ddd9de] bg-white px-4 text-sm text-[#5f5f67] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        <option value="all">Categoría</option>
        {categoryFilterOptions.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </div>
  )
}

function PointSwitcher({
  points,
  activePointId,
  onSelectPoint,
}: {
  points: DESValidationQueueItem[]
  activePointId: number | null
  onSelectPoint: (pointId: number) => void
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
        Este pliego todavía no tiene puntos registrados.
      </div>
    )
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {points.map((point) => (
        <button
          key={point.id}
          type="button"
          onClick={() => onSelectPoint(point.id)}
          className={`shrink-0 rounded-full border px-3 py-2 text-sm transition ${
            point.id === activePointId
              ? "border-[#cfaeb7] bg-[#fbf6f7] text-[#5f1024]"
              : "border-[#ddd9de] bg-white text-[#5f5f67] hover:border-[#c9bcc2] hover:bg-[#fcf9fa]"
          }`}
        >
          {point.numero_punto}
        </button>
      ))}
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

type DetailMetaTone = "urgent" | "high" | "medium" | "low" | "category" | "date"

function DetailMetaBadge({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: DetailMetaTone
}) {
  const toneClassName = {
    urgent: "border-[#efc8cf] bg-[#fbebef] text-[#8f1d35]",
    high: "border-[#efd7b6] bg-[#fbf1df] text-[#8c5a08]",
    medium: "border-[#ead9ef] bg-[#f6eef8] text-[#7a3f8f]",
    low: "border-[#d8dee6] bg-[#f2f4f7] text-[#55606d]",
    category: "border-[#d5e7dc] bg-[#edf6f1] text-[#2f6b4f]",
    date: "border-[#e1dde3] bg-[#f8f6f9] text-[#5f1024]",
  }[tone]

  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}>
      {children}
    </span>
  )
}

function FilterPill({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  tone: DetailMetaTone | "success"
  onClick: () => void
}) {
  const toneClassName = {
    urgent: "border-[#efc8cf] bg-[#fbebef] text-[#8f1d35]",
    high: "border-[#efd7b6] bg-[#fbf1df] text-[#8c5a08]",
    medium: "border-[#ead9ef] bg-[#f6eef8] text-[#7a3f8f]",
    low: "border-[#d8dee6] bg-[#f2f4f7] text-[#55606d]",
    category: "border-[#d5e7dc] bg-[#edf6f1] text-[#2f6b4f]",
    date: "border-[#e1dde3] bg-[#f8f6f9] text-[#5f1024]",
    success: "border-[#d5e7dc] bg-[#edf6f1] text-[#2f6b4f]",
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition ${
        active
          ? `${toneClassName} shadow-sm`
          : "border-[#ddd9de] bg-white text-[#5f5f67] hover:border-[#c9bcc2] hover:bg-[#fcf9fa]"
      }`}
    >
      <span>{label}</span>
      <span className="font-heading text-base leading-none">{count}</span>
    </button>
  )
}

function resolvePriorityTone(
  prioridadClave?: string | null,
): "urgent" | "high" | "medium" | "low" {
  if (prioridadClave === "urgente") {
    return "urgent"
  }
  if (prioridadClave === "alta") {
    return "high"
  }
  if (prioridadClave === "baja") {
    return "low"
  }
  return "medium"
}
