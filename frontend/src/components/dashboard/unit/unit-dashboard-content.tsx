import Link from "next/link"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  resolveUnidadPliegoEstadoLabel,
  resolveUnidadPliegoEstadoTone,
} from "@/lib/unidad-display"
import type { UnidadDashboardData, UnidadPliego } from "@/lib/unidad-dashboard"

type UnitDashboardContentProps = {
  dashboard: UnidadDashboardData
}

export function UnitDashboardContent({ dashboard }: UnitDashboardContentProps) {
  const cards = [
    {
      label: "Pliegos activos",
      value: dashboard.resumen.pliegos_activos,
      tone: "solid",
    },
    {
      label: "Por revisar",
      value: dashboard.resumen.pliegos_por_revisar,
      tone: "rose",
    },
    {
      label: "Con revisión final",
      value: dashboard.resumen.pliegos_con_revision_final,
      tone: "green",
    },
    {
      label: "Cerrados",
      value: dashboard.resumen.pliegos_cerrados,
      tone: "slate",
    },
  ] as const

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            tone={card.tone}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl text-[#5f1024]">Pendientes clave</CardTitle>
            <CardDescription>
              Pliegos abiertos que todavía requieren revisión o cierre documental.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {dashboard.alertas.sin_revision_final.length === 0 ? (
              <EmptyState message="No hay pliegos abiertos pendientes de revisión final." />
            ) : (
              dashboard.alertas.sin_revision_final.map((item) => (
                <CompactPliegoRow
                  key={item.id}
                  item={item}
                  subtitle={
                    item.estado_pliego_clave === "pendiente_revision_ocr"
                      ? "Necesita revisión inicial"
                      : "Sigue abierto sin cierre documental"
                  }
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.8rem] border-[#ddd8de] py-0">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-2xl text-[#5f1024]">Movimiento reciente</CardTitle>
            <CardDescription>
              Últimos pliegos registrados o actualizados para seguimiento rápido.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {dashboard.recientes.length === 0 ? (
              <EmptyState message="Todavía no hay movimiento reciente en esta unidad." />
            ) : (
              dashboard.recientes.map((item) => (
                <CompactPliegoRow
                  key={item.id}
                  item={item}
                  subtitle={`Registrado ${formatDate(item.fecha_registro)}`}
                />
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "solid" | "rose" | "green" | "slate"
}) {
  const toneClassName = {
    solid: "bg-[#5f1024] text-white border-[#5f1024]",
    rose: "bg-[#f8ebef] text-[#7a1730] border-[#ead5db]",
    green: "bg-[#edf6f1] text-[#2f6b4f] border-[#d5e7dc]",
    slate: "bg-[#f2f4f7] text-[#55606d] border-[#e2e7ed]",
  }[tone]

  return (
    <Card className={`rounded-[1.6rem] py-0 ${toneClassName}`}>
      <CardContent className="px-5 py-5">
        <p className="text-sm opacity-80">{label}</p>
        <p className="mt-3 font-heading text-4xl tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}

function CompactPliegoRow({
  item,
  subtitle,
}: {
  item: UnidadPliego
  subtitle: string
}) {
  return (
    <Link
      href={`/dashboard/unidad/pliegos/${item.id}`}
      className="block rounded-[1.35rem] border border-[#ece8ec] bg-white px-4 py-4 transition hover:border-[#d8c5cc] hover:bg-[#fffdfd]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-[#404149]">{item.titulo}</p>
          <p className="mt-1 text-sm text-[#76767d]">{item.folio}</p>
        </div>
        <StatusPill item={item} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#66666d]">
        <span>{subtitle}</span>
        <span>Recepción {formatDate(item.fecha_recepcion)}</span>
        <span>{item.texto_revision_final ? "Con revisión final" : "Sin revisión final"}</span>
      </div>
    </Link>
  )
}

function StatusPill({ item }: { item: UnidadPliego }) {
  const toneClassName = {
    rose: "bg-[#f8ebef] text-[#8b2740]",
    slate: "bg-[#f2f4f7] text-[#55606d]",
    green: "bg-[#edf6f1] text-[#2f6b4f]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
  }[resolveUnidadPliegoEstadoTone(item)]

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${toneClassName}`}>
      {resolveUnidadPliegoEstadoLabel(item)}
    </span>
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
