package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgxpool"
)

type MotivoRechazoRepository struct {
	pool *pgxpool.Pool
}

func NewMotivoRechazoRepository(pool *pgxpool.Pool) *MotivoRechazoRepository {
	return &MotivoRechazoRepository{pool: pool}
}

func (r *MotivoRechazoRepository) ListActivos(ctx context.Context) ([]domain.MotivoRechazo, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			descripcion,
			activo,
			created_at,
			updated_at
		FROM motivos_rechazo
		WHERE activo = TRUE
		ORDER BY nombre ASC, id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar motivos de rechazo activos: %w", err)
	}
	defer rows.Close()

	items := make([]domain.MotivoRechazo, 0)
	for rows.Next() {
		var item domain.MotivoRechazo
		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.Descripcion,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan motivo de rechazo: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar motivos de rechazo: %w", err)
	}

	return items, nil
}
