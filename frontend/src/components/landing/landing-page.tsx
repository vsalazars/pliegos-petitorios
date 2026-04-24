"use client"

import { Waypoints } from "lucide-react"
import { useState } from "react"

import { AccessModal } from "@/components/auth/access-modal"
import { accessOptions } from "@/components/auth/access-options"
import { AccessPortalCard } from "@/components/landing/access-portal-card"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHighlights } from "@/components/landing/landing-highlights"

const highlights = [
  {
    title: "Seguimiento claro",
    description: "Un solo punto de entrada para revisar pliegos, puntos y atención operativa.",
  },
  {
    title: "Escalable y mantenible",
    description: "Componentes pequeños para crecer después con login real y dashboard visual.",
  },
  {
    title: "Pensado para operación",
    description: "Prioriza semáforos, rezago y acciones inmediatas por encima de numeralia suelta.",
  },
]

export function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  const openLogin = () => {
    setIsLoginOpen(true)
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
      <LandingHeader />
      <AccessModal hideTrigger open={isLoginOpen} onOpenChange={setIsLoginOpen} />

      <section className="grid gap-8 pb-12 pt-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-12">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddd9de] bg-white/86 px-3 py-1 text-xs font-medium tracking-[0.22em] text-[#7a1730] uppercase shadow-sm backdrop-blur">
            <Waypoints className="size-3.5" />
            Plataforma Pliegos DES
          </div>

          <div className="space-y-4">
            <p className="max-w-2xl font-heading text-5xl leading-none tracking-tight text-[#5f1024] sm:text-6xl">
              Seguimiento de pliegos con entrada simple y base lista para crecer.
            </p>
            <p className="max-w-2xl text-base leading-7 text-[#55565d] sm:text-lg">
              Esta landing sirve como punto de arranque para el proyecto. Desde aquí
              después conectamos autenticación, roles y el dashboard operativo de DES
              sin concentrar toda la interfaz en un solo archivo.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <AccessModal triggerLabel="Iniciar sesión" open={isLoginOpen} onOpenChange={setIsLoginOpen} />
            <button
              className="inline-flex h-11 items-center justify-center rounded-full border border-[#cfccd3] bg-white/82 px-5 text-sm font-medium text-[#55565d] transition hover:border-[#5f1024] hover:text-[#5f1024]"
              onClick={openLogin}
              type="button"
            >
              Ver acceso institucional
            </button>
          </div>

          <LandingHighlights items={highlights} />
        </div>

        <div className="grid gap-4">
          {accessOptions.map((card) => (
            <AccessPortalCard
              key={card.id}
              {...card}
              onAccess={openLogin}
            />
          ))}
        </div>
      </section>
    </main>
  )
}
