package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type RolRepository struct {
	pool *pgxpool.Pool
}

func NewRolRepository(pool *pgxpool.Pool) *RolRepository {
	return &RolRepository{
		pool: pool,
	}
}

func (r *RolRepository) List(ctx context.Context) ([]domain.Rol, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			ambito,
			activo,
			created_at,
			updated_at
		FROM roles
		ORDER BY nombre ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar roles: %w", err)
	}
	defer rows.Close()

	items := make([]domain.Rol, 0)

	for rows.Next() {
		var item domain.Rol

		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.Ambito,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan rol: %w", err)
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar roles: %w", err)
	}

	return items, nil
}