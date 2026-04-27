"use client"

import { Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { DESValidationDetailPanel } from "@/components/dashboard/des/des-validation-detail-panel"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { DESUnidad } from "@/lib/des-admin"
import {
  type DESDashboardOperationalData,
  type DESPliegoItem,
  type DESValidationQueueItem,
} from "@/lib/des-dashboard"

const STALE_RESPONSE_FILTER_OPTIONS = [
  { key: "all", label: "Sin atención de la unidad" },
  { key: "no-response:7-14", label: "7 a 14 días hábiles", minDays: 7, maxDays: 14 },
  { key: "no-response:15-29", label: "15 a 29 días hábiles", minDays: 15, maxDays: 29 },
  { key: "no-response:30-59", label: "30 a 59 días hábiles", minDays: 30, maxDays: 59 },
  { key: "no-response:60-119", label: "60 a 119 días hábiles", minDays: 60, maxDays: 119 },
  { key: "no-response:120+", label: "120+ días hábiles", minDays: 120 },
] as const

type DESOperationalDashboardProps = {
  dashboard: DESDashboardOperationalData
}

export function DESOperationalDashboard({ dashboard: _dashboard }: DESOperationalDashboardProps) {
  void _dashboard
  const pliegosPerPage = 3
  const [search, setSearch] = useState("")
  const [unidades, setUnidades] = useState<DESUnidad[]>([])
  const [pliegos, setPliegos] = useState<DESPliegoItem[]>([])
  const [puntos, setPuntos] = useState<DESValidationQueueItem[]>([])
  const [puntosPliegoActual, setPuntosPliegoActual] = useState<DESValidationQueueItem[]>([])
  const [selectedPointFilter, setSelectedPointFilter] = useState<"all" | "evidence:with">("all")
  const [selectedStaleResponseFilter, setSelectedStaleResponseFilter] = useState("all")
  const [selectedApprovalFilter, setSelectedApprovalFilter] = useState("all")
  const [selectedPrioridadFilter, setSelectedPrioridadFilter] = useState("all")
  const [selectedCategoriaFilter, setSelectedCategoriaFilter] = useState("all")
  const [selectedUnidadId, setSelectedUnidadId] = useState<string>("")
  const [selectedPliegoId, setSelectedPliegoId] = useState<number | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null)
  const [pliegosPage, setPliegosPage] = useState(1)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const loadData = async () => {
    setIsLoadingData(true)
    try {
      const [unidadesResponse, pliegosResponse, puntosResponse] = await Promise.all([
        fetch("/api/admin/unidades", { cache: "no-store" }),
        fetch("/api/admin/pliegos", { cache: "no-store" }),
        fetch("/api/admin/puntos", { cache: "no-store" }),
      ])

      const [unidadesPayload, pliegosPayload, puntosPayload] = await Promise.all([
        readJsonSafely(unidadesResponse),
        readJsonSafely(pliegosResponse),
        readJsonSafely(puntosResponse),
      ])

      if (!unidadesResponse.ok || !pliegosResponse.ok || !puntosResponse.ok) {
        return
      }

      const nextPliegos = (pliegosPayload.items ?? []) as DESPliegoItem[]
      const nextPuntos = (puntosPayload.items ?? []) as DESValidationQueueItem[]
      const unidadesConPliegos = new Set(nextPliegos.map((item) => item.unidad_id))
      const nextUnidades = ((unidadesPayload.items ?? []) as DESUnidad[]).filter(
        (item) => item.activo && unidadesConPliegos.has(item.id),
      )

      setUnidades(nextUnidades)
      setPliegos(nextPliegos)
      setPuntos(nextPuntos)

      const unidadIds = new Set(nextUnidades.map((item) => String(item.id)))
      setSelectedUnidadId((current) => {
        if (current && unidadIds.has(current)) {
          return current
        }

        const firstUnidadWithPliego = nextPliegos[0]?.unidad_id
        if (firstUnidadWithPliego) {
          return String(firstUnidadWithPliego)
        }

        return nextUnidades[0] ? String(nextUnidades[0].id) : ""
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    let isActive = true

    const loadInitialData = async () => {
      try {
        const [unidadesResponse, pliegosResponse, puntosResponse] = await Promise.all([
          fetch("/api/admin/unidades", { cache: "no-store" }),
          fetch("/api/admin/pliegos", { cache: "no-store" }),
          fetch("/api/admin/puntos", { cache: "no-store" }),
        ])

        const [unidadesPayload, pliegosPayload, puntosPayload] = await Promise.all([
          readJsonSafely(unidadesResponse),
          readJsonSafely(pliegosResponse),
          readJsonSafely(puntosResponse),
        ])

        if (!isActive || !unidadesResponse.ok || !pliegosResponse.ok || !puntosResponse.ok) {
          return
        }

        const nextPliegos = (pliegosPayload.items ?? []) as DESPliegoItem[]
        const nextPuntos = (puntosPayload.items ?? []) as DESValidationQueueItem[]
        const unidadesConPliegos = new Set(nextPliegos.map((item) => item.unidad_id))
        const nextUnidades = ((unidadesPayload.items ?? []) as DESUnidad[]).filter(
          (item) => item.activo && unidadesConPliegos.has(item.id),
        )

        setUnidades(nextUnidades)
        setPliegos(nextPliegos)
        setPuntos(nextPuntos)
        setSelectedUnidadId(() => {
          const firstUnidadWithPliego = nextPliegos[0]?.unidad_id
          if (firstUnidadWithPliego) {
            return String(firstUnidadWithPliego)
          }

          return nextUnidades[0] ? String(nextUnidades[0].id) : ""
        })
      } finally {
        if (isActive) {
          setIsLoadingData(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      isActive = false
    }
  }, [])

  const activeUnidadId = useMemo(() => {
    if (selectedUnidadId !== "") {
      return selectedUnidadId
    }
    if (pliegos[0]?.unidad_id) {
      return String(pliegos[0].unidad_id)
    }
    return unidades[0] ? String(unidades[0].id) : ""
  }, [pliegos, selectedUnidadId, unidades])

  const unidadActual = unidades.find((item) => String(item.id) === activeUnidadId) ?? null

  const pliegosDeUnidad = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return pliegos
      .filter((item) => String(item.unidad_id) === activeUnidadId)
      .filter((item) => {
        if (normalizedSearch === "") {
          return true
        }

        return (
          item.folio.toLowerCase().includes(normalizedSearch) ||
          item.titulo.toLowerCase().includes(normalizedSearch)
        )
      })
      .sort((left, right) => {
        return new Date(right.fecha_recepcion).getTime() - new Date(left.fecha_recepcion).getTime()
      })
  }, [activeUnidadId, pliegos, search])

  const activePliegoId =
    selectedPliegoId && pliegosDeUnidad.some((item) => item.id === selectedPliegoId)
      ? selectedPliegoId
      : pliegosDeUnidad[0]?.id ?? null

  const totalPliegoPages = Math.max(1, Math.ceil(pliegosDeUnidad.length / pliegosPerPage))
  const currentPliegosPage = Math.min(pliegosPage, totalPliegoPages)
  const paginatedPliegos = useMemo(() => {
    const start = (currentPliegosPage - 1) * pliegosPerPage
    return pliegosDeUnidad.slice(start, start + pliegosPerPage)
  }, [currentPliegosPage, pliegosDeUnidad])

  useEffect(() => {
    if (!activePliegoId) {
      return
    }

    let isActive = true

    const loadPliegoDetail = async () => {
      const response = await fetch(`/api/admin/pliegos/${activePliegoId}`, { cache: "no-store" })
      const payload = await readJsonSafely(response)

      if (!isActive || !response.ok) {
        return
      }

      const items = ((payload as { puntos?: DESValidationQueueItem[] }).puntos ?? []).sort(
        (left, right) => left.numero_punto - right.numero_punto,
      )
      setPuntosPliegoActual(items)
    }

    void loadPliegoDetail()

    return () => {
      isActive = false
    }
  }, [activePliegoId])

  const puntosDelPliego = useMemo(
    () => (activePliegoId ? puntosPliegoActual : []),
    [activePliegoId, puntosPliegoActual],
  )

  const priorityFilterOptions = useMemo(() => {
    const priorityMap = new Map<string, { key: string; label: string; count: number }>()

    for (const item of puntosDelPliego) {
      const priorityKey = `priority:${item.prioridad_clave}`
      const currentPriority = priorityMap.get(priorityKey)
      if (currentPriority) {
        currentPriority.count += 1
      } else {
        priorityMap.set(priorityKey, {
          key: priorityKey,
          label: item.prioridad_nombre,
          count: 1,
        })
      }
    }

    const priorityOrder = ["urgente", "alta", "media", "baja"]
    return [...priorityMap.values()].sort((left, right) => {
      const leftKey = left.key.replace("priority:", "")
      const rightKey = right.key.replace("priority:", "")
      return priorityOrder.indexOf(leftKey) - priorityOrder.indexOf(rightKey)
    })
  }, [puntosDelPliego])

  const categoryFilterOptions = useMemo(() => {
    const categoryMap = new Map<string, { key: string; label: string; count: number }>()

    for (const item of puntosDelPliego) {
      if (!item.categoria_nombre) {
        continue
      }

      const categoryKey = `category:${item.categoria_nombre}`
      const currentCategory = categoryMap.get(categoryKey)
      if (currentCategory) {
        currentCategory.count += 1
      } else {
        categoryMap.set(categoryKey, {
          key: categoryKey,
          label: item.categoria_nombre,
          count: 1,
        })
      }
    }

    return [...categoryMap.values()].sort((left, right) =>
      left.label.localeCompare(right.label, "es-MX"),
    )
  }, [puntosDelPliego])

  const puntosBaseParaConteosAntiguedad = useMemo(() => {
    let items = puntosDelPliego

    if (selectedPointFilter === "evidence:with") {
      items = items.filter((item) => (item.evidencias_count ?? 0) > 0)
    }

    if (selectedPrioridadFilter !== "all") {
      items = items.filter(
        (item) => item.prioridad_clave === selectedPrioridadFilter.replace("priority:", ""),
      )
    }

    if (selectedApprovalFilter !== "all") {
      items = items.filter((item) =>
        selectedApprovalFilter === "approved"
          ? item.estado_punto_clave === "validado"
          : item.estado_punto_clave === "rechazado",
      )
    }

    if (selectedCategoriaFilter !== "all") {
      items = items.filter(
        (item) => item.categoria_nombre === selectedCategoriaFilter.replace("category:", ""),
      )
    }

    return items
  }, [
    puntosDelPliego,
    selectedApprovalFilter,
    selectedCategoriaFilter,
    selectedPointFilter,
    selectedPrioridadFilter,
  ])

  const staleResponseFilterOptions = useMemo(() => {
    return STALE_RESPONSE_FILTER_OPTIONS.map((option) => ({
      key: option.key,
      label: option.label,
      count:
        option.key === "all"
          ? puntosBaseParaConteosAntiguedad.filter((item) => getPendingResponseDays(item) !== null)
              .length
          : puntosBaseParaConteosAntiguedad.filter((item) =>
              matchesStaleResponseFilter(item, option.key),
            ).length,
    }))
  }, [puntosBaseParaConteosAntiguedad])

  const puntosFiltrados = useMemo(() => {
    let items = puntosDelPliego

    if (selectedPointFilter === "evidence:with") {
      items = items.filter((item) => (item.evidencias_count ?? 0) > 0)
    }

    if (selectedStaleResponseFilter !== "all") {
      items = items.filter((item) => matchesStaleResponseFilter(item, selectedStaleResponseFilter))
    }

    if (selectedPrioridadFilter !== "all") {
      items = items.filter(
        (item) => item.prioridad_clave === selectedPrioridadFilter.replace("priority:", ""),
      )
    }

    if (selectedApprovalFilter !== "all") {
      items = items.filter((item) =>
        selectedApprovalFilter === "approved"
          ? item.estado_punto_clave === "validado"
          : item.estado_punto_clave === "rechazado",
      )
    }

    if (selectedCategoriaFilter !== "all") {
      items = items.filter(
        (item) => item.categoria_nombre === selectedCategoriaFilter.replace("category:", ""),
      )
    }

    return items
  }, [
    puntosDelPliego,
    selectedApprovalFilter,
    selectedCategoriaFilter,
    selectedPointFilter,
    selectedPrioridadFilter,
    selectedStaleResponseFilter,
  ])

  const activePointId =
    selectedPointId && puntosFiltrados.some((item) => item.id === selectedPointId)
      ? selectedPointId
      : puntosFiltrados[0]?.id ?? null

  const selectedItem =
    puntosFiltrados.find((item) => item.id === activePointId) ?? puntosFiltrados[0] ?? null

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-[calc(100vh-14rem)] lg:overflow-hidden">
      <section className="grid gap-4 lg:min-h-0 lg:flex-1 xl:grid-cols-[0.72fr_1.28fr]">
        <Card className="flex min-h-0 max-h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-[1.8rem] border-[#ddd8de] py-0 lg:h-full lg:max-h-none">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl text-[#5f1024]">Pliegos por unidad académica</CardTitle>
            <CardDescription>
              Selecciona una unidad académica y luego el pliego a revisar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-6 pb-6">
            <select
              value={activeUnidadId}
              onChange={(event) => {
                setSelectedUnidadId(event.target.value)
                setSelectedPliegoId(null)
                setSelectedPointId(null)
                setSelectedPointFilter("all")
                setSelectedStaleResponseFilter("all")
                setSelectedApprovalFilter("all")
                setSelectedPrioridadFilter("all")
                setSelectedCategoriaFilter("all")
                setPliegosPage(1)
              }}
              className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
            >
              {unidades.map((unidad) => (
                <option key={unidad.id} value={String(unidad.id)}>
                  {unidad.nombre}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8a8a91]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPliegosPage(1)
                }}
                placeholder="Buscar pliego por folio o título"
                className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white pl-11 pr-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-3 text-sm text-[#66666d]">
              <p>
                <span className="font-medium text-[#3e4047]">{pliegosDeUnidad.length}</span> pliego(s)
              </p>
              <p className="truncate text-right text-[#7a7a82]">
                {unidadActual?.nombre ?? "Sin unidad seleccionada"}
              </p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
              {isLoadingData ? (
                <EmptyState message="Cargando unidades y pliegos..." />
              ) : pliegosDeUnidad.length === 0 ? (
                <EmptyState message="No hay pliegos para esta unidad con ese filtro." />
              ) : (
                paginatedPliegos.map((pliego) => {
                  const totalPuntos = puntos.filter((item) => item.pliego_id === pliego.id).length

                  return (
                    <button
                      key={pliego.id}
                      type="button"
                      onClick={() => {
                        setSelectedPliegoId(pliego.id)
                        setSelectedPointId(null)
                        setSelectedPointFilter("all")
                        setSelectedStaleResponseFilter("all")
                        setSelectedApprovalFilter("all")
                        setSelectedPrioridadFilter("all")
                        setSelectedCategoriaFilter("all")
                      }}
                      className={`w-full rounded-[1.2rem] border px-4 py-3 text-left transition ${
                        pliego.id === activePliegoId
                          ? "border-[#cfaeb7] bg-[#fbf6f7] shadow-sm"
                          : "border-[#ece8ec] bg-white hover:border-[#d8c5cc] hover:bg-[#fffdfd]"
                      }`}
                    >
                      <p className="truncate text-xs uppercase tracking-[0.18em] text-[#8c8b92]">
                        {pliego.folio}
                      </p>
                      <p className="mt-1 font-medium text-[#404149]">{pliego.titulo}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[#66666d]">
                        <span>{totalPuntos} punto(s)</span>
                        <span className="font-medium text-[#5f1024]">
                          Recepción {formatDate(pliego.fecha_recepcion)}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {pliegosDeUnidad.length > pliegosPerPage ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-3 text-sm text-[#66666d]">
                <p>
                  Página <span className="font-medium text-[#3e4047]">{currentPliegosPage}</span> de{" "}
                  <span className="font-medium text-[#3e4047]">{totalPliegoPages}</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPliegosPage((current) => Math.max(1, current - 1))}
                    disabled={currentPliegosPage === 1}
                    className="rounded-full border border-[#ddd9de] px-3 py-1.5 text-sm text-[#5f5f67] transition hover:border-[#c9bcc2] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPliegosPage((current) => Math.min(totalPliegoPages, current + 1))
                    }
                    disabled={currentPliegosPage === totalPliegoPages}
                    className="rounded-full border border-[#ddd9de] px-3 py-1.5 text-sm text-[#5f5f67] transition hover:border-[#c9bcc2] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <DESValidationDetailPanel
          points={puntosFiltrados}
          item={selectedItem}
          selectedPointFilter={selectedPointFilter}
          selectedStaleResponseFilter={selectedStaleResponseFilter}
          selectedApprovalFilter={selectedApprovalFilter}
          selectedPrioridadFilter={selectedPrioridadFilter}
          selectedCategoriaFilter={selectedCategoriaFilter}
          priorityFilterOptions={priorityFilterOptions}
          categoryFilterOptions={categoryFilterOptions}
          staleResponseFilterOptions={staleResponseFilterOptions}
          onSelectPoint={setSelectedPointId}
          onSelectPointFilter={(value) => {
            setSelectedPointFilter(value)
            if (value === "all") {
              setSelectedStaleResponseFilter("all")
              setSelectedApprovalFilter("all")
              setSelectedPrioridadFilter("all")
              setSelectedCategoriaFilter("all")
            }
            setSelectedPointId(null)
          }}
          onSelectStaleResponseFilter={(value) => {
            setSelectedStaleResponseFilter(value)
            setSelectedPointId(null)
          }}
          onSelectApprovalFilter={(value) => {
            setSelectedApprovalFilter(value)
            setSelectedPointId(null)
          }}
          onSelectPrioridadFilter={(value) => {
            setSelectedPrioridadFilter(value)
            setSelectedPointId(null)
          }}
          onSelectCategoriaFilter={(value) => {
            setSelectedCategoriaFilter(value)
            setSelectedPointId(null)
          }}
          onValidated={loadData}
          className="h-full min-h-0"
        />
      </section>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
      {message}
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

async function readJsonSafely(response: Response) {
  const raw = await response.text()
  return raw.trim() === "" ? {} : JSON.parse(raw)
}

function getPendingResponseDays(item: DESValidationQueueItem) {
  if (!shouldCountPendingUnitResponse(item)) {
    return null
  }

  const pendingDays = businessDaysSince(item.fecha_registro)

  if (pendingDays < 0) {
    return null
  }

  return pendingDays
}

function matchesStaleResponseFilter(item: DESValidationQueueItem, filterKey: string) {
  if (filterKey === "all") {
    return true
  }

  const pendingDays = getPendingResponseDays(item)
  if (pendingDays === null) {
    return false
  }

  const option = STALE_RESPONSE_FILTER_OPTIONS.find((current) => current.key === filterKey)
  if (!option || option.minDays === undefined) {
    return false
  }

  if (pendingDays < option.minDays) {
    return false
  }

  if ("maxDays" in option && option.maxDays !== undefined && pendingDays > option.maxDays) {
    return false
  }

  return true
}

function shouldCountPendingUnitResponse(item: DESValidationQueueItem) {
  if (item.estado_punto_clave !== "requiere_informacion") {
    return false
  }

  if (!item.fecha_validacion_des) {
    return false
  }

  if (!item.fecha_respuesta_unidad) {
    return true
  }

  const validationTime = new Date(item.fecha_validacion_des).getTime()
  const unitResponseTime = new Date(item.fecha_respuesta_unidad).getTime()

  if (Number.isNaN(validationTime) || Number.isNaN(unitResponseTime)) {
    return false
  }

  return unitResponseTime < validationTime
}

function businessDaysSince(value: string) {
  const start = new Date(value)
  const end = new Date()

  if (Number.isNaN(start.getTime())) {
    return -1
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
