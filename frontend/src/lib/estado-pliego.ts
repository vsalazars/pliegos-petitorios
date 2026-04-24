export type EstadoPliego = {
  id: number
  clave: string
  nombre: string
  color_hex?: string | null
  orden: number
  activo: boolean
}

export function resolveDefaultEstadoPliegoId(items: EstadoPliego[]) {
  const recibido = items.find((item) => item.clave === "recibido")
  return recibido?.id ?? items[0]?.id ?? null
}
