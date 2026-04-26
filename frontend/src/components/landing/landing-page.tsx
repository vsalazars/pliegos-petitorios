"use client"

import Image from "next/image"
import { useState } from "react"

import { AccessModal } from "@/components/auth/access-modal"

export function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(122,23,48,0.08),_transparent_32%),linear-gradient(180deg,#fffafc_0%,#f8f3f6_48%,#eef4fb_100%)] px-5 py-8 sm:px-8">
      <AccessModal hideTrigger open={isLoginOpen} onOpenChange={setIsLoginOpen} />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl items-center justify-center">
        <div className="w-full rounded-[2rem] border border-[#e1dbe0] bg-white/88 px-6 py-8 text-center shadow-[0_18px_48px_rgba(95,16,36,0.08)] backdrop-blur sm:px-10 sm:py-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center">
            <div className="relative h-24 w-24 sm:h-28 sm:w-28">
              <Image
                src="/logo-ipn.webp"
                alt="Escudo del Instituto Politécnico Nacional"
                fill
                className="object-contain"
                priority
                sizes="128px"
              />
            </div>

            <div className="mt-5 space-y-1.5 text-center">
              <p className="text-xs uppercase tracking-[0.28em] text-[#8f8690] sm:text-sm">
                Instituto Politécnico Nacional
              </p>
              <p className="text-sm text-[#6d6d75] sm:text-base">Secretaría Académica</p>
              <p className="text-sm text-[#6d6d75] sm:text-base">Dirección de Educación Superior</p>
            </div>

            <div className="mt-7 space-y-3">
              <h1 className="font-heading text-3xl leading-none tracking-tight text-[#5f1024] sm:text-5xl">
                Sistema de Gestión de Pliegos Petitorios
              </h1>
              <p className="mx-auto max-w-xl text-sm leading-7 text-[#595a62] sm:text-base">
                Plataforma institucional para registrar y dar seguimiento a pliegos
                petitorios, concentrando la atención por unidad académica.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#5f1024] px-7 text-sm font-medium text-white transition hover:bg-[#7a1730]"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}
