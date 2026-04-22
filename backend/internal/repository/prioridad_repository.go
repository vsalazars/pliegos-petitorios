package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type PrioridadRepository struct {
	pool *pgxpool.Pool
}

func NewPrioridadRepository(pool *pgxpool.Pool) *PrioridadRepository {
	return &PrioridadRepository{pool: pool}
}

func (r *PrioridadRepository) ListActivas(ctx context.Context) ([]domain.Prioridad, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			nivel_orden,
			dias_sla,
			activo,
			created_at,
			updated_at
		FROM prioridades
		WHERE activo = TRUE
		ORDER BY nivel_orden ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar prioridades activas: %w", err)
	}
	defer rows.Close()

	items := make([]domain.Prioridad, 0)
	for rows.Next() {
		var item domain.Prioridad
		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.NivelOrden,
			&item.DiasSLA,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan prioridad: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar prioridades: %w", err)
	}

	return items, nil
}
