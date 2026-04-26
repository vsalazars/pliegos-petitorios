-- Demo de pliego realista para DES
-- Crea el pliego UPIICSA-003 con 10 puntos mezclando:
-- - puntos sin atencion de la unidad
-- - puntos ya atendidos por la unidad
-- - puntos en proceso, validados y rechazados
--
-- Ejecutar solo en ambiente local o de pruebas.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pliegos
    WHERE folio = 'UPIICSA-003'
  ) THEN
    RAISE EXCEPTION 'El folio UPIICSA-003 ya existe. Eliminalo o cambia el folio antes de ejecutar este script.';
  END IF;
END $$;

WITH unidad_target AS (
  SELECT id
  FROM unidades_academicas
  WHERE clave = 'UPIICSA'
  LIMIT 1
),
estado_pliego_target AS (
  SELECT COALESCE(
    (SELECT id FROM estados_pliego WHERE clave = 'abierto' LIMIT 1),
    (SELECT id FROM estados_pliego WHERE activo = TRUE ORDER BY orden, id LIMIT 1)
  ) AS id
),
nuevo_pliego AS (
  INSERT INTO pliegos (
    unidad_id,
    folio,
    titulo,
    descripcion,
    periodo,
    anio,
    fecha_recepcion,
    fecha_registro,
    estado_pliego_id,
    texto_revision_final,
    ocr_procesado,
    observaciones,
    created_at,
    updated_at
  )
  SELECT
    u.id,
    'UPIICSA-003',
    'Pliego demostrativo para validacion DES',
    'Pliego de prueba con 10 puntos para validar filtros de atencion y no atencion.',
    '2026-1',
    2026,
    DATE '2026-04-10',
    TIMESTAMPTZ '2026-04-10 09:00:00-06',
    ep.id,
    'Texto de revision final cargado para demostracion.',
    TRUE,
    'Dataset local para validar filtros del tablero DES.',
    TIMESTAMPTZ '2026-04-10 09:00:00-06',
    NOW()
  FROM unidad_target u
  CROSS JOIN estado_pliego_target ep
  RETURNING id
),
catalogos AS (
  SELECT
    COALESCE(
      (SELECT id FROM categorias_punto WHERE clave = 'administrativo' AND activo = TRUE LIMIT 1),
      (SELECT id FROM categorias_punto WHERE activo = TRUE ORDER BY id LIMIT 1)
    ) AS categoria_admin_id,
    COALESCE(
      (SELECT id FROM categorias_punto WHERE clave = 'academico' AND activo = TRUE LIMIT 1),
      (SELECT id FROM categorias_punto WHERE activo = TRUE ORDER BY id OFFSET 1 LIMIT 1),
      (SELECT id FROM categorias_punto WHERE activo = TRUE ORDER BY id LIMIT 1)
    ) AS categoria_acad_id,
    COALESCE(
      (SELECT id FROM prioridades WHERE clave = 'urgente' AND activo = TRUE LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id LIMIT 1)
    ) AS prioridad_urgente_id,
    COALESCE(
      (SELECT id FROM prioridades WHERE clave = 'alta' AND activo = TRUE LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id OFFSET 1 LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id LIMIT 1)
    ) AS prioridad_alta_id,
    COALESCE(
      (SELECT id FROM prioridades WHERE clave = 'media' AND activo = TRUE LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id OFFSET 2 LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id LIMIT 1)
    ) AS prioridad_media_id,
    COALESCE(
      (SELECT id FROM prioridades WHERE clave = 'baja' AND activo = TRUE LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id OFFSET 3 LIMIT 1),
      (SELECT id FROM prioridades WHERE activo = TRUE ORDER BY id LIMIT 1)
    ) AS prioridad_baja_id,
    (SELECT id FROM estados_punto WHERE clave = 'detectado' LIMIT 1) AS estado_detectado_id,
    (SELECT id FROM estados_punto WHERE clave = 'en_proceso' LIMIT 1) AS estado_en_proceso_id,
    (SELECT id FROM estados_punto WHERE clave = 'requiere_informacion' LIMIT 1) AS estado_requiere_info_id,
    (SELECT id FROM estados_punto WHERE clave = 'validado' LIMIT 1) AS estado_validado_id,
    (SELECT id FROM estados_punto WHERE clave = 'rechazado' LIMIT 1) AS estado_rechazado_id,
    (SELECT id FROM motivos_rechazo WHERE activo = TRUE ORDER BY id LIMIT 1) AS motivo_rechazo_id
),
puntos_seed AS (
  SELECT *
  FROM (
    VALUES
      (1, 'Garantizar que no exista ningun tipo de represalia academica o administrativa contra participantes del movimiento estudiantil.', 1, 1, 'requiere_informacion', TIMESTAMPTZ '2025-10-15 10:00:00-06', TIMESTAMPTZ '2026-03-01 09:00:00-06', TIMESTAMPTZ '2026-03-03 09:30:00-06', NULL::timestamptz, FALSE, 'Sin atencion de la unidad por mas de seis meses desde el registro.'),
      (2, 'Publicar calendario verificable de mesas de trabajo y minutas de seguimiento con representacion estudiantil.', 2, 2, 'requiere_informacion', TIMESTAMPTZ '2026-01-12 10:00:00-06', TIMESTAMPTZ '2026-03-20 09:00:00-06', TIMESTAMPTZ '2026-03-22 09:30:00-06', NULL::timestamptz, FALSE, 'Punto con observacion DES y sin respuesta de la unidad.'),
      (3, 'Presentar informe de avance sobre mejoras en seguridad, iluminacion y rutas de acceso para estudiantes.', 1, 3, 'requiere_informacion', TIMESTAMPTZ '2026-03-05 11:00:00-06', TIMESTAMPTZ '2026-04-08 08:30:00-06', TIMESTAMPTZ '2026-04-10 12:00:00-06', NULL::timestamptz, FALSE, 'Punto de 1 a 2 meses sin atencion.'),
      (4, 'Remitir evidencia de mantenimiento correctivo en sanitarios, bebederos y aulas de mayor uso.', 2, 2, 'requiere_informacion', TIMESTAMPTZ '2026-04-02 09:00:00-06', TIMESTAMPTZ '2026-04-18 08:00:00-06', TIMESTAMPTZ '2026-04-19 10:00:00-06', NULL::timestamptz, FALSE, 'Punto en rango de 15 a 29 dias.'),
      (5, 'Entregar constancias documentales de atencion a reportes sobre control de acceso y vigilancia.', 1, 1, 'requiere_informacion', TIMESTAMPTZ '2026-04-16 09:30:00-06', TIMESTAMPTZ '2026-04-20 08:00:00-06', TIMESTAMPTZ '2026-04-21 10:00:00-06', NULL::timestamptz, FALSE, 'Punto en rango de 7 a 14 dias.'),
      (6, 'Actualizar directorio de responsables y canal formal para recepcion de incidencias estudiantiles.', 2, 3, 'requiere_informacion', TIMESTAMPTZ '2026-03-28 09:00:00-06', TIMESTAMPTZ '2026-04-11 08:30:00-06', TIMESTAMPTZ '2026-04-12 12:00:00-06', TIMESTAMPTZ '2026-04-22 16:00:00-06', FALSE, 'La unidad ya respondio; no debe caer en filtro sin atencion.'),
      (7, 'Consolidar plan operativo de seguimiento con responsables y fechas compromiso por area.', 1, 2, 'en_proceso', TIMESTAMPTZ '2026-04-14 10:30:00-06', NULL::timestamptz, NULL::timestamptz, NULL::timestamptz, FALSE, 'Punto en proceso interno, aun sin envio a DES.'),
      (8, 'Acreditar entrega de apoyos academicos extraordinarios comprometidos para el semestre en curso.', 2, 1, 'validado', TIMESTAMPTZ '2026-04-01 10:00:00-06', TIMESTAMPTZ '2026-04-06 08:00:00-06', TIMESTAMPTZ '2026-04-08 09:30:00-06', TIMESTAMPTZ '2026-04-15 14:00:00-06', FALSE, 'Punto ya validado por DES.'),
      (9, 'Corregir inconsistencias en actas, oficios y trazabilidad de compromisos previamente reportados.', 1, 4, 'rechazado', TIMESTAMPTZ '2026-03-18 11:00:00-06', TIMESTAMPTZ '2026-03-25 09:00:00-06', TIMESTAMPTZ '2026-03-27 11:00:00-06', TIMESTAMPTZ '2026-04-02 13:30:00-06', FALSE, 'Punto rechazado por DES por evidencia insuficiente.'),
      (10, 'Registrar canal de comunicacion permanente con alumnado para seguimiento semanal de acuerdos.', 2, 4, 'detectado', TIMESTAMPTZ '2026-04-24 09:00:00-06', NULL::timestamptz, NULL::timestamptz, NULL::timestamptz, FALSE, 'Punto recien registrado, sin atencion DES todavia.')
  ) AS seeded(
    numero_punto,
    texto_final,
    categoria_slot,
    prioridad_slot,
    estado_clave,
    fecha_registro,
    fecha_envio_validacion,
    fecha_validacion_des,
    fecha_respuesta_unidad,
    requiere_validacion,
    observaciones
  )
),
inserted_points AS (
  INSERT INTO pliego_puntos (
    pliego_id,
    numero_punto,
    texto_final,
    categoria_id,
    prioridad_id,
    estado_punto_id,
    fecha_registro,
    fecha_envio_validacion,
    fecha_respuesta_unidad,
    fecha_validacion_des,
    origen_captura,
    requiere_validacion,
    observaciones,
    created_at,
    updated_at
  )
  SELECT
    np.id,
    ps.numero_punto,
    ps.texto_final,
    CASE
      WHEN ps.categoria_slot = 1 THEN c.categoria_admin_id
      ELSE c.categoria_acad_id
    END AS categoria_id,
    CASE
      WHEN ps.prioridad_slot = 1 THEN c.prioridad_urgente_id
      WHEN ps.prioridad_slot = 2 THEN c.prioridad_alta_id
      WHEN ps.prioridad_slot = 3 THEN c.prioridad_media_id
      ELSE c.prioridad_baja_id
    END AS prioridad_id,
    CASE ps.estado_clave
      WHEN 'detectado' THEN c.estado_detectado_id
      WHEN 'en_proceso' THEN c.estado_en_proceso_id
      WHEN 'requiere_informacion' THEN c.estado_requiere_info_id
      WHEN 'validado' THEN c.estado_validado_id
      WHEN 'rechazado' THEN c.estado_rechazado_id
    END AS estado_punto_id,
    ps.fecha_registro,
    ps.fecha_envio_validacion,
    ps.fecha_respuesta_unidad,
    ps.fecha_validacion_des,
    'manual',
    ps.requiere_validacion,
    ps.observaciones,
    ps.fecha_registro,
    COALESCE(ps.fecha_respuesta_unidad, ps.fecha_validacion_des, ps.fecha_envio_validacion, ps.fecha_registro)
  FROM nuevo_pliego np
  CROSS JOIN catalogos c
  CROSS JOIN puntos_seed ps
  RETURNING id, numero_punto
),
target_points AS (
  SELECT id, numero_punto
  FROM inserted_points
)
INSERT INTO punto_validaciones (
  punto_id,
  usuario_validador_id,
  resultado,
  motivo_rechazo_id,
  comentario,
  es_vigente,
  created_at
)
SELECT
  tp.id,
  NULL,
  seeded.resultado,
  CASE
    WHEN seeded.resultado = 'rechazado' THEN c.motivo_rechazo_id
    ELSE NULL
  END,
  seeded.comentario,
  TRUE,
  seeded.created_at
