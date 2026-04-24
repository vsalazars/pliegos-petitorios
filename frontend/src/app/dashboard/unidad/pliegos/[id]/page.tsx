import { UnitPliegoDetailPage } from "@/components/dashboard/unit/unit-pliego-detail-page"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function UnidadPliegoDetailRoute({ params }: PageProps) {
  const { id } = await params

  return <UnitPliegoDetailPage id={id} />
}
