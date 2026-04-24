"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

import { DashboardState } from "@/components/dashboard/shared/dashboard-state"
import { NewPliegoDialog } from "@/components/dashboard/unit/new-pliego-dialog"
import { UnitPageHeader } from "@/components/dashboard/unit/unit-page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

  return (
    <div className="space-y-6">
      <UnitPageHeader
        eyebrow="Gestión de pliegos"
        title="Pliegos"
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
          {data.items.length === 0 ? (
            <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
              Todavía no hay pliegos registrados para esta unidad.
            </div>
          ) : (
            data.items.map((item) => <PliegoListItem key={item.id} item={item} />)
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function PliegoListItem({ item }: { item: UnidadPliego }) {
  return (
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
