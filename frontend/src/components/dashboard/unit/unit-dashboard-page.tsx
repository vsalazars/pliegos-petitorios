"use client"

import { useEffect, useState } from "react"

import { DashboardState } from "@/components/dashboard/shared/dashboard-state"
import { UnitDashboardContent } from "@/components/dashboard/unit/unit-dashboard-content"
import { UnitPageHeader } from "@/components/dashboard/unit/unit-page-header"
import type { UnidadDashboardData } from "@/lib/unidad-dashboard"

type UnidadDashboardResponse = {
  dashboard: UnidadDashboardData
}

export function UnitDashboardPage() {
  const [data, setData] = useState<UnidadDashboardResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/unidad/dashboard", { cache: "no-store" })
        const payload = await response.json()

        if (!response.ok) {
          setError(payload.error ?? "No fue posible cargar el dashboard.")
          return
        }

        setData(payload)
      } catch {
        setError("No fue posible conectar con el backend de pliegos.")
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  if (isLoading) {
    return (
      <>
        <UnitPageHeader
          eyebrow="Unidad Académica"
          title="Dashboard"
          description="Estamos cargando la numeralia operativa de puntos pendientes de la unidad."
        />
        <DashboardState
          title="Cargando dashboard"
          description="Estamos consultando tus pliegos, estados y alertas principales."
        />
      </>
    )
  }

  if (error || !data) {
    return (
      <>
        <UnitPageHeader
          eyebrow="Unidad Académica"
          title="Dashboard"
          description="Este espacio concentra solo la información necesaria para dar seguimiento real a los pliegos."
        />
        <DashboardState
          title="No pudimos abrir tu dashboard"
          description={error ?? "Intenta iniciar sesión otra vez para recuperar la sesión."}
        />
      </>
    )
  }

  return (
    <div className="space-y-6">
      <UnitPageHeader
        eyebrow="Unidad Académica"
        title="Dashboard"
        description="Numeralia operativa de puntos pendientes y su antigüedad dentro de la unidad."
      />
      <UnitDashboardContent dashboard={data.dashboard} />
    </div>
  )
}
