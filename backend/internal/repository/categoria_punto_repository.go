package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CategoriaPuntoRepository struct {
	pool *pgxpool.Pool
}

func NewCategoriaPuntoRepository(pool *pgxpool.Pool) *CategoriaPuntoRepository {
	return &CategoriaPuntoRepository{pool: pool}
}

func (r *CategoriaPuntoRepository) ListActivas(ctx context.Context) ([]domain.CategoriaPunto, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			descripcion,
			activo,
			created_at,
			updated_at
		FROM categorias_punto
		WHERE activo = TRUE
		ORDER BY nombre ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar categorías de punto activas: %w", err)
	}
	defer rows.Close()

	items := make([]domain.CategoriaPunto, 0)
	for rows.Next() {
		var item domain.CategoriaPunto
		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.Descripcion,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan categoría de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar categorías de punto: %w", err)
	}

	return items, nil
}
