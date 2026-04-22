package repository

import (
	"context"
	"errors"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUnidadClaveDuplicada = errors.New("la clave de la unidad ya existe")
var ErrUnidadNoEncontrada = errors.New("la unidad académica no existe")

type UnidadRepository struct {
	pool *pgxpool.Pool
}

func NewUnidadRepository(pool *pgxpool.Pool) *UnidadRepository {
	return &UnidadRepository{
		pool: pool,
	}
}

func (r *UnidadRepository) List(ctx context.Context) ([]domain.UnidadAcademica, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			correo_oficial,
			telefono,
			titular_nombre,
			activo,
			created_at,
			updated_at
		FROM unidades_academicas
		ORDER BY nombre ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar unidades académicas: %w", err)
	}
	defer rows.Close()

	unidades := make([]domain.UnidadAcademica, 0)

	for rows.Next() {
		var item domain.UnidadAcademica

		if err := rows.Scan(
			&item.ID,
			&item.Clave,
			&item.Nombre,
			&item.CorreoOficial,
			&item.Telefono,
			&item.TitularNombre,
			&item.Activo,
			&item.CreatedAt,
			&item.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan unidad académica: %w", err)
		}

		unidades = append(unidades, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar unidades académicas: %w", err)
	}

	return unidades, nil
}

func (r *UnidadRepository) GetByID(ctx context.Context, id int64) (*domain.UnidadAcademica, error) {
	const query = `
		SELECT
			id,
			clave,
			nombre,
			correo_oficial,
			telefono,
			titular_nombre,
			activo,
			created_at,
			updated_at
		FROM unidades_academicas
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.UnidadAcademica

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.Clave,
		&item.Nombre,
		&item.CorreoOficial,
		&item.Telefono,
		&item.TitularNombre,
		&item.Activo,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnidadNoEncontrada
		}
		return nil, fmt.Errorf("obtener unidad académica por id: %w", err)
	}

	return &item, nil
}

func (r *UnidadRepository) Create(
	ctx context.Context,
	clave string,
	nombre string,
	correoOficial *string,
	telefono *string,
	titularNombre *string,
) (*domain.UnidadAcademica, error) {
	const query = `
		INSERT INTO unidades_academicas (
			clave,
			nombre,
			correo_oficial,
			telefono,
			titular_nombre,
			activo
		)
		VALUES ($1, $2, $3, $4, $5, TRUE)
		RETURNING
			id,
			clave,
			nombre,
			correo_oficial,
			telefono,
			titular_nombre,
			activo,
			created_at,
			updated_at;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.UnidadAcademica

	err := r.pool.QueryRow(
		ctx,
		query,
		clave,
		nombre,
		correoOficial,
		telefono,
		titularNombre,
	).Scan(
		&item.ID,
		&item.Clave,
		&item.Nombre,
		&item.CorreoOficial,
		&item.Telefono,
		&item.TitularNombre,
		&item.Activo,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUnidadClaveDuplicada
		}
		return nil, fmt.Errorf("crear unidad académica: %w", err)
	}

	return &item, nil
}

func (r *UnidadRepository) Update(
	ctx context.Context,
	id int64,
	clave string,
	nombre string,
	correoOficial *string,
	telefono *string,
	titularNombre *string,
) (*domain.UnidadAcademica, error) {
	const query = `
		UPDATE unidades_academicas
		SET
			clave = $2,
			nombre = $3,
			correo_oficial = $4,
			telefono = $5,
			titular_nombre = $6
		WHERE id = $1
		RETURNING
			id,
			clave,
			nombre,
			correo_oficial,
			telefono,
			titular_nombre,
			activo,
			created_at,
			updated_at;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.UnidadAcademica

	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		clave,
		nombre,
		correoOficial,
		telefono,
		titularNombre,
	).Scan(
		&item.ID,
		&item.Clave,
		&item.Nombre,
		&item.CorreoOficial,
		&item.Telefono,
		&item.TitularNombre,
		&item.Activo,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnidadNoEncontrada
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, ErrUnidadClaveDuplicada
		}

		return nil, fmt.Errorf("actualizar unidad académica: %w", err)
	}

	return &item, nil
}

func (r *UnidadRepository) SetActivo(
	ctx context.Context,
	id int64,
	activo bool,
) (*domain.UnidadAcademica, error) {
	const query = `
		UPDATE unidades_academicas
		SET
			activo = $2
		WHERE id = $1
		RETURNING
			id,
			clave,
			nombre,
			correo_oficial,
			telefono,
			titular_nombre,
			activo,
			created_at,
			updated_at;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.UnidadAcademica

	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		activo,
	).Scan(
		&item.ID,
		&item.Clave,
		&item.Nombre,
		&item.CorreoOficial,
		&item.Telefono,
		&item.TitularNombre,
		&item.Activo,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUnidadNoEncontrada
		}
		return nil, fmt.Errorf("cambiar estatus de unidad académica: %w", err)
	}

	return &item, nil
}