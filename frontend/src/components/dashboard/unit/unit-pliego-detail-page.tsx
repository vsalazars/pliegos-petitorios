"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

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
  const [data, setData] = useState<UnitPliegoDetailResponse | null>(null)
  const [prioridades, setPrioridades] = useState<PrioridadOption[]>([])
  const [categorias, setCategorias] = useState<CategoriaPuntoOption[]>([])
  const [evidenceCounts, setEvidenceCounts] = useState<PointEvidenceCountMap>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const { item, puntos } = data
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
                  {puntos.length} punto(s) visibles para la unidad autenticada.
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
        <CardContent className="space-y-3 px-6 pb-6">
          {puntos.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Este pliego todavía no tiene puntos registrados.
            </div>
          ) : (
            puntos
              .sort((left, right) => left.numero_punto - right.numero_punto)
              .map((punto) => (
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
