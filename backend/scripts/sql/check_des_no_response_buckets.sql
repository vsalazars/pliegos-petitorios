\set target_folio 'UPIICSA-001'

WITH target_points AS (
  SELECT
    p.folio,
    pp.id,
    pp.numero_punto,
    ep.clave AS estado_punto_clave,
    pp.requiere_validacion,
    pp.fecha_registro,
    pp.fecha_envio_validacion,
    pp.fecha_validacion_des,
    pp.fecha_respuesta_unidad,
    CASE
      WHEN ep.clave <> 'requiere_informacion' THEN NULL
      WHEN pp.fecha_registro IS NULL THEN NULL
      WHEN pp.fecha_respuesta_unidad IS NULL THEN FLOOR(EXTRACT(EPOCH FROM (NOW() - pp.fecha_registro)) / 86400)
      WHEN pp.fecha_validacion_des IS NOT NULL AND pp.fecha_respuesta_unidad < pp.fecha_validacion_des THEN FLOOR(EXTRACT(EPOCH FROM (NOW() - pp.fecha_registro)) / 86400)
      ELSE NULL
    END AS dias_sin_respuesta
  FROM pliego_puntos pp
  INNER JOIN pliegos p
    ON p.id = pp.pliego_id
  INNER JOIN estados_punto ep
    ON ep.id = pp.estado_punto_id
  WHERE p.folio = :'target_folio'
)
SELECT
  folio,
  numero_punto,
  estado_punto_clave,
  requiere_validacion,
  fecha_registro,
  fecha_envio_validacion,
  fecha_validacion_des,
  fecha_respuesta_unidad,
  dias_sin_respuesta,
  CASE
    WHEN dias_sin_respuesta IS NULL THEN 'no_aplica'
    WHEN dias_sin_respuesta >= 180 THEN '6_meses'
    WHEN dias_sin_respuesta >= 90 THEN '3_meses'
    WHEN dias_sin_respuesta >= 30 THEN '1_mes'
    WHEN dias_sin_respuesta >= 15 THEN '15_dias'
    WHEN dias_sin_respuesta >= 7 THEN '7_dias'
    ELSE 'sin_bucket'
  END AS bucket_esperado
FROM target_points
ORDER BY numero_punto;
