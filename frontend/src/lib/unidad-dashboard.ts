export type UnidadPliego = {
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

export type UnidadPliegoPunto = {
  id: number
  pliego_id: number
  numero_punto: number
  texto_original_ocr?: string | null
  texto_final: string
  categoria_id?: number | null
  categoria_clave?: string | null
  categoria_nombre?: string | null
  prioridad_id: number
  prioridad_clave: string
  prioridad_nombre: string
  estado_punto_id: number
  estado_punto_clave: string
  estado_punto_nombre: string
  fecha_registro: string
  fecha_envio_validacion?: string | null
  fecha_respuesta_unidad?: string | null
  fecha_validacion_des?: string | null
  origen_captura: string
  requiere_validacion: boolean
  observaciones?: string | null
  validacion_resultado_vigente?: string | null
  validacion_comentario_vigente?: string | null
  validacion_motivo_rechazo_nombre?: string | null
}

export type UnidadDashboardData = {
  resumen: {
    total_pliegos: number
    pliegos_activos: number
    pliegos_por_revisar: number
    pliegos_con_revision_final: number
    pliegos_cerrados: number
  }
  por_estado: Array<{
    clave: string
    nombre: string
    total: number
  }>
  recientes: UnidadPliego[]
  alertas: {
    por_revisar: UnidadPliego[]
    sin_revision_final: UnidadPliego[]
  }
}

export function buildUnidadDashboard(items: UnidadPliego[]): UnidadDashboardData {
  const resumen = {
    total_pliegos: items.length,
    pliegos_activos: 0,
    pliegos_por_revisar: 0,
    pliegos_con_revision_final: 0,
    pliegos_cerrados: 0,
  }

  const porEstadoMap = new Map<
    string,
    { clave: string; nombre: string; total: number }
  >()

  for (const item of items) {
    if (item.estado_pliego_clave === "pendiente_revision_ocr") {
      resumen.pliegos_por_revisar += 1
    }
    if (item.estado_pliego_clave === "cerrado") {
      resumen.pliegos_cerrados += 1
    } else {
      resumen.pliegos_activos += 1
    }
    if (item.texto_revision_final) {
      resumen.pliegos_con_revision_final += 1
    }

    const current = porEstadoMap.get(item.estado_pliego_clave)
    if (current) {
      current.total += 1
    } else {
      porEstadoMap.set(item.estado_pliego_clave, {
        clave: item.estado_pliego_clave,
        nombre: item.estado_pliego_nombre,
        total: 1,
      })
    }
  }

  const recentSorted = [...items].sort((left, right) => {
    return (
      new Date(right.fecha_registro).getTime() -
      new Date(left.fecha_registro).getTime()
    )
  })

  const porRevisar = recentSorted
    .filter((item) => item.estado_pliego_clave === "pendiente_revision_ocr")
    .slice(0, 5)

  const sinRevisionFinal = recentSorted
    .filter((item) => !item.texto_revision_final && item.estado_pliego_clave !== "cerrado")
    .slice(0, 5)

  const porEstado = [...porEstadoMap.values()].sort((left, right) => {
    if (left.total === right.total) {
      return left.nombre.localeCompare(right.nombre)
    }
    return right.total - left.total
  })

  return {
    resumen,
    por_estado: porEstado,
    recientes: recentSorted.slice(0, 6),
    alertas: {
      por_revisar: porRevisar,
      sin_revision_final: sinRevisionFinal,
    },
  }
}
