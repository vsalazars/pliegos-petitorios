import { Card, CardContent } from "@/components/ui/card"
import type { UnidadDashboardData } from "@/lib/unidad-dashboard"

type UnitDashboardContentProps = {
  dashboard: UnidadDashboardData
}

export function UnitDashboardContent({ dashboard }: UnitDashboardContentProps) {
  const cards = [
    {
      label: "0 a 7 días",
      value: dashboard.resumen.puntos_antiguedad_0_7,
      tone: "green",
      detail: "Pendientes en ventana normal",
    },
    {
      label: "8 a 15 días",
      value: dashboard.resumen.puntos_antiguedad_8_15,
      tone: "amber",
      detail: "Requieren seguimiento cercano",
    },
    {
      label: "16 a 30 días",
      value: dashboard.resumen.puntos_antiguedad_16_30,
      tone: "rose",
      detail: "Ya muestran atraso operativo",
    },
    {
      label: "30+ días",
      value: dashboard.resumen.puntos_antiguedad_mas_30,
      tone: "solid",
      detail: "Casos más rezagados de la unidad",
    },
  ] as const

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-[#e6dfe3] bg-white/80 px-5 py-4">
        <p className="text-sm text-[#55555d]">
          Esta numeralia considera solo puntos pendientes de trabajo en la unidad:
          detectados, en atención o con observación DES.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <SummaryPill
            label="Pendientes operativos"
            value={dashboard.resumen.puntos_pendientes_operativos}
            tone="slate"
          />
          <SummaryPill
            label="Con observación DES"
            value={dashboard.resumen.puntos_con_observacion_des}
            tone="rose"
          />
          <SummaryPill
            label="En validación DES"
            value={dashboard.resumen.puntos_en_validacion_des}
            tone="amber"
          />
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            tone={card.tone}
            detail={card.detail}
          />
        ))}
      </section>
    </div>
  )
}

function MetricCard({
  label,
  value,
  tone,
  detail,
}: {
  label: string
  value: number
  tone: "solid" | "rose" | "green" | "slate" | "amber"
  detail: string
}) {
  const toneClassName = {
    solid: "bg-[#5f1024] text-white border-[#5f1024]",
    rose: "bg-[#f8ebef] text-[#7a1730] border-[#ead5db]",
    green: "bg-[#edf6f1] text-[#2f6b4f] border-[#d5e7dc]",
    slate: "bg-[#f2f4f7] text-[#55606d] border-[#e2e7ed]",
    amber: "bg-[#fff4de] text-[#8c5a08] border-[#f0dfbf]",
  }[tone]

  return (
    <Card className={`rounded-[1.6rem] py-0 ${toneClassName}`}>
      <CardContent className="px-5 py-5">
        <p className="text-sm opacity-80">{label}</p>
        <p className="mt-3 font-heading text-4xl tracking-tight">{value}</p>
        <p className="mt-2 text-sm opacity-80">{detail}</p>
      </CardContent>
    </Card>
  )
}

function SummaryPill({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: "slate" | "rose" | "amber"
}) {
  const toneClassName = {
    slate: "bg-[#f2f4f7] text-[#55606d]",
    rose: "bg-[#f8ebef] text-[#8b2740]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
  }[tone]

  return (
    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${toneClassName}`}>
      <span className="text-[11px] uppercase tracking-[0.16em] opacity-75">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}
