package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrPuntoSeguimientoNotFound = errors.New("seguimiento de punto no encontrado")

type PuntoSeguimientoRepository struct {
	pool *pgxpool.Pool
}

func NewPuntoSeguimientoRepository(pool *pgxpool.Pool) *PuntoSeguimientoRepository {
	return &PuntoSeguimientoRepository{pool: pool}
}

func (r *PuntoSeguimientoRepository) ListByPuntoIDAndUnidadID(ctx context.Context, puntoID int64, unidadID int64) ([]domain.PuntoSeguimientoWithDetalle, error) {
	const query = `
		SELECT
			ps.id,
			ps.punto_id,
			ps.usuario_id,
			ps.tipo_movimiento,
			ps.comentario,
			ps.estado_anterior_id,
			ps.estado_nuevo_id,
			ps.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			ea.clave AS estado_anterior_clave,
			ea.nombre AS estado_anterior_nombre,
			en.clave AS estado_nuevo_clave,
			en.nombre AS estado_nuevo_nombre
		FROM punto_seguimientos ps
		INNER JOIN pliego_puntos pp ON pp.id = ps.punto_id
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		LEFT JOIN usuarios u ON u.id = ps.usuario_id
		LEFT JOIN estados_punto ea ON ea.id = ps.estado_anterior_id
		LEFT JOIN estados_punto en ON en.id = ps.estado_nuevo_id
		WHERE ps.punto_id = $1
		  AND p.unidad_id = $2
		ORDER BY ps.created_at ASC, ps.id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, puntoID, unidadID)
	if err != nil {
		return nil, fmt.Errorf("listar seguimientos por punto y unidad: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PuntoSeguimientoWithDetalle, 0)
	for rows.Next() {
		var item domain.PuntoSeguimientoWithDetalle
		if err := rows.Scan(
			&item.ID,
			&item.PuntoID,
			&item.UsuarioID,
			&item.TipoMovimiento,
			&item.Comentario,
			&item.EstadoAnteriorID,
			&item.EstadoNuevoID,
			&item.CreatedAt,
			&item.Username,
			&item.NombreUsuario,
			&item.EstadoAnteriorClave,
			&item.EstadoAnteriorNombre,
			&item.EstadoNuevoClave,
			&item.EstadoNuevoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan seguimiento de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar seguimientos de punto: %w", err)
	}

	return items, nil
}

func (r *PuntoSeguimientoRepository) ListByPuntoID(ctx context.Context, puntoID int64) ([]domain.PuntoSeguimientoWithDetalle, error) {
	const query = `
		SELECT
			ps.id,
			ps.punto_id,
			ps.usuario_id,
			ps.tipo_movimiento,
			ps.comentario,
			ps.estado_anterior_id,
			ps.estado_nuevo_id,
			ps.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			ea.clave AS estado_anterior_clave,
			ea.nombre AS estado_anterior_nombre,
			en.clave AS estado_nuevo_clave,
			en.nombre AS estado_nuevo_nombre
		FROM punto_seguimientos ps
		LEFT JOIN usuarios u ON u.id = ps.usuario_id
		LEFT JOIN estados_punto ea ON ea.id = ps.estado_anterior_id
		LEFT JOIN estados_punto en ON en.id = ps.estado_nuevo_id
		WHERE ps.punto_id = $1
		ORDER BY ps.created_at ASC, ps.id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, puntoID)
	if err != nil {
		return nil, fmt.Errorf("listar seguimientos por punto: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PuntoSeguimientoWithDetalle, 0)
	for rows.Next() {
		var item domain.PuntoSeguimientoWithDetalle
		if err := rows.Scan(
			&item.ID,
			&item.PuntoID,
			&item.UsuarioID,
			&item.TipoMovimiento,
			&item.Comentario,
			&item.EstadoAnteriorID,
			&item.EstadoNuevoID,
			&item.CreatedAt,
			&item.Username,
			&item.NombreUsuario,
			&item.EstadoAnteriorClave,
			&item.EstadoAnteriorNombre,
			&item.EstadoNuevoClave,
			&item.EstadoNuevoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan seguimiento global de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar seguimientos globales de punto: %w", err)
	}

	return items, nil
}

func (r *PuntoSeguimientoRepository) CreateComentarioByUnidadID(
	ctx context.Context,
	unidadID int64,
	puntoID int64,
	usuarioID *int64,
	comentario string,
) (*domain.PuntoSeguimientoWithDetalle, error) {
	const query = `
		INSERT INTO punto_seguimientos (
			punto_id,
			usuario_id,
			tipo_movimiento,
			comentario
		)
		SELECT
			pp.id,
			$3,
			'comentario',
			$4
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pp.id = $1
		  AND p.unidad_id = $2
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var seguimientoID int64
	err := r.pool.QueryRow(ctx, query, puntoID, unidadID, usuarioID, comentario).Scan(&seguimientoID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPuntoSeguimientoNotFound
		}
		return nil, fmt.Errorf("crear comentario de seguimiento por unidad: %w", err)
	}

	return r.GetByID(ctx, seguimientoID)
}

func (r *PuntoSeguimientoRepository) GetByID(ctx context.Context, id int64) (*domain.PuntoSeguimientoWithDetalle, error) {
	const query = `
		SELECT
			ps.id,
			ps.punto_id,
			ps.usuario_id,
			ps.tipo_movimiento,
			ps.comentario,
			ps.estado_anterior_id,
			ps.estado_nuevo_id,
			ps.created_at,
			u.username,
			CASE
				WHEN u.id IS NULL THEN NULL
				ELSE TRIM(CONCAT(u.nombre, ' ', COALESCE(u.apellido_paterno, ''), ' ', COALESCE(u.apellido_materno, '')))
			END AS nombre_usuario,
			ea.clave AS estado_anterior_clave,
			ea.nombre AS estado_anterior_nombre,
			en.clave AS estado_nuevo_clave,
			en.nombre AS estado_nuevo_nombre
		FROM punto_seguimientos ps
		LEFT JOIN usuarios u ON u.id = ps.usuario_id
		LEFT JOIN estados_punto ea ON ea.id = ps.estado_anterior_id
		LEFT JOIN estados_punto en ON en.id = ps.estado_nuevo_id
		WHERE ps.id = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PuntoSeguimientoWithDetalle
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.PuntoID,
		&item.UsuarioID,
		&item.TipoMovimiento,
		&item.Comentario,
		&item.EstadoAnteriorID,
		&item.EstadoNuevoID,
		&item.CreatedAt,
		&item.Username,
		&item.NombreUsuario,
		&item.EstadoAnteriorClave,
		&item.EstadoAnteriorNombre,
		&item.EstadoNuevoClave,
		&item.EstadoNuevoNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPuntoSeguimientoNotFound
		}
		return nil, fmt.Errorf("obtener seguimiento por id: %w", err)
	}

	return &item, nil
}
