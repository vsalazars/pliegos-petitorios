\set target_folio 'UPIICSA-001'

BEGIN;

WITH target_pliego AS (
  SELECT id
  FROM pliegos
  WHERE folio = :'target_folio'
),
estado_requiere_info AS (
  SELECT id
  FROM estados_punto
  WHERE clave = 'requiere_informacion'
),
prepared_dates AS (
  SELECT
    numero_punto,
    fecha_registro,
    fecha_validacion_des,
    fecha_envio_validacion,
    fecha_respuesta_unidad
  FROM (
    VALUES
      (1, NOW() - INTERVAL '8 days',   NOW() - INTERVAL '4 days',   NOW() - INTERVAL '6 days',   NULL::timestamptz),
      (2, NOW() - INTERVAL '16 days',  NOW() - INTERVAL '6 days',   NOW() - INTERVAL '8 days',   NULL::timestamptz),
      (3, NOW() - INTERVAL '32 days',  NOW() - INTERVAL '10 days',  NOW() - INTERVAL '12 days',  NULL::timestamptz),
      (4, NOW() - INTERVAL '95 days',  NOW() - INTERVAL '20 days',  NOW() - INTERVAL '22 days',  NULL::timestamptz),
      (5, NOW() - INTERVAL '185 days', NOW() - INTERVAL '40 days',  NOW() - INTERVAL '42 days',  NULL::timestamptz),
      (6, NOW() - INTERVAL '20 days',  NOW() - INTERVAL '8 days',   NOW() - INTERVAL '10 days',  NOW() - INTERVAL '5 days')
  ) AS seeded(
    numero_punto,
    fecha_registro,
    fecha_validacion_des,
    fecha_envio_validacion,
    fecha_respuesta_unidad
  )
)
UPDATE pliego_puntos pp
SET
  estado_punto_id = eri.id,
  requiere_validacion = FALSE,
  fecha_registro = pd.fecha_registro,
  fecha_compromiso = NULL,
  fecha_envio_validacion = pd.fecha_envio_validacion,
  fecha_validacion_des = pd.fecha_validacion_des,
  fecha_respuesta_unidad = pd.fecha_respuesta_unidad,
  updated_at = NOW()
FROM target_pliego tp
CROSS JOIN estado_requiere_info eri
CROSS JOIN prepared_dates pd
WHERE pp.pliego_id = tp.id
  AND pp.numero_punto = pd.numero_punto
  AND pp.numero_punto BETWEEN 1 AND 6;

COMMIT;
