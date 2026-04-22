package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrPuntoValidacionNotFound = errors.New("validación de punto no encontrada")

type PuntoValidacionRepository struct {
	pool *pgxpool.Pool
}

func NewPuntoValidacionRepository(pool *pgxpool.Pool) *PuntoValidacionRepository {
	return &PuntoValidacionRepository{pool: pool}
}

func (r *PuntoValidacionRepository) ListByPuntoIDAndUnidadID(ctx context.Context, puntoID int64, unidadID int64) ([]domain.PuntoValidacionWithDetalle, error) {
	const query = `
		SELECT
			pv.id,
			pv.punto_id,
			pv.usuario_validador_id,
			pv.resultado,
			pv.motivo_rechazo_id,
			pv.comentario,
			pv.es_vigente,
			pv.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			mr.clave AS motivo_rechazo_clave,
			mr.nombre AS motivo_rechazo_nombre
		FROM punto_validaciones pv
		INNER JOIN pliego_puntos pp ON pp.id = pv.punto_id
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		LEFT JOIN usuarios u ON u.id = pv.usuario_validador_id
		LEFT JOIN motivos_rechazo mr ON mr.id = pv.motivo_rechazo_id
		WHERE pv.punto_id = $1
		  AND p.unidad_id = $2
		ORDER BY pv.created_at DESC, pv.id DESC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, puntoID, unidadID)
	if err != nil {
		return nil, fmt.Errorf("listar validaciones por punto y unidad: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PuntoValidacionWithDetalle, 0)
	for rows.Next() {
		var item domain.PuntoValidacionWithDetalle
		if err := rows.Scan(
			&item.ID,
			&item.PuntoID,
			&item.UsuarioValidadorID,
			&item.Resultado,
			&item.MotivoRechazoID,
			&item.Comentario,
			&item.EsVigente,
			&item.CreatedAt,
			&item.Username,
			&item.NombreUsuario,
			&item.MotivoRechazoClave,
			&item.MotivoRechazoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan validación de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar validaciones de punto: %w", err)
	}

	return items, nil
}

func (r *PuntoValidacionRepository) ListByPuntoID(ctx context.Context, puntoID int64) ([]domain.PuntoValidacionWithDetalle, error) {
	const query = `
		SELECT
			pv.id,
			pv.punto_id,
			pv.usuario_validador_id,
			pv.resultado,
			pv.motivo_rechazo_id,
			pv.comentario,
			pv.es_vigente,
			pv.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			mr.clave AS motivo_rechazo_clave,
			mr.nombre AS motivo_rechazo_nombre
		FROM punto_validaciones pv
		LEFT JOIN usuarios u ON u.id = pv.usuario_validador_id
		LEFT JOIN motivos_rechazo mr ON mr.id = pv.motivo_rechazo_id
		WHERE pv.punto_id = $1
		ORDER BY pv.created_at DESC, pv.id DESC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, puntoID)
	if err != nil {
		return nil, fmt.Errorf("listar validaciones por punto: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PuntoValidacionWithDetalle, 0)
	for rows.Next() {
		var item domain.PuntoValidacionWithDetalle
		if err := rows.Scan(
			&item.ID,
			&item.PuntoID,
			&item.UsuarioValidadorID,
			&item.Resultado,
			&item.MotivoRechazoID,
			&item.Comentario,
			&item.EsVigente,
			&item.CreatedAt,
			&item.Username,
			&item.NombreUsuario,
			&item.MotivoRechazoClave,
			&item.MotivoRechazoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan validación global de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar validaciones globales de punto: %w", err)
	}

	return items, nil
}

func (r *PuntoValidacionRepository) GetVigenteByPuntoIDAndUnidadID(ctx context.Context, puntoID int64, unidadID int64) (*domain.PuntoValidacionWithDetalle, error) {
	const query = `
		SELECT
			pv.id,
			pv.punto_id,
			pv.usuario_validador_id,
			pv.resultado,
			pv.motivo_rechazo_id,
			pv.comentario,
			pv.es_vigente,
			pv.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			mr.clave AS motivo_rechazo_clave,
			mr.nombre AS motivo_rechazo_nombre
		FROM punto_validaciones pv
		INNER JOIN pliego_puntos pp ON pp.id = pv.punto_id
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		LEFT JOIN usuarios u ON u.id = pv.usuario_validador_id
		LEFT JOIN motivos_rechazo mr ON mr.id = pv.motivo_rechazo_id
		WHERE pv.punto_id = $1
		  AND p.unidad_id = $2
		  AND pv.es_vigente = TRUE
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PuntoValidacionWithDetalle
	err := r.pool.QueryRow(ctx, query, puntoID, unidadID).Scan(
		&item.ID,
		&item.PuntoID,
		&item.UsuarioValidadorID,
		&item.Resultado,
		&item.MotivoRechazoID,
		&item.Comentario,
		&item.EsVigente,
		&item.CreatedAt,
		&item.Username,
		&item.NombreUsuario,
		&item.MotivoRechazoClave,
		&item.MotivoRechazoNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPuntoValidacionNotFound
		}
		return nil, fmt.Errorf("obtener validación vigente por punto y unidad: %w", err)
	}

	return &item, nil
}

func (r *PuntoValidacionRepository) Create(
	ctx context.Context,
	puntoID int64,
	usuarioValidadorID *int64,
	resultado string,
	motivoRechazoID *int64,
	comentario *string,
	esVigente bool,
) (*domain.PuntoValidacionWithDetalle, error) {
	const query = `
		INSERT INTO punto_validaciones (
			punto_id,
			usuario_validador_id,
			resultado,
			motivo_rechazo_id,
			comentario,
			es_vigente
		)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	resultado = strings.TrimSpace(strings.ToLower(resultado))

	if esVigente {
		if err := r.CloseVigentesByPuntoID(ctx, puntoID); err != nil {
			return nil, err
		}
	}

	var validationID int64
	err := r.pool.QueryRow(
		ctx,
		query,
		puntoID,
		usuarioValidadorID,
		resultado,
		motivoRechazoID,
		comentario,
		esVigente,
	).Scan(&validationID)
	if err != nil {
		return nil, fmt.Errorf("crear validación de punto: %w", err)
	}

	item, err := r.GetByID(ctx, validationID)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (r *PuntoValidacionRepository) CloseVigentesByPuntoID(ctx context.Context, puntoID int64) error {
	const query = `
		UPDATE punto_validaciones
		SET es_vigente = FALSE
		WHERE punto_id = $1
		  AND es_vigente = TRUE;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	if _, err := r.pool.Exec(ctx, query, puntoID); err != nil {
		return fmt.Errorf("cerrar validaciones vigentes del punto: %w", err)
	}

	return nil
}

func (r *PuntoValidacionRepository) GetByID(ctx context.Context, id int64) (*domain.PuntoValidacionWithDetalle, error) {
	const query = `
		SELECT
			pv.id,
			pv.punto_id,
			pv.usuario_validador_id,
			pv.resultado,
			pv.motivo_rechazo_id,
			pv.comentario,
			pv.es_vigente,
			pv.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			mr.clave AS motivo_rechazo_clave,
			mr.nombre AS motivo_rechazo_nombre
		FROM punto_validaciones pv
		LEFT JOIN usuarios u ON u.id = pv.usuario_validador_id
		LEFT JOIN motivos_rechazo mr ON mr.id = pv.motivo_rechazo_id
		WHERE pv.id = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PuntoValidacionWithDetalle
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.PuntoID,
		&item.UsuarioValidadorID,
		&item.Resultado,
		&item.MotivoRechazoID,
		&item.Comentario,
		&item.EsVigente,
		&item.CreatedAt,
		&item.Username,
		&item.NombreUsuario,
		&item.MotivoRechazoClave,
		&item.MotivoRechazoNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPuntoValidacionNotFound
		}
		return nil, fmt.Errorf("obtener validación por id: %w", err)
	}

	return &item, nil
}
