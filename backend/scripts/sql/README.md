# Validacion de Filtros "Sin Respuesta"

Estos scripts sirven para probar localmente los filtros de antiguedad en el modulo DES.

Tomando como referencia la fecha actual de la base de datos (`CURRENT_DATE`), el script de seed deja:

- Punto 1: `7 dias`
- Punto 2: `15 dias`
- Punto 3: `1 mes`
- Punto 4: `3 meses`
- Punto 5: `6 meses`
- Punto 6: respondido por la unidad, no debe aparecer

Todos los casos se preparan en estado `requiere_informacion`, que es la condicion correcta para el filtro de "sin respuesta".
El bucket se calcula desde `fecha_registro` del punto.

## Uso

1. Elige un folio que ya tenga al menos 6 puntos.
2. Edita la variable `target_folio` en ambos scripts.
3. Ejecuta el seed:

```bash
psql "postgres://postgres:@127.0.0.1:5432/pliegos_des?sslmode=disable" \
  -f backend/scripts/sql/seed_des_no_response_buckets.sql
```

4. Verifica el resultado:

```bash
psql "postgres://postgres:@127.0.0.1:5432/pliegos_des?sslmode=disable" \
  -f backend/scripts/sql/check_des_no_response_buckets.sql
```

## Notas

- Ejecuta esto solo en ambiente local o de pruebas.
- El script actualiza los puntos `1` a `6` del folio elegido.
- Si quieres revertir, primero respalda esas filas antes de correr el seed.
