import { Card, CardContent } from "@/components/ui/card"

export function DESMetricCard({
  label,
  value,
  tone = "slate",
}: {
  label: string
  value: number
  tone?: "solid" | "slate" | "green" | "rose"
}) {
  const toneClassName = {
    solid: "bg-[#5f1024] text-white border-[#5f1024]",
    slate: "bg-[#f2f4f7] text-[#55606d] border-[#e2e7ed]",
    green: "bg-[#edf6f1] text-[#2f6b4f] border-[#d5e7dc]",
    rose: "bg-[#f8ebef] text-[#7a1730] border-[#ead5db]",
  }[tone]

  return (
    <Card className={`rounded-[1.35rem] py-0 ${toneClassName}`}>
      <CardContent className="px-5 py-4">
        <p className="text-[0.95rem] opacity-80">{label}</p>
        <p className="mt-2 font-heading text-3xl tracking-tight">{value}</p>
      </CardContent>
    </Card>
  )
}
