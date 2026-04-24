import type { LucideIcon } from "lucide-react"
import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type AccessPortalCardProps = {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  tone: "des" | "unidad"
  Icon: LucideIcon
  onAccess: () => void
}

const toneStyles = {
  des: {
    shell: "border-[#8f1d35]/30 bg-[#5f1024] text-white",
    badge: "bg-white/14 text-white",
    bullet: "bg-[#d9d9dd]",
    button: "bg-white text-[#5f1024] hover:bg-[#f3ecee]",
  },
  unidad: {
    shell: "border-[#d7d7db] bg-white text-[#2f2f34]",
    badge: "bg-[#f3eaed] text-[#7a1730]",
    bullet: "bg-[#7a1730]",
    button: "bg-[#4a4a52] text-white hover:bg-[#3d3d44]",
  },
}

export function AccessPortalCard({
  eyebrow,
  title,
  description,
  bullets,
  tone,
  Icon,
  onAccess,
}: AccessPortalCardProps) {
  const palette = toneStyles[tone]

  return (
    <Card
      className={cn(
        "rounded-[2rem] border py-0 shadow-[0_20px_60px_rgba(15,23,42,0.08)]",
        palette.shell,
      )}
    >
      <CardHeader className="px-6 pt-6">
        <div className="flex items-start justify-between gap-4">
          <Badge className={cn("rounded-full border-0 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", palette.badge)}>
            {eyebrow}
          </Badge>
          <div className="rounded-2xl border border-current/10 bg-white/10 p-3">
            <Icon className="size-5" />
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <CardTitle className="text-3xl leading-tight">{title}</CardTitle>
          <p className={cn("text-sm leading-6", tone === "des" ? "text-white/84" : "text-[#5b5b62]")}>
            {description}
          </p>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6">
        <ul className="mt-2 space-y-3">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-3 text-sm">
              <span className={cn("size-2 rounded-full", palette.bullet)} />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onAccess}
          className={cn("mt-8 h-11 w-full rounded-full text-sm font-semibold", palette.button)}
        >
          Entrar
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
