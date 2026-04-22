package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TipoEvidenciaRepository struct {
	pool *pgxpool.Pool
}

func NewTipoEvidenciaRepository(pool *pgxpool.Pool) *TipoEvidenciaRepository {
	return &TipoEvidenciaRepository{pool: pool}
}

func (r *TipoEvidenciaRepository) ListActivos(ctx context.Context) ([]domain.TipoEvidencia, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			activo,
			created_at,
			updated_at
		FROM tipos_evidencia
		WHERE activo = TRUE
		ORDER BY nombre ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar tipos de evidencia activos: %w", err)
	}
	defer rows.Close()

	items := make([]domain.TipoEvidencia, 0)
	for rows.Next() {
		var item domain.TipoEvidencia
		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan tipo de evidencia: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar tipos de evidencia: %w", err)
	}

	return items, nil
}
