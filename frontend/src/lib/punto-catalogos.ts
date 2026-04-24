export type PrioridadOption = {
  id: number
  clave: string
  nombre: string
  nivel_orden: number
  dias_sla: number
  activo: boolean
}

export type EstadoPuntoOption = {
  id: number
  clave: string
  nombre: string
  color_hex?: string | null
  orden: number
  es_terminal: boolean
  activo: boolean
}

export type CategoriaPuntoOption = {
  id: number
  clave: string
  nombre: string
  descripcion?: string | null
  activo: boolean
}

export function resolveDefaultPrioridadId(items: PrioridadOption[]) {
  const media = items.find((item) => item.clave === "media")
  return media?.id ?? items[0]?.id ?? null
}

export function resolveDefaultEstadoPuntoId(items: EstadoPuntoOption[]) {
  const detectado = items.find((item) => item.clave === "detectado")
  return detectado?.id ?? items[0]?.id ?? null
}
