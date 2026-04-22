package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type EstadoPuntoRepository struct {
	pool *pgxpool.Pool
}

func NewEstadoPuntoRepository(pool *pgxpool.Pool) *EstadoPuntoRepository {
	return &EstadoPuntoRepository{pool: pool}
}

func (r *EstadoPuntoRepository) ListActivos(ctx context.Context) ([]domain.EstadoPunto, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			color_hex,
			orden,
			es_terminal,
			activo,
			created_at,
			updated_at
		FROM estados_punto
		WHERE activo = TRUE
		ORDER BY orden ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar estados de punto activos: %w", err)
	}
	defer rows.Close()

	items := make([]domain.EstadoPunto, 0)
	for rows.Next() {
		var item domain.EstadoPunto
		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.ColorHex,
			&item.Orden,
			&item.EsTerminal,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan estado de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar estados de punto: %w", err)
	}

	return items, nil
}
