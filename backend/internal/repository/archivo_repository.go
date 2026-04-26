package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ArchivoRepository struct {
	pool *pgxpool.Pool
}

func NewArchivoRepository(pool *pgxpool.Pool) *ArchivoRepository {
	return &ArchivoRepository{pool: pool}
}

func (r *ArchivoRepository) Create(
	ctx context.Context,
	nombreOriginal string,
	nombreStorage string,
	rutaStorage string,
	mimeType string,
	extension *string,
	tamanoBytes int64,
	hashSHA256 *string,
	subidoPorUsuarioID *int64,
) (*domain.Archivo, bool, error) {
	const query = `
		INSERT INTO archivos (
			nombre_original,
			nombre_storage,
			ruta_storage,
			mime_type,
			extension,
			tamano_bytes,
			hash_sha256,
			subido_por_usuario_id
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING
			id,
			nombre_original,
			nombre_storage,
			ruta_storage,
			mime_type,
			extension,
			tamano_bytes,
			hash_sha256,
			subido_por_usuario_id,
			created_at;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.Archivo
	err := r.pool.QueryRow(
		ctx,
		query,
		nombreOriginal,
		nombreStorage,
		rutaStorage,
		mimeType,
		extension,
		tamanoBytes,
		hashSHA256,
		subidoPorUsuarioID,
	).Scan(
		&item.ID,
		&item.NombreOriginal,
		&item.NombreStorage,
		&item.RutaStorage,
		&item.MimeType,
		&item.Extension,
		&item.TamanoBytes,
		&item.HashSHA256,
		&item.SubidoPorUsuarioID,
		&item.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" && pgErr.ConstraintName == "uq_archivos_hash_sha256" && hashSHA256 != nil {
			item, fetchErr := r.GetByHashSHA256(ctx, *hashSHA256)
			if fetchErr != nil {
				return nil, false, fmt.Errorf("reutilizar archivo existente por hash: %w", fetchErr)
			}
			return item, true, nil
		}
		return nil, false, fmt.Errorf("crear archivo: %w", err)
	}

	return &item, false, nil
}

func (r *ArchivoRepository) GetByHashSHA256(ctx context.Context, hashSHA256 string) (*domain.Archivo, error) {
	const query = `
		SELECT
			id,
			nombre_original,
			nombre_storage,
			ruta_storage,
			mime_type,
			extension,
			tamano_bytes,
			hash_sha256,
			subido_por_usuario_id,
			created_at
		FROM archivos
		WHERE hash_sha256 = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.Archivo
	err := r.pool.QueryRow(ctx, query, hashSHA256).Scan(
		&item.ID,
		&item.NombreOriginal,
		&item.NombreStorage,
		&item.RutaStorage,
		&item.MimeType,
		&item.Extension,
		&item.TamanoBytes,
		&item.HashSHA256,
		&item.SubidoPorUsuarioID,
		&item.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("obtener archivo por hash: %w", err)
	}

	return &item, nil
}
