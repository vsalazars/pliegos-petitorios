"use client"

import { Search } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { DashboardState } from "@/components/dashboard/shared/dashboard-state"
import { NewPointDialog } from "@/components/dashboard/unit/new-point-dialog"
import { UnitPliegoPointCard } from "@/components/dashboard/unit/unit-pliego-point-card"
import { UnitPageHeader } from "@/components/dashboard/unit/unit-page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { CategoriaPuntoOption, PrioridadOption } from "@/lib/punto-catalogos"
import type { UnidadPliego, UnidadPliegoPunto } from "@/lib/unidad-dashboard"

type UnitPliegoDetailPageProps = {
  id: string
}

type UnitPliegoDetailResponse = {
  item: UnidadPliego
  puntos: UnidadPliegoPunto[]
}

type PointEvidenceCountMap = Record<number, number>

export function UnitPliegoDetailPage({ id }: UnitPliegoDetailPageProps) {
  const pointsPerPage = 10
  const [data, setData] = useState<UnitPliegoDetailResponse | null>(null)
  const [prioridades, setPrioridades] = useState<PrioridadOption[]>([])
  const [categorias, setCategorias] = useState<CategoriaPuntoOption[]>([])
  const [evidenceCounts, setEvidenceCounts] = useState<PointEvidenceCountMap>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pointSearch, setPointSearch] = useState("")
  const [pointsPage, setPointsPage] = useState(1)

  const reload = async () => {
    try {
      const result = await fetchPliegoDetail(id)
      if (!result.ok) {
        setError(result.error)
        return
      }

      setError(null)
      setData(result.data)
      setEvidenceCounts(await fetchEvidenceCounts(result.data.item.id, result.data.puntos))
      setPointsPage(1)
    } catch {
      setError("No fue posible conectar con el backend del pliego.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isActive = true

    const loadInitialData = async () => {
      try {
        const [detailResult, catalogosResult] = await Promise.all([
          fetchPliegoDetail(id),
          fetchPointCatalogs(),
        ])
        if (!isActive) {
          return
        }

        if (!detailResult.ok) {
          setError(detailResult.error)
          return
        }

        if (!catalogosResult.ok) {
          setError(catalogosResult.error)
          return
        }

        setError(null)
        setData(detailResult.data)
        setPrioridades(catalogosResult.prioridades)
        setCategorias(catalogosResult.categorias)
        setEvidenceCounts(
          await fetchEvidenceCounts(detailResult.data.item.id, detailResult.data.puntos),
        )
      } catch {
        if (!isActive) {
          return
        }
        setError("No fue posible conectar con el backend del pliego.")
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      isActive = false
    }
  }, [id])

  const puntos = useMemo(() => data?.puntos ?? [], [data?.puntos])
  const filteredPoints = useMemo(() => {
    const normalizedSearch = pointSearch.trim().toLowerCase()

    return [...puntos]
      .sort((left, right) => left.numero_punto - right.numero_punto)
      .filter((punto) => {
        if (normalizedSearch === "") {
          return true
        }

        return (
          String(punto.numero_punto).includes(normalizedSearch) ||
          punto.texto_final.toLowerCase().includes(normalizedSearch) ||
          (punto.categoria_nombre ?? "").toLowerCase().includes(normalizedSearch) ||
          punto.prioridad_nombre.toLowerCase().includes(normalizedSearch) ||
          punto.estado_punto_nombre.toLowerCase().includes(normalizedSearch)
        )
      })
  }, [pointSearch, puntos])
  const totalPointPages = Math.max(1, Math.ceil(filteredPoints.length / pointsPerPage))
  const currentPointsPage = Math.min(pointsPage, totalPointPages)
  const paginatedPoints = useMemo(() => {
    const start = (currentPointsPage - 1) * pointsPerPage
    return filteredPoints.slice(start, start + pointsPerPage)
  }, [currentPointsPage, filteredPoints])

  if (isLoading) {
    return (
      <DashboardState
        title="Cargando detalle del pliego"
        description="Estamos consultando la ficha completa del pliego y sus puntos detectados."
      />
    )
  }

  if (error || !data) {
    return (
      <DashboardState
        title="No pudimos abrir este pliego"
        description={error ?? "Intenta volver al listado y recargar la sesión."}
      />
    )
  }

  const { item } = data
  const nextNumeroPunto =
    puntos.length === 0
      ? 1
      : Math.max(...puntos.map((punto) => punto.numero_punto)) + 1

  return (
    <div className="space-y-6">
      <UnitPageHeader
        eyebrow="Detalle de pliego"
        title={item.titulo}
        description={`Folio ${item.folio}. Aquí puedes revisar el contexto del pliego y los puntos registrados para la unidad académica.`}
        actions={
          <Link
            href="/dashboard/unidad/pliegos"
            className="inline-flex h-11 items-center rounded-full border border-[#d6d0d6] bg-white px-5 text-sm font-medium text-[#5d5d65] transition hover:border-[#5f1024] hover:text-[#5f1024]"
          >
            Volver a pliegos
          </Link>
        }
      />

      <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
        <CardHeader className="px-6 pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div>
                <CardTitle className="text-2xl text-[#5f1024]">Puntos del pliego</CardTitle>
                <CardDescription>
                  {filteredPoints.length} punto(s) visible(s) para la unidad autenticada.
                </CardDescription>
              </div>
            </div>

            <NewPointDialog
              pliegoId={item.id}
              nextNumeroPunto={nextNumeroPunto}
              onCreated={reload}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#8a8a91]" />
            <input
              value={pointSearch}
              onChange={(event) => {
                setPointSearch(event.target.value)
                setPointsPage(1)
              }}
              placeholder="Buscar punto por número, texto, categoría, prioridad o estado"
              className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white pl-11 pr-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
            />
          </div>

          {puntos.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Este pliego todavía no tiene puntos registrados.
            </div>
          ) : filteredPoints.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              No hay puntos que coincidan con esa búsqueda.
            </div>
          ) : (
            paginatedPoints.map((punto) => (
                <UnitPliegoPointCard
                  key={punto.id}
                  pliegoId={item.id}
                  punto={punto}
                  evidenceCount={evidenceCounts[punto.id] ?? 0}
                  prioridades={prioridades}
                  categorias={categorias}
                  onSaved={reload}
                />
              ))
          )}

          {filteredPoints.length > pointsPerPage ? (
            <div className="flex flex-col gap-3 rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-3 text-sm text-[#66666d] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Página <span className="font-medium text-[#3e4047]">{currentPointsPage}</span> de{" "}
                <span className="font-medium text-[#3e4047]">{totalPointPages}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPointsPage((current) => Math.max(1, current - 1))}
                  disabled={currentPointsPage === 1}
                  className="rounded-full border border-[#ddd9de] px-3 py-1.5 text-sm text-[#5f5f67] transition hover:border-[#c9bcc2] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPointsPage((current) => Math.min(totalPointPages, current + 1))
                  }
                  disabled={currentPointsPage === totalPointPages}
                  className="rounded-full border border-[#ddd9de] px-3 py-1.5 text-sm text-[#5f5f67] transition hover:border-[#c9bcc2] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

async function fetchPliegoDetail(id: string): Promise<
  | { ok: true; data: UnitPliegoDetailResponse }
  | { ok: false; error: string }
> {
  const response = await fetch(`/api/unidad/pliegos/${id}`, {
    cache: "no-store",
  })
  const payload = (await response.json()) as
    | UnitPliegoDetailResponse
    | { error?: string }

  if (!response.ok) {
    return {
      ok: false,
      error:
        "error" in payload && typeof payload.error === "string"
          ? payload.error
          : "No fue posible cargar el detalle del pliego.",
    }
  }

  return {
    ok: true,
    data: payload as UnitPliegoDetailResponse,
  }
}

async function fetchPointCatalogs(): Promise<
  | { ok: true; prioridades: PrioridadOption[]; categorias: CategoriaPuntoOption[] }
  | { ok: false; error: string }
> {
  const [prioridadesResponse, categoriasResponse] = await Promise.all([
    fetch("/api/unidad/catalogos/prioridades", { cache: "no-store" }),
    fetch("/api/unidad/catalogos/categorias-punto", { cache: "no-store" }),
  ])

  const prioridadesPayload = (await prioridadesResponse.json()) as {
    items?: PrioridadOption[]
    error?: string
  }
  const categoriasPayload = (await categoriasResponse.json()) as {
    items?: CategoriaPuntoOption[]
    error?: string
  }

  if (!prioridadesResponse.ok) {
    return {
      ok: false,
      error:
        prioridadesPayload.error ?? "No fue posible cargar las prioridades del punto.",
    }
  }

  if (!categoriasResponse.ok) {
    return {
      ok: false,
      error:
        categoriasPayload.error ?? "No fue posible cargar las categorías del punto.",
    }
  }

  return {
    ok: true,
    prioridades: prioridadesPayload.items ?? [],
    categorias: categoriasPayload.items ?? [],
  }
}

async function fetchEvidenceCounts(
  pliegoId: number,
  puntos: UnidadPliegoPunto[],
): Promise<PointEvidenceCountMap> {
  const counts = await Promise.all(
    puntos.map(async (punto) => {
      try {
        const response = await fetch(
          `/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}/evidencias`,
          {
            cache: "no-store",
          },
        )
        const payload = (await response.json()) as { items?: Array<unknown> }

        if (!response.ok) {
          return [punto.id, 0] as const
        }

        return [punto.id, payload.items?.length ?? 0] as const
      } catch {
        return [punto.id, 0] as const
      }
    }),
  )

  return Object.fromEntries(counts)
}