FROM target_points tp
CROSS JOIN catalogos c
INNER JOIN (
  VALUES
    (1, 'requiere_informacion', 'DES solicita evidencias documentales adicionales.', TIMESTAMPTZ '2026-03-03 09:30:00-06'),
    (2, 'requiere_informacion', 'DES requiere mayor detalle sobre responsables y fechas de cumplimiento.', TIMESTAMPTZ '2026-03-22 09:30:00-06'),
    (3, 'requiere_informacion', 'DES solicita anexar evidencia fotografica y oficios de atencion.', TIMESTAMPTZ '2026-04-10 12:00:00-06'),
    (4, 'requiere_informacion', 'DES requiere complemento de evidencia operativa.', TIMESTAMPTZ '2026-04-19 10:00:00-06'),
    (5, 'requiere_informacion', 'DES solicita comprobacion puntual de las acciones reportadas.', TIMESTAMPTZ '2026-04-21 10:00:00-06'),
    (6, 'requiere_informacion', 'DES pidio informacion adicional; la unidad ya respondio y espera revision.', TIMESTAMPTZ '2026-04-12 12:00:00-06'),
    (8, 'aprobado', 'DES valida como suficiente la evidencia presentada.', TIMESTAMPTZ '2026-04-15 14:00:00-06'),
    (9, 'rechazado', 'DES rechaza por inconsistencia entre evidencia y compromiso reportado.', TIMESTAMPTZ '2026-04-02 13:30:00-06')
) AS seeded(numero_punto, resultado, comentario, created_at)
  ON seeded.numero_punto = tp.numero_punto;

COMMIT;

-- Verificacion sugerida:
-- SELECT numero_punto, estado_punto_clave, fecha_registro, fecha_validacion_des, fecha_respuesta_unidad
-- FROM (
--   SELECT
--     pp.numero_punto,
--     ep.clave AS estado_punto_clave,
--     pp.fecha_registro,
--     pp.fecha_validacion_des,
--     pp.fecha_respuesta_unidad
--   FROM pliego_puntos pp
--   JOIN pliegos p ON p.id = pp.pliego_id
--   JOIN estados_punto ep ON ep.id = pp.estado_punto_id
--   WHERE p.folio = 'UPIICSA-003'
-- ) t
-- ORDER BY numero_punto;
