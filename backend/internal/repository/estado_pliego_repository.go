package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type EstadoPliegoRepository struct {
	pool *pgxpool.Pool
}

func NewEstadoPliegoRepository(pool *pgxpool.Pool) *EstadoPliegoRepository {
	return &EstadoPliegoRepository{pool: pool}
}

func (r *EstadoPliegoRepository) ListActivos(ctx context.Context) ([]domain.EstadoPliego, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			color_hex,
			orden,
			activo,
			created_at,
			updated_at
		FROM estados_pliego
		WHERE activo = TRUE
		ORDER BY orden ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar estados de pliego activos: %w", err)
	}
	defer rows.Close()

	items := make([]domain.EstadoPliego, 0)
	for rows.Next() {
		var item domain.EstadoPliego
		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.ColorHex,
			&item.Orden,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan estado de pliego: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar estados de pliego: %w", err)
	}

	return items, nil
}
