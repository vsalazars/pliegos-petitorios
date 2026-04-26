"use client"

import { Clock3, FileText, LoaderCircle } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  DESDashboardOperationalData,
  DESEvidenceDetailItem,
  DESDashboardSLA,
  DESDashboardUnitSummary,
  DESValidationDetailItem,
  DESValidationQueueItem,
} from "@/lib/des-dashboard"

type DESExecutiveMobileDashboardProps = {
  dashboard: DESDashboardOperationalData
}

type AttentionMetric = {
  key: string
  label: string
  detail: string
  value: number
  tone: "green" | "amber" | "rose" | "solid"
}

export function DESExecutiveMobileDashboard({
  dashboard,
}: DESExecutiveMobileDashboardProps) {
  const allUnitsOptionValue = "all"
  const loadingDetailPointIdsRef = useRef<Set<number>>(new Set())
  const [pendingPoints, setPendingPoints] = useState<DESValidationQueueItem[]>([])
  const [pointDetails, setPointDetails] = useState<
    Record<
      number,
      {
        evidencias: DESEvidenceDetailItem[]
        validaciones: DESValidationDetailItem[]
        isLoading: boolean
        hasLoaded: boolean
      }
    >
  >({})
  const [selectedPendingPliegoId, setSelectedPendingPliegoId] = useState<number | null>(null)
  const [selectedValidatedPliegoId, setSelectedValidatedPliegoId] = useState<number | null>(null)
  const availableUnits = useMemo(
    () =>
      [...dashboard.por_unidad]
        .filter((item) => item.total_puntos > 0 || item.total_pliegos > 0)
        .sort((left, right) => {
          if (left.puntos_pendientes_operativos === right.puntos_pendientes_operativos) {
            return left.nombre.localeCompare(right.nombre)
          }

          return right.puntos_pendientes_operativos - left.puntos_pendientes_operativos
        }),
    [dashboard.por_unidad],
  )

  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  const selectedUnit =
    availableUnits.find((item) => item.unidad_id === selectedUnitId) ?? availableUnits[0] ?? null

  const globalMetrics = buildGlobalAttentionMetrics(dashboard.atencion_inmediata.sla)
  const unitMetrics = selectedUnit ? buildUnitAttentionMetrics(selectedUnit) : []
  const currentMetrics = selectedUnitId === null ? globalMetrics : unitMetrics
  const currentTitle = selectedUnitId === null ? "Todas las unidades" : selectedUnit?.clave ?? ""
  const currentSubtitle =
    selectedUnitId === null
      ? "Consolidado general de puntos pendientes por antiguedad."
      : selectedUnit?.nombre ?? ""
  const currentCaption =
    selectedUnitId === null || !selectedUnit
      ? undefined
      : `Pendientes operativos: ${selectedUnit.puntos_pendientes_operativos} · Máximo atraso: ${selectedUnit.max_dias_desde_registro_punto} día(s)`
  const categoryAndPriorityTotals = useMemo(() => {
    const filteredPoints = pendingPoints.filter((item) =>
      selectedUnitId === null ? true : item.unidad_id === selectedUnitId,
    )

    const categoryMap = new Map<string, { label: string; count: number }>()
    const priorityMap = new Map<string, { label: string; count: number }>()

    for (const item of filteredPoints) {
      const categoryLabel = item.categoria_nombre?.trim() || "Sin categoría"
      const priorityLabel = item.prioridad_nombre.trim()

      categoryMap.set(categoryLabel, {
        label: categoryLabel,
        count: (categoryMap.get(categoryLabel)?.count ?? 0) + 1,
      })
      priorityMap.set(priorityLabel, {
        label: priorityLabel,
        count: (priorityMap.get(priorityLabel)?.count ?? 0) + 1,
      })
    }

    return {
      totalPoints: filteredPoints.length,
      categories: [...categoryMap.values()].sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }
        return left.label.localeCompare(right.label)
      }),
      priorities: [...priorityMap.values()].sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }
        return left.label.localeCompare(right.label)
      }),
    }
  }, [pendingPoints, selectedUnitId])
  const approvalSummary = useMemo(() => {
    const filteredPoints = pendingPoints.filter((item) =>
      selectedUnitId === null ? true : item.unidad_id === selectedUnitId,
    )
    const approvedCount = filteredPoints.filter(
      (item) => item.estado_punto_clave === "validado",
    ).length
    const totalCount = filteredPoints.length
    const percentage = totalCount === 0 ? 0 : Math.round((approvedCount / totalCount) * 100)

    return {
      approvedCount,
      totalCount,
      percentage,
    }
  }, [pendingPoints, selectedUnitId])
  const unattendedPointGroups = useMemo(() => {
    const filteredPoints = pendingPoints
      .filter((item) =>
        selectedUnitId === null ? true : item.unidad_id === selectedUnitId,
      )
      .filter(
        (item) =>
          !item.requiere_validacion &&
          (item.estado_punto_clave === "detectado" ||
            item.estado_punto_clave === "requiere_informacion"),
      )
      .sort((left, right) => {
        const daysDiff =
          daysSinceFromISO(right.fecha_registro) - daysSinceFromISO(left.fecha_registro)
        if (daysDiff !== 0) {
          return daysDiff
        }

        return left.numero_punto - right.numero_punto
      })

    const groups = new Map<
      number,
      {
        pliegoId: number
        folio: string
        titulo: string
        unidadLabel: string
        items: DESValidationQueueItem[]
      }
    >()

    for (const item of filteredPoints) {
      const currentGroup = groups.get(item.pliego_id)
      if (currentGroup) {
        currentGroup.items.push(item)
        continue
      }

      groups.set(item.pliego_id, {
        pliegoId: item.pliego_id,
        folio: item.folio_pliego ?? `Pliego ${item.pliego_id}`,
        titulo: item.titulo_pliego ?? "Sin título",
        unidadLabel: item.unidad_clave
          ? `${item.unidad_clave} · ${item.unidad_nombre ?? ""}`
          : item.unidad_nombre ?? "DES",
        items: [item],
      })
    }

    return [...groups.values()]
  }, [pendingPoints, selectedUnitId])
  const requiresPendingPliegoSelection = unattendedPointGroups.length > 1
  const activePendingPliego = requiresPendingPliegoSelection
    ? unattendedPointGroups.find((group) => group.pliegoId === selectedPendingPliegoId) ?? null
    : unattendedPointGroups[0] ?? null
  const validatedPointGroups = useMemo(() => {
    const filteredPoints = pendingPoints
      .filter((item) => (selectedUnitId === null ? true : item.unidad_id === selectedUnitId))
      .filter((item) => item.estado_punto_clave === "validado")
      .sort((left, right) => {
        const rightApprovalDate = resolveApprovedAtTimestamp(
          pointDetails[right.id]?.validaciones ?? [],
          right.fecha_validacion_des,
        )
        const leftApprovalDate = resolveApprovedAtTimestamp(
          pointDetails[left.id]?.validaciones ?? [],
          left.fecha_validacion_des,
        )

        if (rightApprovalDate !== leftApprovalDate) {
          return rightApprovalDate - leftApprovalDate
        }

        return left.numero_punto - right.numero_punto
      })

    const groups = new Map<
      number,
      {
        pliegoId: number
        folio: string
        titulo: string
        unidadLabel: string
        items: DESValidationQueueItem[]
      }
    >()

    for (const item of filteredPoints) {
      const currentGroup = groups.get(item.pliego_id)
      if (currentGroup) {
        currentGroup.items.push(item)
        continue
      }

      groups.set(item.pliego_id, {
        pliegoId: item.pliego_id,
        folio: item.folio_pliego ?? `Pliego ${item.pliego_id}`,
        titulo: item.titulo_pliego ?? "Sin título",
        unidadLabel: item.unidad_clave
          ? `${item.unidad_clave} · ${item.unidad_nombre ?? ""}`
          : item.unidad_nombre ?? "DES",
        items: [item],
      })
    }

    return [...groups.values()]
  }, [pendingPoints, pointDetails, selectedUnitId])
  const requiresValidatedPliegoSelection = validatedPointGroups.length > 1
  const activeValidatedPliego = requiresValidatedPliegoSelection
    ? validatedPointGroups.find((group) => group.pliegoId === selectedValidatedPliegoId) ?? null
    : validatedPointGroups[0] ?? null

  useEffect(() => {
    let isActive = true

    const loadPendingPoints = async () => {
      const response = await fetch("/api/admin/puntos", { cache: "no-store" })
      const payload = (await response.json()) as { items?: DESValidationQueueItem[] }

      if (!isActive || !response.ok) {
        return
      }

      setPendingPoints(payload.items ?? [])
    }

    void loadPendingPoints()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    const pointIdsToLoad = activeValidatedPliego?.items.map((item) => item.id) ?? []
    const pendingPointIds = pointIdsToLoad.filter(
      (pointId) =>
        !pointDetails[pointId]?.hasLoaded && !loadingDetailPointIdsRef.current.has(pointId),
    )

    if (pendingPointIds.length === 0) {
      return
    }

    let isActive = true
    for (const pointId of pendingPointIds) {
      loadingDetailPointIdsRef.current.add(pointId)
    }

    const loadDetails = async () => {
      try {
        const detailEntries = await Promise.all(
          pendingPointIds.map(async (pointId) => {
            try {
              const [evidenciasResponse, validacionesResponse] = await Promise.all([
                fetch(`/api/admin/puntos/${pointId}/evidencias`, { cache: "no-store" }),
                fetch(`/api/admin/puntos/${pointId}/validaciones`, { cache: "no-store" }),
              ])

              const [evidenciasPayload, validacionesPayload] = await Promise.all([
                evidenciasResponse.json(),
                validacionesResponse.json(),
              ])

              if (!evidenciasResponse.ok || !validacionesResponse.ok) {
                return {
                  pointId,
                  evidencias: [] as DESEvidenceDetailItem[],
                  validaciones: [] as DESValidationDetailItem[],
                }
              }

              return {
                pointId,
                evidencias: (evidenciasPayload.items ?? []) as DESEvidenceDetailItem[],
                validaciones: (validacionesPayload.items ?? []) as DESValidationDetailItem[],
              }
            } catch {
              return {
                pointId,
                evidencias: [] as DESEvidenceDetailItem[],
                validaciones: [] as DESValidationDetailItem[],
              }
            }
          }),
        )

        if (!isActive) {
          return
        }

        setPointDetails((current) => {
          const next = { ...current }

          for (const entry of detailEntries) {
            next[entry.pointId] = {
              evidencias: entry.evidencias,
              validaciones: entry.validaciones,
              isLoading: false,
              hasLoaded: true,
            }
          }

          return next
        })
      } finally {
        for (const pointId of pendingPointIds) {
          loadingDetailPointIdsRef.current.delete(pointId)
        }
      }
    }

    void loadDetails()

    return () => {
      isActive = false
    }
  }, [activeValidatedPliego, pointDetails])

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5">
      <section className="rounded-[1.7rem] border border-[#e4dde1] bg-white px-4 py-4 shadow-sm">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#5f1024]">Unidad académica</p>
           </div>

        {availableUnits.length === 0 ? (
          <div className="mt-4 rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
            Todavía no hay unidades con actividad disponible para esta vista.
          </div>
        ) : (
          <div className="mt-4">
            <Select
              value={selectedUnitId === null ? allUnitsOptionValue : String(selectedUnitId)}
              onValueChange={(value) => {
                setSelectedUnitId(value === allUnitsOptionValue ? null : Number(value))
                setSelectedPendingPliegoId(null)
                setSelectedValidatedPliegoId(null)
              }}
            >
              <SelectTrigger
                size="default"
                className="h-12 w-full rounded-2xl border-[#ddd9de] bg-white px-4 text-sm text-[#35353b]"
              >
                <SelectValue placeholder="Selecciona una unidad" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value={allUnitsOptionValue}>Todas las unidades</SelectItem>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.unidad_id} value={String(unit.unidad_id)}>
                    {unit.clave} · {unit.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <Accordion type="single" collapsible defaultValue="attention">
        <AccordionItem
          value="attention"
          className="overflow-hidden rounded-[2rem] border border-[#e4dde1] bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="space-y-2 pr-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
                Indicador ejecutivo
              </p>
              <h2 className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Tiempo de atención a los puntos del pliego
              </h2>
              <p className="text-sm leading-6 text-[#6b6b73]">
                Numeralia móvil de puntos pendientes en todas las unidades y en la
                unidad académica seleccionada.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-[#efe8eb] px-5 py-5">
            <div className="space-y-4">
              <ExecutiveMetricBlock
                title={currentTitle}
                subtitle={currentSubtitle}
                caption={currentCaption}
                metrics={currentMetrics}
              />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="totals"
          className="mt-4 overflow-hidden rounded-[2rem] border border-[#e4dde1] bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="space-y-2 pr-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
                Panorama ejecutivo
              </p>
              <h2 className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Totales por categoría y prioridad
              </h2>
              <p className="text-sm leading-6 text-[#6b6b73]">
                Distribución de puntos para la selección actual, útil para detectar
                concentración temática y nivel de urgencia.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-[#efe8eb] px-5 py-5">
            {categoryAndPriorityTotals.totalPoints === 0 ? (
              <div className="rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                No hay puntos disponibles para calcular totales en la selección actual.
              </div>
            ) : (
              <section className="rounded-[1.7rem] border border-[#e4dde1] bg-white px-4 py-4 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm leading-6 text-[#6b6b73]">
                    {categoryAndPriorityTotals.totalPoints} punto(s) contabilizado(s) en la
                    selección actual.
                  </p>
                </div>

                <Tabs defaultValue="categories" className="mt-4">
                  <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-[#f6f1f3] p-1">
                    <TabsTrigger
                      value="categories"
                      className="rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:text-[#5f1024]"
                    >
                      Categorías
                    </TabsTrigger>
                    <TabsTrigger
                      value="priorities"
                      className="rounded-xl text-sm data-[state=active]:bg-white data-[state=active]:text-[#5f1024]"
                    >
                      Prioridades
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="categories" className="mt-4">
                    <CompactDistributionList
                      items={categoryAndPriorityTotals.categories}
                      total={categoryAndPriorityTotals.totalPoints}
                      accent="rose"
                      emptyLabel="Sin categorías disponibles."
                    />
                  </TabsContent>

                  <TabsContent value="priorities" className="mt-4">
                    <CompactDistributionList
                      items={categoryAndPriorityTotals.priorities}
                      total={categoryAndPriorityTotals.totalPoints}
                      accent="amber"
                      emptyLabel="Sin prioridades disponibles."
                      toneResolver={(label) => resolvePriorityDistributionTone(label)}
                    />
                  </TabsContent>
                </Tabs>
              </section>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="approval-rate"
          className="mt-4 overflow-hidden rounded-[2rem] border border-[#e4dde1] bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="space-y-2 pr-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
                Resultado ejecutivo
              </p>
              <h2 className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Porcentaje de puntos aprobados
              </h2>
              <p className="text-sm leading-6 text-[#6b6b73]">
                Relación de puntos ya aprobados por la DES respecto al total de puntos
                en la selección actual.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-[#efe8eb] px-5 py-5">
            {approvalSummary.totalCount === 0 ? (
              <div className="rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                No hay puntos disponibles para calcular el porcentaje de aprobación.
              </div>
            ) : (
              <section className="rounded-[1.7rem] border border-[#d5e7dc] bg-[#f4faf6] px-4 py-4 shadow-sm">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-[#4f7a61]">Aprobados / Total</p>
                    <p className="mt-2 font-heading text-5xl tracking-tight text-[#2f6b4f]">
                      {approvalSummary.percentage}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/80 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-[#7d8e85]">
                      Puntos
                    </p>
                    <p className="mt-1 text-lg font-medium text-[#2f6b4f]">
                      {approvalSummary.approvedCount} / {approvalSummary.totalCount}
                    </p>
                  </div>
                </div>

                <Progress
                  value={approvalSummary.percentage}
                  className="mt-4 h-3 rounded-full bg-[#dcece2] [&>*]:bg-[#4d8b6a]"
                />

                <p className="mt-3 text-sm leading-6 text-[#5f6067]">
                  {approvalSummary.approvedCount} punto(s) aprobados de un total de{" "}
                  {approvalSummary.totalCount} en la selección actual.
                </p>
              </section>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="unattended"
          className="mt-4 overflow-hidden rounded-[2rem] border border-[#e4dde1] bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="space-y-2 pr-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
                Seguimiento ejecutivo
              </p>
              <h2 className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Puntos sin atención
              </h2>
              <p className="text-sm leading-6 text-[#6b6b73]">
                Listado de puntos pendientes, ordenados del más antiguo al más
                reciente y agrupados por pliego.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-[#efe8eb] px-5 py-5">
            {unattendedPointGroups.length === 0 ? (
              <div className="rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                No hay puntos sin atención para la selección actual.
              </div>
            ) : (
              <div className="space-y-3">
                {requiresPendingPliegoSelection ? (
                  <section className="rounded-[1.35rem] border border-[#ece8ec] bg-[#fcfafb] px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#5f1024]">Selecciona pliego</p>
                      <p className="text-sm text-[#6b6b73]">
                        Elige un pliego para revisar sus puntos sin atención.
                      </p>
                    </div>

                    <div className="mt-4">
                      <Select
                        value={selectedPendingPliegoId === null ? undefined : String(selectedPendingPliegoId)}
                        onValueChange={(value) => setSelectedPendingPliegoId(Number(value))}
                      >
                        <SelectTrigger
                          size="default"
                          className="h-12 w-full rounded-2xl border-[#ddd9de] bg-white px-4 text-sm text-[#35353b]"
                        >
                          <SelectValue placeholder="Selecciona un pliego" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {unattendedPointGroups.map((group) => (
                            <SelectItem key={group.pliegoId} value={String(group.pliegoId)}>
                              {group.folio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </section>
                ) : null}

                {activePendingPliego ? (
                  <section
                    key={activePendingPliego.pliegoId}
                    className="rounded-[1.7rem] border border-[#e4dde1] bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-heading text-2xl tracking-tight text-[#5f1024]">
                        {activePendingPliego.folio}
                      </p>
                      <p className="text-sm leading-6 text-[#6b6b73]">{activePendingPliego.titulo}</p>
                      <p className="text-sm text-[#8a8a91]">{activePendingPliego.unidadLabel}</p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {activePendingPliego.items.map((item) => {
                        const daysOpen = daysSinceFromISO(item.fecha_registro)

                        return (
                          <article
                            key={item.id}
                            className="rounded-[1.35rem] border border-[#ece8ec] bg-[#fcfafb] px-4 py-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[#5f1024]">
                                  Punto {item.numero_punto}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-[#5f6067]">
                                  {item.texto_final}
                                </p>
                              </div>
                              <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#f7f1f3] px-3 py-1 text-sm text-[#7a1730]">
                                <Clock3 className="size-4" />
                                {daysOpen} d
                              </div>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                              <SmallTag
                                label={
                                  item.estado_punto_clave === "requiere_informacion"
                                    ? "Con observación DES"
                                    : "Detectado"
                                }
                                tone={
                                  item.estado_punto_clave === "requiere_informacion"
                                    ? "rose"
                                    : "slate"
                                }
                              />
                              <SmallTag label={item.prioridad_nombre} tone="amber" />
                              {item.categoria_nombre ? (
                                <SmallTag label={item.categoria_nombre} tone="green" />
                              ) : null}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ) : requiresPendingPliegoSelection ? (
                  <div className="rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                    Selecciona un pliego para consultar sus puntos sin atención.
                  </div>
                ) : null}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem
          value="validated"
          className="mt-4 overflow-hidden rounded-[2rem] border border-[#e4dde1] bg-white shadow-sm"
        >
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="space-y-2 pr-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#9a8d93]">
                Seguimiento ejecutivo
              </p>
              <h2 className="font-heading text-3xl tracking-tight text-[#5f1024]">
                Puntos atendidos y validados
              </h2>
              <p className="text-sm leading-6 text-[#6b6b73]">
                Puntos ya aprobados por la DES, con acceso a comentario, fecha de
                aprobación y archivos de evidencia.
              </p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-[#efe8eb] px-5 py-5">
            {validatedPointGroups.length === 0 ? (
              <div className="rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                No hay puntos validados para la selección actual.
              </div>
            ) : (
              <div className="space-y-3">
                {requiresValidatedPliegoSelection ? (
                  <section className="rounded-[1.35rem] border border-[#ece8ec] bg-[#fcfafb] px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[#5f1024]">Selecciona pliego</p>
                      <p className="text-sm text-[#6b6b73]">
                        Elige un pliego para revisar sus puntos ya validados.
                      </p>
                    </div>

                    <div className="mt-4">
                      <Select
                        value={
                          selectedValidatedPliegoId === null
                            ? undefined
                            : String(selectedValidatedPliegoId)
                        }
                        onValueChange={(value) => setSelectedValidatedPliegoId(Number(value))}
                      >
                        <SelectTrigger
                          size="default"
                          className="h-12 w-full rounded-2xl border-[#ddd9de] bg-white px-4 text-sm text-[#35353b]"
                        >
                          <SelectValue placeholder="Selecciona un pliego" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {validatedPointGroups.map((group) => (
                            <SelectItem key={group.pliegoId} value={String(group.pliegoId)}>
                              {group.folio}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </section>
                ) : null}

                {activeValidatedPliego ? (
                  <section
                    key={activeValidatedPliego.pliegoId}
                    className="rounded-[1.7rem] border border-[#e4dde1] bg-white px-4 py-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <p className="font-heading text-2xl tracking-tight text-[#5f1024]">
                        {activeValidatedPliego.folio}
                      </p>
                      <p className="text-sm leading-6 text-[#6b6b73]">
                        {activeValidatedPliego.titulo}
                      </p>
                      <p className="text-sm text-[#8a8a91]">{activeValidatedPliego.unidadLabel}</p>
                    </div>

                    <div className="mt-4 space-y-3">
                      {activeValidatedPliego.items.map((item) => {
                        const detail = pointDetails[item.id]
                        const isLoadingDetail = !detail?.hasLoaded
                        const approvedValidation = resolveApprovedValidation(
                          detail?.validaciones ?? [],
                        )
                        const approvedAt = approvedValidation?.created_at ?? item.fecha_validacion_des

                        return (
                          <article
                            key={item.id}
                            className="rounded-[1.35rem] border border-[#ece8ec] bg-[#fcfafb] px-4 py-4"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[#5f1024]">
                                    Punto {item.numero_punto}
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-[#5f6067]">
                                    {item.texto_final}
                                  </p>
                                </div>
                                <div className="inline-flex shrink-0 items-center rounded-full bg-[#edf6f1] px-3 py-1 text-sm text-[#2f6b4f]">
                                  Validado
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <SmallTag label={item.prioridad_nombre} tone="amber" />
                                {item.categoria_nombre ? (
                                  <SmallTag label={item.categoria_nombre} tone="green" />
                                ) : null}
                              </div>

                              <div className="grid gap-3 rounded-[1.1rem] border border-[#ece8ec] bg-white px-3 py-3 text-sm text-[#5f6067]">
                                <div>
                                  <p className="text-xs uppercase tracking-[0.14em] text-[#9a8d93]">
                                    Fecha de aprobación
                                  </p>
                                  <p className="mt-1 text-sm text-[#5f1024]">
                                    {approvedAt ? formatExecutiveDate(approvedAt) : "Sin fecha disponible"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-[0.14em] text-[#9a8d93]">
                                    Comentario DES
                                  </p>
                                  <p className="mt-1 text-sm leading-6 text-[#5f6067]">
                                    {approvedValidation?.comentario?.trim() ||
                                      "No se registró comentario en la aprobación."}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs uppercase tracking-[0.14em] text-[#9a8d93]">
                                    Evidencias
                                  </p>
                                  {isLoadingDetail ? (
                                    <div className="mt-2 inline-flex items-center gap-2 text-sm text-[#6b6b73]">
                                      <LoaderCircle className="size-4 animate-spin" />
                                      Cargando evidencias...
                                    </div>
                                  ) : detail?.evidencias?.length ? (
                                    <div className="mt-2 space-y-2">
                                      {detail.evidencias.map((evidencia) => (
                                        <a
                                          key={evidencia.id}
                                          href={`/api/admin/evidencias/${evidencia.id}/archivo`}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="flex items-center justify-between gap-3 rounded-xl border border-[#ece8ec] bg-[#faf8f9] px-3 py-3 text-sm text-[#5f1024]"
                                        >
                                          <span className="min-w-0">
                                            <span className="flex items-center gap-2 font-medium">
                                              <FileText className="size-4 shrink-0" />
                                              <span className="truncate">
                                                {evidencia.titulo?.trim() ||
                                                  evidencia.archivo.nombre_original}
                                              </span>
                                            </span>
                                            <span className="mt-1 block text-xs text-[#8a8a91]">
                                              {evidencia.tipo_evidencia_nombre}
                                            </span>
                                          </span>
                                          <span className="shrink-0 text-xs text-[#8a8a91]">
                                            Abrir
                                          </span>
                                        </a>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-sm leading-6 text-[#5f6067]">
                                      No hay evidencias asociadas a este punto.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </section>
                ) : requiresValidatedPliegoSelection ? (
                  <div className="rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                    Selecciona un pliego para consultar sus puntos ya validados.
                  </div>
                ) : null}
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}

function ExecutiveMetricBlock({
  title,
  subtitle,
  caption,
  metrics,
}: {
  title: string
  subtitle: string
  caption?: string
  metrics: AttentionMetric[]
}) {
  return (
    <section className="rounded-[1.7rem] border border-[#e4dde1] bg-white px-4 py-4 shadow-sm">
      <div className="space-y-1">
        <h3 className="font-heading text-2xl tracking-tight text-[#5f1024]">{title}</h3>
        <p className="text-sm leading-6 text-[#6b6b73]">{subtitle}</p>
        {caption ? <p className="text-sm text-[#8a8a91]">{caption}</p> : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.key}
            className={`rounded-[1.5rem] border px-4 py-4 ${resolveMetricToneClass(metric.tone)}`}
          >
            <p className="text-sm opacity-80">{metric.label}</p>
            <p className="mt-2 font-heading text-4xl tracking-tight">{metric.value}</p>
            <p className="mt-2 text-sm opacity-80">{metric.detail}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CompactDistributionList({
  items,
  total,
  accent,
  emptyLabel,
  toneResolver,
}: {
  items: Array<{ label: string; count: number }>
  total: number
  accent: "rose" | "amber"
  emptyLabel: string
  toneResolver?: (label: string) => "blue" | "amber" | "rose" | "slate"
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-[1.2rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const percentage = total === 0 ? 0 : Math.round((item.count / total) * 100)
        const tone = toneResolver?.(item.label) ?? accent
        const { progressClassName, countClassName, labelClassName } =
          resolveDistributionToneClasses(tone)

        return (
          <div
            key={item.label}
            className="rounded-[1.2rem] border border-[#ece8ec] bg-[#fcfafb] px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${labelClassName}`}>{item.label}</p>
                <p className="mt-1 text-xs text-[#8a8a91]">{percentage}% del total</p>
              </div>
              <p className={`shrink-0 font-heading text-3xl tracking-tight ${countClassName}`}>
                {item.count}
              </p>
            </div>
            <Progress value={percentage} className={`mt-3 h-2.5 rounded-full ${progressClassName}`} />
          </div>
        )
      })}
    </div>
  )
}

function resolveDistributionToneClasses(tone: "blue" | "amber" | "rose" | "slate") {
  return {
    blue: {
      progressClassName: "[&>*]:bg-[#4f7db3] bg-[#e8f0fb]",
      countClassName: "text-[#325b90]",
      labelClassName: "text-[#325b90]",
    },
    amber: {
      progressClassName: "[&>*]:bg-[#d79a27] bg-[#fff1d4]",
      countClassName: "text-[#8c5a08]",
      labelClassName: "text-[#8c5a08]",
    },
    rose: {
      progressClassName: "[&>*]:bg-[#b33b58] bg-[#f6e3e8]",
      countClassName: "text-[#8b2740]",
      labelClassName: "text-[#8b2740]",
    },
    slate: {
      progressClassName: "[&>*]:bg-[#7b8794] bg-[#edf1f5]",
      countClassName: "text-[#55606d]",
      labelClassName: "text-[#55606d]",
    },
  }[tone]
}

function resolvePriorityDistributionTone(label: string) {
  switch (label.trim().toLowerCase()) {
    case "urgente":
      return "rose"
    case "alta":
      return "amber"
    case "media":
      return "blue"
    case "baja":
      return "slate"
    default:
      return "amber"
  }
}

function buildGlobalAttentionMetrics(sla: DESDashboardSLA): AttentionMetric[] {
  return [
    {
      key: "normal",
      label: "0 a 7 días",
      detail: "Ventana normal de atención",
      value: sla.semaforo_normal_0_7,
      tone: "green",
    },
    {
      key: "attention",
      label: "8 a 15 días",
      detail: "Seguimiento cercano",
      value: sla.semaforo_atencion_8_15,
      tone: "amber",
    },
    {
      key: "risk",
      label: "16 a 30 días",
      detail: "Riesgo operativo",
      value: sla.semaforo_riesgo_16_30,
      tone: "rose",
    },
    {
      key: "critical",
      label: "30+ días",
      detail: "Atraso crítico",
      value: sla.semaforo_critico_mas_30,
      tone: "solid",
    },
  ]
}

function buildUnitAttentionMetrics(unit: DESDashboardUnitSummary): AttentionMetric[] {
  return [
    {
      key: "normal",
      label: "0 a 7 días",
      detail: "Pendientes en ventana normal",
      value: unit.semaforo_normal_0_7,
      tone: "green",
    },
    {
      key: "attention",
      label: "8 a 15 días",
      detail: "Pendientes con atención requerida",
      value: unit.semaforo_atencion_8_15,
      tone: "amber",
    },
    {
      key: "risk",
      label: "16 a 30 días",
      detail: "Pendientes con rezago visible",
      value: unit.semaforo_riesgo_16_30,
      tone: "rose",
    },
    {
      key: "critical",
      label: "30+ días",
      detail: "Pendientes críticos de la unidad",
      value: unit.semaforo_critico_mas_30,
      tone: "solid",
    },
  ]
}

function resolveMetricToneClass(tone: AttentionMetric["tone"]) {
  return {
    green: "border-[#d5e7dc] bg-[#edf6f1] text-[#2f6b4f]",
    amber: "border-[#f0dfbf] bg-[#fff4de] text-[#8c5a08]",
    rose: "border-[#ead5db] bg-[#f8ebef] text-[#7a1730]",
    solid: "border-[#5f1024] bg-[#5f1024] text-white",
  }[tone]
}

function resolveApprovedValidation(validaciones: DESValidationDetailItem[]) {
  return validaciones.find((validation) => validation.resultado === "aprobado") ?? null
}

function resolveApprovedAtTimestamp(
  validaciones: DESValidationDetailItem[],
  fallback?: string | null,
) {
  const approvedValidation = resolveApprovedValidation(validaciones)
  const rawValue = approvedValidation?.created_at ?? fallback ?? null

  if (!rawValue) {
    return 0
  }

  return new Date(rawValue).getTime()
}

function formatExecutiveDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function daysSinceFromISO(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

function SmallTag({
  label,
  tone,
}: {
  label: string
  tone: "slate" | "rose" | "amber" | "green"
}) {
  const toneClassName = {
    slate: "bg-[#f2f4f7] text-[#55606d]",
    rose: "bg-[#f8ebef] text-[#8b2740]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
    green: "bg-[#edf6f1] text-[#2f6b4f]",
  }[tone]

  return (
    <span className={`inline-flex rounded-full px-3 py-1 ${toneClassName}`}>
      {label}
    </span>
  )
}
