type UnitPageHeaderProps = {
  eyebrow: string
  title: string
  description: string
  actions?: React.ReactNode
}

export function UnitPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: UnitPageHeaderProps) {
  return (
    <section className="flex flex-col gap-4 rounded-[1.8rem] border border-[#ddd8de] bg-white/88 p-6 shadow-sm md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex rounded-full bg-[#f3eaed] px-3 py-1 text-[11px] tracking-[0.2em] uppercase text-[#7a1730]">
          {eyebrow}
        </div>
        <h1 className="mt-4 font-heading text-4xl tracking-tight text-[#5f1024]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-[#606068]">
          {description}
        </p>
      </div>

      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </section>
  )
}
