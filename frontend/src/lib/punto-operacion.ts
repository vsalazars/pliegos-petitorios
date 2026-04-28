export type TipoEvidenciaOption = {
  id: number
  clave: string
  nombre: string
  descripcion?: string | null
  activo: boolean
}

export type PuntoEvidenciaItem = {
  id: number
  punto_id: number
  archivo_id: number
  tipo_evidencia_id: number
  titulo?: string | null
  descripcion?: string | null
  visible_unidad: boolean
  visible_des: boolean
  es_vigente: boolean
  created_at: string
  tipo_evidencia_clave: string
  tipo_evidencia_nombre: string
  archivo: {
    id: number
    nombre_original: string
    ruta_storage: string
    extension?: string | null
    mime_type: string
    tamano_bytes: number
    created_at: string
  }
}
