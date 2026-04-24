type LandingHighlight = {
  title: string
  description: string
}

type LandingHighlightsProps = {
  items: LandingHighlight[]
}

export function LandingHighlights({ items }: LandingHighlightsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.title}
          className="rounded-[1.6rem] border border-[#dddbe0] bg-white/82 p-5 shadow-sm backdrop-blur"
        >
          <h3 className="font-heading text-2xl tracking-tight text-[#5f1024]">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#606068]">{item.description}</p>
        </article>
      ))}
    </div>
  )
}
