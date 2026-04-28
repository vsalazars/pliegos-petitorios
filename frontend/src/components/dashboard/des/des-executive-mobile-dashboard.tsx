"use client"

import { ArrowUpRight, Clock3, FileText, LoaderCircle } from "lucide-react"
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
  const allCategoriesOptionValue = "all-categories"
  const allPrioritiesOptionValue = "all-priorities"
  const loadingDetailPointIdsRef = useRef<Set<number>>(new Set())
  const filterBarRef = useRef<HTMLElement | null>(null)
  const [pendingPoints, setPendingPoints] = useState<DESValidationQueueItem[]>([])
  const [filterBarHeight, setFilterBarHeight] = useState(0)
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
  const [selectedCategory, setSelectedCategory] = useState<string>(allCategoriesOptionValue)
  const [selectedPriority, setSelectedPriority] = useState<string>(allPrioritiesOptionValue)
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

  const unitScopedPoints = useMemo(
    () => pendingPoints.filter((item) => (selectedUnitId === null ? true : item.unidad_id === selectedUnitId)),
    [pendingPoints, selectedUnitId],
  )
  const availableCategoryOptions = useMemo(() => {
    const categories = new Map<string, number>()

    for (const item of unitScopedPoints) {
      const label = item.categoria_nombre?.trim() || "Sin categoría"
      categories.set(label, (categories.get(label) ?? 0) + 1)
    }

    return [...categories.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }
        return left.label.localeCompare(right.label)
      })
  }, [unitScopedPoints])
  const availablePriorityOptions = useMemo(() => {
    const priorities = new Map<string, number>()

    for (const item of unitScopedPoints) {
      const label = item.prioridad_nombre.trim()
      priorities.set(label, (priorities.get(label) ?? 0) + 1)
    }

    return [...priorities.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => {
        if (right.count !== left.count) {
          return right.count - left.count
        }
        return left.label.localeCompare(right.label)
      })
  }, [unitScopedPoints])
  const filteredExecutivePoints = useMemo(
    () =>
      unitScopedPoints.filter((item) => {
        const categoryLabel = item.categoria_nombre?.trim() || "Sin categoría"
        const matchesCategory =
          selectedCategory === allCategoriesOptionValue || categoryLabel === selectedCategory
        const matchesPriority =
          selectedPriority === allPrioritiesOptionValue || item.prioridad_nombre.trim() === selectedPriority

        return matchesCategory && matchesPriority
      }),
    [allCategoriesOptionValue, allPrioritiesOptionValue, selectedCategory, selectedPriority, unitScopedPoints],
  )
  const filteredOperationalPoints = useMemo(
    () =>
      filteredExecutivePoints.filter(
        (item) =>
          item.estado_punto_clave === "detectado" ||
          item.estado_punto_clave === "en_proceso" ||
          item.estado_punto_clave === "requiere_informacion",
      ),
    [filteredExecutivePoints],
  )

  const currentMetrics = buildAttentionMetricsFromPoints(filteredOperationalPoints)
  const currentTitle = selectedUnitId === null ? "Todas las unidades" : selectedUnit?.clave ?? ""
  const currentSubtitle =
    selectedUnitId === null
      ? "Consolidado general de puntos pendientes por antiguedad."
      : selectedUnit?.nombre ?? ""
  const currentCaption = [
    `Pendientes operativos: ${filteredOperationalPoints.length}`,
    selectedCategory === allCategoriesOptionValue ? null : `Categoría: ${selectedCategory}`,
    selectedPriority === allPrioritiesOptionValue ? null : `Prioridad: ${selectedPriority}`,
  ]
    .filter(Boolean)
    .join(" · ")
  const categoryAndPriorityTotals = useMemo(() => {
    const categoryMap = new Map<string, { label: string; count: number }>()
    const priorityMap = new Map<string, { label: string; count: number }>()

    for (const item of filteredExecutivePoints) {
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
      totalPoints: filteredExecutivePoints.length,
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
  }, [filteredExecutivePoints])
  const approvalSummary = useMemo(() => {
    const approvedCount = filteredExecutivePoints.filter(
      (item) => item.estado_punto_clave === "validado",
    ).length
    const totalCount = filteredExecutivePoints.length
    const percentage = totalCount === 0 ? 0 : Math.round((approvedCount / totalCount) * 100)

    return {
      approvedCount,
      totalCount,
      percentage,
    }
  }, [filteredExecutivePoints])
  const unattendedPointGroups = useMemo(() => {
    const filteredPoints = filteredExecutivePoints
      .filter(
        (item) =>
          !item.requiere_validacion &&
          (item.estado_punto_clave === "detectado" ||
            item.estado_punto_clave === "requiere_informacion"),
      )
      .sort((left, right) => {
        const daysDiff =
          businessDaysSinceFromISO(right.fecha_registro) -
          businessDaysSinceFromISO(left.fecha_registro)
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
  }, [filteredExecutivePoints])
  const requiresPendingPliegoSelection = unattendedPointGroups.length > 1
  const activePendingPliego = requiresPendingPliegoSelection
    ? unattendedPointGroups.find((group) => group.pliegoId === selectedPendingPliegoId) ?? null
    : unattendedPointGroups[0] ?? null
  const validatedPointGroups = useMemo(() => {
    const filteredPoints = filteredExecutivePoints
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
  }, [filteredExecutivePoints, pointDetails])
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

  useEffect(() => {
    const node = filterBarRef.current
    if (!node) {
      return
    }

    const updateHeight = () => {
      setFilterBarHeight(node.getBoundingClientRect().height)
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)
    window.addEventListener("resize", updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-full min-w-0 flex-col gap-5 overflow-x-hidden sm:max-w-md">
      <section
        ref={filterBarRef}
        className="fixed inset-x-4 top-[5.65rem] z-20 min-w-0 rounded-[1.7rem] border border-[#e4dde1] bg-white/94 px-4 py-3 shadow-[0_10px_24px_rgba(95,16,36,0.08)] backdrop-blur sm:left-1/2 sm:right-auto sm:top-[5.9rem] sm:w-full sm:max-w-md sm:-translate-x-1/2"
      >
       

        {availableUnits.length === 0 ? (
          <div className="mt-4 rounded-[1.35rem] border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
            Todavía no hay unidades con actividad disponible para esta vista.
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Select
              value={selectedUnitId === null ? allUnitsOptionValue : String(selectedUnitId)}
              onValueChange={(value) => {
                setSelectedUnitId(value === allUnitsOptionValue ? null : Number(value))
                setSelectedCategory(allCategoriesOptionValue)
                setSelectedPriority(allPrioritiesOptionValue)
                setSelectedPendingPliegoId(null)
                setSelectedValidatedPliegoId(null)
              }}
            >
              <SelectTrigger
                size="default"
                className="h-10 w-full min-w-0 overflow-hidden rounded-xl border-[#ddd9de] bg-white px-3 text-left text-xs text-[#35353b] [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:truncate"
              >
                <SelectValue placeholder="Unidad" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value={allUnitsOptionValue}>Unidad</SelectItem>
                {availableUnits.map((unit) => (
                  <SelectItem key={unit.unidad_id} value={String(unit.unidad_id)}>
                    {unit.clave} · {unit.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value)
                setSelectedPendingPliegoId(null)
                setSelectedValidatedPliegoId(null)
              }}
            >
              <SelectTrigger
                size="default"
                className="h-10 w-full min-w-0 overflow-hidden rounded-xl border-[#ddd9de] bg-white px-3 text-left text-xs text-[#35353b] [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:truncate"
              >
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value={allCategoriesOptionValue}>Categoría</SelectItem>
                {availableCategoryOptions.map((category) => (
                  <SelectItem key={category.label} value={category.label}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedPriority}
              onValueChange={(value) => {
                setSelectedPriority(value)
                setSelectedPendingPliegoId(null)
                setSelectedValidatedPliegoId(null)
              }}
            >
              <SelectTrigger
                size="default"
                className="h-10 w-full min-w-0 overflow-hidden rounded-xl border-[#ddd9de] bg-white px-3 text-left text-xs text-[#35353b] [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:truncate"
              >
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                <SelectItem value={allPrioritiesOptionValue}>Prioridad</SelectItem>
                {availablePriorityOptions.map((priority) => (
                  <SelectItem key={priority.label} value={priority.label}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </section>

      <div
        aria-hidden="true"
        className="shrink-0"
        style={{ height: filterBarHeight > 0 ? `${filterBarHeight + 2}px` : undefined }}
      />

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
              <h2 className="font-heading text-xl leading-tight tracking-tight text-[#5f1024]">
                Tiempo de atención a los puntos del pliego
              </h2>
              <p className="text-sm leading-6 text-[#6b6b73]">
                Numeralia de puntos pendientes en todas las unidades y en la
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
              <h2 className="font-heading text-xl leading-tight tracking-tight text-[#5f1024]">
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
              <h2 className="font-heading text-xl leading-tight tracking-tight text-[#5f1024]">
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
              <h2 className="font-heading text-xl leading-tight tracking-tight text-[#5f1024]">
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
                          className="h-12 w-full min-w-0 overflow-hidden rounded-2xl border-[#ddd9de] bg-white px-4 text-left text-sm text-[#35353b] [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:truncate"
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
                        const daysOpen = businessDaysSinceFromISO(item.fecha_registro)

                        return (
                          <article
                            key={item.id}
                            className="rounded-[1.35rem] border border-[#ece8ec] bg-[#fcfafb] px-4 py-4"
                          >
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <p className="text-sm font-medium text-[#5f1024]">
                                  Punto {item.numero_punto}
                                </p>
                                <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#f7f1f3] px-3 py-1 text-sm text-[#7a1730]">
                                  <Clock3 className="size-4" />
                                  {daysOpen} dh
                                </div>
                              </div>
                              <p className="text-sm leading-6 text-[#5f6067]">
                                {item.texto_final}
                              </p>
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
                                <SmallTag label={item.categoria_nombre} tone="blue" />
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
              <h2 className="font-heading text-xl leading-tight tracking-tight text-[#5f1024]">
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
                          className="h-12 w-full min-w-0 overflow-hidden rounded-2xl border-[#ddd9de] bg-white px-4 text-left text-sm text-[#35353b] [&_[data-slot=select-value]]:block [&_[data-slot=select-value]]:truncate"
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
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                  <p className="text-sm font-medium text-[#5f1024]">
                                    Punto {item.numero_punto}
                                  </p>
                                <div className="inline-flex shrink-0 items-center rounded-full bg-[#edf6f1] px-3 py-1 text-sm text-[#2f6b4f]">
                                  Validado
                                </div>
                              </div>
                              <p className="text-sm leading-6 text-[#5f6067]">
                                {item.texto_final}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-sm">
                                <SmallTag label={item.prioridad_nombre} tone="amber" />
                                {item.categoria_nombre ? (
                                  <SmallTag label={item.categoria_nombre} tone="blue" />
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
                                          className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#ece8ec] bg-[#faf8f9] px-3 py-3 text-sm text-[#5f1024] !no-underline hover:!no-underline focus:!no-underline [&_*]:!no-underline"
                                        >
                                          <span className="min-w-0">
                                            <span className="flex min-w-0 items-start gap-2 font-medium">
                                              <FileText className="size-4 shrink-0" />
                                              <span className="min-w-0 break-words leading-5">
                                                {evidencia.titulo?.trim() ||
                                                  evidencia.archivo.nombre_original}
                                              </span>
                                            </span>
                                            <span className="mt-2 inline-flex rounded-full bg-[#eef5fb] px-2.5 py-1 text-[11px] font-medium text-[#345b7a]">
                                              {evidencia.tipo_evidencia_nombre}
                                            </span>
                                          </span>
                                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#e1dde3] bg-white px-2.5 py-1 text-[11px] font-medium text-[#8a8a91] no-underline">
                                            Ver
                                            <ArrowUpRight className="size-3" />
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

function buildAttentionMetricsFromPoints(points: DESValidationQueueItem[]): AttentionMetric[] {
  let normal = 0
  let attention = 0
  let risk = 0
  let critical = 0

  for (const point of points) {
    const daysOpen = businessDaysSinceFromISO(point.fecha_registro)

    if (daysOpen <= 7) {
      normal += 1
      continue
    }
    if (daysOpen <= 15) {
      attention += 1
      continue
    }
    if (daysOpen <= 30) {
      risk += 1
      continue
    }

    critical += 1
  }

  return [
    {
      key: "normal",
      label: "0 a 7 días hábiles",
      detail: "Ventana normal de atención",
      value: normal,
      tone: "green",
    },
    {
      key: "attention",
      label: "8 a 15 días hábiles",
      detail: "Seguimiento cercano",
      value: attention,
      tone: "amber",
    },
    {
      key: "risk",
      label: "16 a 30 días hábiles",
      detail: "Riesgo operativo",
      value: risk,
      tone: "rose",
    },
    {
      key: "critical",
      label: "30+ días hábiles",
      detail: "Atraso crítico",
      value: critical,
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

function businessDaysSinceFromISO(value: string) {
  const start = new Date(value)
  const end = new Date()

  if (Number.isNaN(start.getTime())) {
    return 0
  }

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  if (start >= end) {
    return 0
  }

  let businessDays = 0
  const cursor = new Date(start)

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1)

    if (cursor > end) {
      break
    }

    const day = cursor.getDay()
    if (day !== 0 && day !== 6) {
      businessDays += 1
    }
  }

  return businessDays
}

function SmallTag({
  label,
  tone,
}: {
  label: string
  tone: "slate" | "rose" | "amber" | "blue"
}) {
  const toneClassName = {
    slate: "bg-[#f2f4f7] text-[#55606d]",
    rose: "bg-[#f8ebef] text-[#8b2740]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
    blue: "bg-[#eef5fb] text-[#345b7a]",
  }[tone]

  return (
    <span className={`inline-flex rounded-full px-3 py-1 ${toneClassName}`}>
      {label}
    </span>
  )
}
