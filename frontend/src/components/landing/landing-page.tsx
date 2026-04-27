"use client"

import Image from "next/image"
import { useState } from "react"

import { AccessModal } from "@/components/auth/access-modal"

export function LandingPage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false)

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(122,23,48,0.08),_transparent_32%),linear-gradient(180deg,#fffafc_0%,#f8f3f6_48%,#eef4fb_100%)]">
      <AccessModal hideTrigger open={isLoginOpen} onOpenChange={setIsLoginOpen} />

      <FederalHeader />
      <InstitutionalStrip />

      <section className="px-5 py-8 sm:px-8 sm:py-10">
        <div className="mx-auto flex min-h-[calc(100vh-21rem)] w-full max-w-3xl items-center justify-center">
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
                <p className="text-sm text-[#6d6d75] sm:text-base">
                  Dirección de Educación Superior
                </p>
              </div>

              <div className="mt-7 space-y-3">
                <h1 className="font-heading text-3xl leading-none tracking-tight text-[#5f1024] sm:text-5xl">
                  Sistema de Gestión de Pliegos Petitorios
                </h1>
                <p className="mx-auto max-w-xl text-sm leading-7 text-[#595a62] sm:text-base">
                  Plataforma institucional para registrar, organizar y dar seguimiento
                  a pliegos petitorios, concentrando la atención operativa por unidad
                  académica y validación institucional desde la DES.
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
        </div>
      </section>

      <IPNFooter />
      <FederalFooter />
    </main>
  )
}

function FederalHeader() {
  return (
    <header className="bg-[#611232] text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <a
          href="https://www.gob.mx/"
          target="_blank"
          rel="noreferrer"
          className="shrink-0"
          aria-label="Gobierno de México"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://framework-gb.cdn.gob.mx/gobmx/img/logo_blanco.svg"
            alt="Gobierno de México"
            className="h-10 w-auto sm:h-12"
          />
        </a>

        <nav className="hidden items-center gap-5 text-sm text-white/90 sm:flex">
          <a href="https://www.gob.mx/tramites" target="_blank" rel="noreferrer">
            Trámites
          </a>
          <a href="https://www.gob.mx/gobierno" target="_blank" rel="noreferrer">
            Gobierno
          </a>
          <a href="https://www.gob.mx/busqueda" target="_blank" rel="noreferrer">
            Búsqueda
          </a>
        </nav>
      </div>
    </header>
  )
}

function FederalFooter() {
  return (
    <footer className="bg-[#611232] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1fr_1fr_1fr]">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://framework-gb.cdn.gob.mx/gobmx/img/logo_blanco.svg"
            alt="Gobierno de México"
            className="h-14 w-auto"
          />
        </div>

        <div className="space-y-3 text-sm leading-6 text-white/85">
          <h2 className="text-base font-semibold text-white">Enlaces</h2>
          <ul className="space-y-1">
            <li>
              <a href="https://participa.gob.mx" target="_blank" rel="noreferrer">
                Participa
              </a>
            </li>
            <li>
              <a href="http://www.ordenjuridico.gob.mx" target="_blank" rel="noreferrer">
                Marco Jurídico
              </a>
            </li>
            <li>
              <a
                href="https://consultapublicamx.inai.org.mx/vut-web/"
                target="_blank"
                rel="noreferrer"
              >
                Plataforma Nacional de Transparencia
              </a>
            </li>
            <li>
              <a href="https://transparencia.gob.mx" target="_blank" rel="noreferrer">
                Transparencia para el pueblo
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm leading-6 text-white/85">
          <h2 className="text-base font-semibold text-white">¿Qué es gob.mx?</h2>
          <p>
            Es el portal único de trámites, información y participación ciudadana.
          </p>
          <ul className="space-y-1">
            <li>
              <a href="https://datos.gob.mx" target="_blank" rel="noreferrer">
                Portal de datos abiertos
              </a>
            </li>
            <li>
              <a href="https://www.gob.mx/accesibilidad" target="_blank" rel="noreferrer">
                Declaración de accesibilidad
              </a>
            </li>
            <li>
              <a href="https://www.gob.mx/terminos" target="_blank" rel="noreferrer">
                Términos y Condiciones
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3 text-sm leading-6 text-white/85">
          <h2 className="text-base font-semibold text-white">
            Denuncia contra servidores públicos
          </h2>
          <a
            href="https://sidec.buengobierno.gob.mx/#!/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-full border border-white/30 px-4 py-2 text-white transition hover:bg-white/10"
          >
            Ir a SIDEC
          </a>
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-white">Síguenos en</h3>
            <div className="mt-2 flex flex-wrap gap-3">
              <a href="https://www.facebook.com/gobmexico" target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a href="https://twitter.com/GobiernoMX" target="_blank" rel="noreferrer">
                X
              </a>
              <a href="https://www.instagram.com/gobmexico/" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://www.youtube.com/@gobiernodemexico" target="_blank" rel="noreferrer">
                YouTube
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="h-4 bg-[linear-gradient(90deg,#b38e5d_0%,#d1b17e_20%,#ede0c6_50%,#d1b17e_80%,#b38e5d_100%)]" />
    </footer>
  )
}

