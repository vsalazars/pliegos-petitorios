type DashboardStateProps = {
  title: string
  description: string
}

export function DashboardState({ title, description }: DashboardStateProps) {
  return (
    <section className="rounded-[2rem] border border-[#ddd8de] bg-white/88 p-8 text-center shadow-sm">
      <h2 className="font-heading text-3xl tracking-tight text-[#5f1024]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#606068]">
        {description}
      </p>
    </section>
  )
}
