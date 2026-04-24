export type DESDashboardSummary = {
  total_unidades: number
  total_pliegos: number
  total_puntos: number
  puntos_requieren_validacion: number
  puntos_con_observacion_des: number
  puntos_pendientes_operativos: number
  puntos_validados: number
  puntos_rechazados: number
}

export type DESDashboardRecentItem = {
  id: number
  punto_id: number
  pliego_id: number
  unidad_id: number
  unidad_clave: string
  unidad_nombre: string
  folio_pliego: string
  titulo_pliego: string
  numero_punto: number
  resultado: string
  comentario?: string | null
  nombre_usuario?: string | null
  motivo_rechazo_nombre?: string | null
  fecha: string
  dias_desde: number
}

export type DESDashboardPointItem = {
  punto_id: number
  pliego_id: number
  unidad_id: number
  unidad_clave: string
  unidad_nombre: string
  folio_pliego: string
  titulo_pliego: string
  numero_punto: number
  estado_punto_clave: string
  estado_punto_nombre: string
  prioridad_clave: string
  prioridad_nombre: string
  requiere_validacion: boolean
  texto_final?: string | null
  categoria_nombre?: string | null
  dias_desde_registro_punto: number
  dias_desde_envio_validacion?: number | null
  dias_desde_respuesta_unidad?: number | null
}

export type DESTopUnidadPendiente = {
  unidad_id: number
  clave: string
  nombre: string
  puntos_pendientes_operativos: number
  puntos_requieren_validacion: number
  puntos_con_observacion_des: number
  puntos_en_proceso: number
  puntos_vencidos_7_dias: number
  max_dias_desde_registro_punto: number
}

export type DESDashboardOperationalData = {
  user: {
    rol_clave: string
    username: string
    correo: string
  }
  resumen: DESDashboardSummary
  recientes: {
    validaciones: DESDashboardRecentItem[]
    rechazos: DESDashboardRecentItem[]
  }
  atencion_inmediata: {
    pendientes_validacion: number
    con_observacion_des: number
    puntos_pendientes_operativos: number
    top_unidades_con_mas_puntos_pendientes: DESTopUnidadPendiente[]
    validaciones_sin_atender: DESDashboardPointItem[]
    respuestas_unidad_sin_reaccion_des: DESDashboardPointItem[]
    casos_criticos_resumen: {
      total: number
      pendientes_validacion: number
      con_observacion_des: number
      en_proceso: number
      vencidos_sla: number
    }
    casos_criticos: DESDashboardPointItem[]
  }
}

export function resolveDESPointStatus(item: DESDashboardPointItem) {
  if (item.requiere_validacion) {
    return "En validación DES"
  }
  if (item.estado_punto_clave === "requiere_informacion") {
    return "Con observación"
  }
  if (item.estado_punto_clave === "en_proceso") {
    return "En proceso"
  }
  return item.estado_punto_nombre
}

export type DESValidationQueueItem = {
  id: number
  pliego_id: number
  numero_punto: number
  texto_final: string
  evidencias_count?: number
  categoria_nombre?: string | null
  prioridad_nombre: string
  prioridad_clave: string
  estado_punto_nombre: string
  estado_punto_clave: string
  fecha_registro: string
  fecha_envio_validacion?: string | null
  requiere_validacion: boolean
  observaciones?: string | null
  unidad_id?: number | null
  unidad_clave?: string | null
  unidad_nombre?: string | null
  folio_pliego?: string | null
  titulo_pliego?: string | null
}

export type DESPliegoItem = {
  id: number
  unidad_id: number
  folio: string
  titulo: string
  fecha_recepcion: string
  fecha_registro: string
  estado_pliego_id: number
  estado_pliego_clave: string
  estado_pliego_nombre: string
  ocr_procesado: boolean
  texto_revision_final?: string | null
}

export type DESValidationDetailItem = {
  id: number
  resultado: string
  comentario?: string | null
  nombre_usuario?: string | null
  motivo_rechazo_nombre?: string | null
  es_vigente: boolean
  created_at: string
}

export type DESEvidenceDetailItem = {
  id: number
  titulo?: string | null
  descripcion?: string | null
  tipo_evidencia_nombre: string
  created_at: string
  archivo: {
    nombre_original: string
    tamano_bytes: number
  }
}

export type DESMotivoRechazo = {
  id: number
  clave: string
  nombre: string
  activo: boolean
}
