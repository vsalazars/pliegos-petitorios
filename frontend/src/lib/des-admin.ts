export type DESUnidad = {
  id: number
  clave: string
  nombre: string
  correo_oficial?: string | null
  telefono?: string | null
  titular_nombre?: string | null
  activo: boolean
}

export type DESRole = {
  id: number
  clave: string
  nombre: string
  ambito?: string
  activo?: boolean
}

export type DESUser = {
  id: number
  unidad_id?: number | null
  unidad_clave?: string | null
  unidad_nombre?: string | null
  rol_id: number
  rol_clave: string
  rol_nombre: string
  nombre: string
  apellido_paterno?: string | null
  apellido_materno?: string | null
  correo: string
  username: string
  activo: boolean
  debe_cambiar_password: boolean
  created_at: string
}

export function resolveFullName(user: Pick<
  DESUser,
  "nombre" | "apellido_paterno" | "apellido_materno"
>) {
  return [user.nombre, user.apellido_paterno, user.apellido_materno]
    .filter(Boolean)
    .join(" ")
}

export function isUnidadRole(rolClave: string) {
  return (
    rolClave === "ADMIN_UNIDAD" ||
    rolClave === "CAPTURISTA_UNIDAD" ||
    rolClave === "CONSULTA_UNIDAD"
  )
}