function InstitutionalStrip() {
  return (
    <section className="border-b border-[#ebe4e7] bg-white/92">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 py-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center justify-center gap-6 lg:justify-start">
          <a
            href="https://www.gob.mx/sep"
            target="_blank"
            rel="noreferrer"
            aria-label="Secretaría de Educación Pública"
            className="transition hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.ipn.mx/assets/files/main/img/template/header/pleca-educacion.svg"
              alt="Secretaría de Educación Pública"
              className="h-14 w-auto sm:h-16"
            />
          </a>

          <a
            href="https://www.ipn.mx/"
            target="_blank"
            rel="noreferrer"
            aria-label="Instituto Politécnico Nacional"
            className="transition hover:opacity-90"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.ipn.mx/assets/files/main/img/template/header/logo-ipn-horizontal.svg"
              alt="Instituto Politécnico Nacional"
              className="h-14 w-auto sm:h-16"
            />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs uppercase tracking-[0.12em] text-[#66666d] sm:text-sm lg:justify-end">
          <a href="https://www.ipn.mx/directorio-telefonico.html" target="_blank" rel="noreferrer">
            Directorio
          </a>
          <span className="text-[#b7adb3]">|</span>
          <a href="https://www.ipn.mx/correo-electronico.html" target="_blank" rel="noreferrer">
            Correo
          </a>
          <span className="text-[#b7adb3]">|</span>
          <a href="https://www.ipn.mx/calendario-academico.html" target="_blank" rel="noreferrer">
            Calendario
          </a>
          <span className="text-[#b7adb3]">|</span>
          <a href="https://www.ipn.mx/transparencia/" target="_blank" rel="noreferrer">
            Transparencia
          </a>
          <span className="text-[#b7adb3]">|</span>
          <a
            href="https://www.ipn.mx/proteccion-datos-personales/"
            target="_blank"
            rel="noreferrer"
          >
            Protección de datos
          </a>
        </div>
      </div>
    </section>
  )
}

function IPNFooter() {
  return (
    <section className="border-t border-[#e3dbe0] bg-[#3b3b3d] text-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-center">
        <div className="flex justify-center lg:justify-start">
          <a
            href="https://www.gob.mx/sep"
            target="_blank"
            rel="noreferrer"
            aria-label="Secretaría de Educación Pública"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://www.ipn.mx/assets/files/main/img/template/footer/pleca-educacion-footer.png"
              alt="Secretaría de Educación Pública"
              className="h-16 w-auto sm:h-20"
            />
          </a>
        </div>

        <div className="space-y-4 text-center lg:text-left">
          <p className="text-sm uppercase tracking-[0.18em] text-white/75">
            Instituto Politécnico Nacional
          </p>
          <p className="text-sm leading-7 text-white/80 sm:text-base">
            D.R. Instituto Politécnico Nacional (IPN). Av. Luis Enrique Erro S/N,
            Unidad Profesional Adolfo López Mateos, Zacatenco, Alcaldía Gustavo A.
            Madero, C.P. 07738, Ciudad de México. Conmutador: 55 57 29 60 00 / 55 57
            29 63 00.
          </p>
          <p className="text-sm leading-7 text-white/72 sm:text-base">
            Esta página es una obra intelectual protegida por la Ley Federal del
            Derecho de Autor; puede ser reproducida con fines no lucrativos, siempre
            y cuando no se mutile, se cite la fuente completa y su dirección
            electrónica. Su uso para otros fines requiere autorización previa y por
            escrito de la Dirección General del Instituto.
          </p>
        </div>
      </div>
    </section>
  )
}
