import Link from "next/link"

export function LandingHeader() {
  return (
    <header className="flex items-center justify-between rounded-full border border-[#d8d6db] bg-white/88 px-5 py-3 shadow-sm backdrop-blur">
      <div>
        <p className="font-heading text-xl tracking-tight text-[#5f1024]">Pliegos DES</p>
        <p className="text-sm text-[#6a6a72]">Portal de acceso institucional</p>
      </div>

      <nav className="hidden items-center gap-5 text-sm text-[#6a6a72] md:flex">
        <Link className="transition hover:text-[#5f1024]" href="/login/des">
          DES
        </Link>
        <Link className="transition hover:text-[#5f1024]" href="/login/unidad">
          Unidad Académica
        </Link>
      </nav>
    </header>
  )
}
