export type AuthUser = {
  id: number
  unidad_id: number | null
  unidad_clave?: string | null
  unidad_nombre?: string | null
  rol_id: number
  rol_clave: string
  rol_nombre?: string
  ambito: string
  nombre?: string
  correo: string
  username: string
  activo?: boolean
  debe_cambiar_password: boolean
}

export type LoginResponse = {
  token: string
  expires_at: string
  user: AuthUser
}

export function resolveDashboardPath(rolClave: string) {
  switch (rolClave) {
    case "SUPERADMIN_DES":
    case "ADMIN_DES":
    case "REVISOR_DES":
    case "CONSULTA_DES":
      return "/dashboard/des"
    case "ADMIN_UNIDAD":
    case "CAPTURISTA_UNIDAD":
    case "CONSULTA_UNIDAD":
      return "/dashboard/unidad"
    default:
      return "/"
  }
}

export function isUnidadRole(rolClave: string) {
  return (
    rolClave === "ADMIN_UNIDAD" ||
    rolClave === "CAPTURISTA_UNIDAD" ||
    rolClave === "CONSULTA_UNIDAD"
  )
}
