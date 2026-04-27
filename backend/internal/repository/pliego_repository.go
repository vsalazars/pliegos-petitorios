package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrPliegoNotFound = errors.New("pliego no encontrado")
var ErrPliegoFolioDuplicado = errors.New("el folio del pliego ya existe")

type PliegoRepository struct {
	pool *pgxpool.Pool
}

func NewPliegoRepository(pool *pgxpool.Pool) *PliegoRepository {
	return &PliegoRepository{
		pool: pool,
	}
}

func (r *PliegoRepository) List(ctx context.Context) ([]domain.PliegoWithEstado, error) {
	const query = `
		SELECT
			p.id,
			p.unidad_id,
			p.folio,
			p.titulo,
			p.descripcion,
			p.periodo,
			p.anio,
			p.fecha_recepcion,
			p.fecha_registro,
			p.estado_pliego_id,
			p.archivo_original_id,
			p.texto_ocr_bruto,
			p.texto_revision_final,
			p.ocr_procesado,
			p.ocr_fecha_procesado,
			p.registrado_por_usuario_id,
			p.observaciones,
			p.created_at,
			p.updated_at,
			ep.clave AS estado_pliego_clave,
			ep.nombre AS estado_pliego_nombre
		FROM pliegos p
		INNER JOIN estados_pliego ep ON ep.id = p.estado_pliego_id
		ORDER BY p.created_at DESC, p.id DESC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar pliegos: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PliegoWithEstado, 0)

	for rows.Next() {
		var item domain.PliegoWithEstado

		if err := rows.Scan(
			&item.ID,
			&item.UnidadID,
			&item.Folio,
			&item.Titulo,
			&item.Descripcion,
			&item.Periodo,
			&item.Anio,
			&item.FechaRecepcion,
			&item.FechaRegistro,
			&item.EstadoPliegoID,
			&item.ArchivoOriginalID,
			&item.TextoOCRBruto,
			&item.TextoRevisionFinal,
			&item.OCRProcesado,
			&item.OCRFechaProcesado,
			&item.RegistradoPorUsuarioID,
			&item.Observaciones,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.EstadoPliegoClave,
			&item.EstadoPliegoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan pliego: %w", err)
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar pliegos: %w", err)
	}

	return items, nil
}

func (r *PliegoRepository) ListByUnidadID(ctx context.Context, unidadID int64) ([]domain.PliegoWithEstado, error) {
	const query = `
		SELECT
			p.id,
			p.unidad_id,
			p.folio,
			p.titulo,
			p.descripcion,
			p.periodo,
			p.anio,
			p.fecha_recepcion,
			p.fecha_registro,
			p.estado_pliego_id,
			p.archivo_original_id,
			p.texto_ocr_bruto,
			p.texto_revision_final,
			p.ocr_procesado,
			p.ocr_fecha_procesado,
			p.registrado_por_usuario_id,
			p.observaciones,
			p.created_at,
			p.updated_at,
			ep.clave AS estado_pliego_clave,
			ep.nombre AS estado_pliego_nombre
		FROM pliegos p
		INNER JOIN estados_pliego ep ON ep.id = p.estado_pliego_id
		WHERE p.unidad_id = $1
		ORDER BY p.created_at DESC, p.id DESC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, unidadID)
	if err != nil {
		return nil, fmt.Errorf("listar pliegos por unidad: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PliegoWithEstado, 0)

	for rows.Next() {
		var item domain.PliegoWithEstado

		if err := rows.Scan(
			&item.ID,
			&item.UnidadID,
			&item.Folio,
			&item.Titulo,
			&item.Descripcion,
			&item.Periodo,
			&item.Anio,
			&item.FechaRecepcion,
			&item.FechaRegistro,
			&item.EstadoPliegoID,
			&item.ArchivoOriginalID,
			&item.TextoOCRBruto,
			&item.TextoRevisionFinal,
			&item.OCRProcesado,
			&item.OCRFechaProcesado,
			&item.RegistradoPorUsuarioID,
			&item.Observaciones,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.EstadoPliegoClave,
			&item.EstadoPliegoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan pliego por unidad: %w", err)
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar pliegos por unidad: %w", err)
	}

	return items, nil
}

func (r *PliegoRepository) GetByID(ctx context.Context, id int64) (*domain.PliegoWithEstado, error) {
	const query = `
		SELECT
			p.id,
			p.unidad_id,
			p.folio,
			p.titulo,
			p.descripcion,
			p.periodo,
			p.anio,
			p.fecha_recepcion,
			p.fecha_registro,
			p.estado_pliego_id,
			p.archivo_original_id,
			p.texto_ocr_bruto,
			p.texto_revision_final,
			p.ocr_procesado,
			p.ocr_fecha_procesado,
			p.registrado_por_usuario_id,
			p.observaciones,
			p.created_at,
			p.updated_at,
			ep.clave AS estado_pliego_clave,
			ep.nombre AS estado_pliego_nombre
		FROM pliegos p
		INNER JOIN estados_pliego ep ON ep.id = p.estado_pliego_id
		WHERE p.id = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PliegoWithEstado

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.UnidadID,
		&item.Folio,
		&item.Titulo,
		&item.Descripcion,
		&item.Periodo,
		&item.Anio,
		&item.FechaRecepcion,
		&item.FechaRegistro,
		&item.EstadoPliegoID,
		&item.ArchivoOriginalID,
		&item.TextoOCRBruto,
		&item.TextoRevisionFinal,
		&item.OCRProcesado,
		&item.OCRFechaProcesado,
		&item.RegistradoPorUsuarioID,
		&item.Observaciones,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.EstadoPliegoClave,
		&item.EstadoPliegoNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoNotFound
		}
		return nil, fmt.Errorf("obtener pliego por id: %w", err)
	}

	return &item, nil
}

func (r *PliegoRepository) GetByIDAndUnidadID(ctx context.Context, id int64, unidadID int64) (*domain.PliegoWithEstado, error) {
	const query = `
		SELECT
			p.id,
			p.unidad_id,
			p.folio,
			p.titulo,
			p.descripcion,
			p.periodo,
			p.anio,
			p.fecha_recepcion,
			p.fecha_registro,
			p.estado_pliego_id,
			p.archivo_original_id,
			p.texto_ocr_bruto,
			p.texto_revision_final,
			p.ocr_procesado,
			p.ocr_fecha_procesado,
			p.registrado_por_usuario_id,
			p.observaciones,
			p.created_at,
			p.updated_at,
			ep.clave AS estado_pliego_clave,
			ep.nombre AS estado_pliego_nombre
		FROM pliegos p
		INNER JOIN estados_pliego ep ON ep.id = p.estado_pliego_id
		WHERE p.id = $1 AND p.unidad_id = $2
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PliegoWithEstado

	err := r.pool.QueryRow(ctx, query, id, unidadID).Scan(
		&item.ID,
		&item.UnidadID,
		&item.Folio,
		&item.Titulo,
		&item.Descripcion,
		&item.Periodo,
		&item.Anio,
		&item.FechaRecepcion,
		&item.FechaRegistro,
		&item.EstadoPliegoID,
		&item.ArchivoOriginalID,
		&item.TextoOCRBruto,
		&item.TextoRevisionFinal,
		&item.OCRProcesado,
		&item.OCRFechaProcesado,
		&item.RegistradoPorUsuarioID,
		&item.Observaciones,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.EstadoPliegoClave,
		&item.EstadoPliegoNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoNotFound
		}
		return nil, fmt.Errorf("obtener pliego por id y unidad: %w", err)
	}

	return &item, nil
}

func (r *PliegoRepository) Create(
	ctx context.Context,
	unidadID int64,
	folio string,
	titulo string,
	descripcion *string,
	periodo *string,
	anio *int,
	fechaRecepcion time.Time,
	estadoPliegoID int64,
	archivoOriginalID *int64,
	textoOCRBruto *string,
	textoRevisionFinal *string,
	ocrProcesado bool,
	ocrFechaProcesado *time.Time,
	registradoPorUsuarioID *int64,
	observaciones *string,
) (*domain.PliegoWithEstado, error) {
	const query = `
		INSERT INTO pliegos (
			unidad_id,
			folio,
			titulo,
			descripcion,
			periodo,
			anio,
			fecha_recepcion,
			estado_pliego_id,
			archivo_original_id,
			texto_ocr_bruto,
			texto_revision_final,
			ocr_procesado,
			ocr_fecha_procesado,
			registrado_por_usuario_id,
			observaciones
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			$9, $10, $11, $12, $13, $14, $15
		)
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	folio = strings.TrimSpace(folio)
	titulo = strings.TrimSpace(titulo)

	var pliegoID int64

	err := r.pool.QueryRow(
		ctx,
		query,
		unidadID,
		folio,
		titulo,
		descripcion,
		periodo,
		anio,
		fechaRecepcion,
		estadoPliegoID,
		archivoOriginalID,
		textoOCRBruto,
		textoRevisionFinal,
		ocrProcesado,
		ocrFechaProcesado,
		registradoPorUsuarioID,
		observaciones,
	).Scan(&pliegoID)
	if err != nil {
		if repoErr := mapPliegoPgError(err); repoErr != nil {
			return nil, repoErr
		}
		return nil, fmt.Errorf("crear pliego: %w", err)
	}

	item, err := r.GetByID(ctx, pliegoID)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func mapPliegoPgError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return nil
	}

	if pgErr.Code != "23505" {
		return nil
	}

	constraint := strings.ToLower(pgErr.ConstraintName)
	message := strings.ToLower(pgErr.Message)
	detail := strings.ToLower(pgErr.Detail)

	switch {
	case strings.Contains(constraint, "folio"):
		return ErrPliegoFolioDuplicado
	case strings.Contains(message, "folio"):
		return ErrPliegoFolioDuplicado
	case strings.Contains(detail, "folio"):
		return ErrPliegoFolioDuplicado
	}

	return fmt.Errorf("violación de unicidad en pliegos: %w", err)
}

func (r *PliegoRepository) GetEstadoPliegoIDByClave(ctx context.Context, clave string) (int64, error) {
	const query = `
		SELECT id
		FROM estados_pliego
		WHERE clave = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	clave = strings.TrimSpace(clave)

	var id int64
	err := r.pool.QueryRow(ctx, query, clave).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, fmt.Errorf("estado_pliego no encontrado para clave %q", clave)
		}
		return 0, fmt.Errorf("obtener estado_pliego por clave: %w", err)
	}

	return id, nil
}

func (r *PliegoRepository) UpdateRevisionOCR(
	ctx context.Context,
	id int64,
	textoRevisionFinal *string,
	estadoPliegoID int64,
) (*domain.PliegoWithEstado, error) {
	const query = `
		UPDATE pliegos
		SET
			texto_revision_final = $2,
			estado_pliego_id = $3,
			updated_at = NOW()
		WHERE id = $1
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var pliegoID int64

	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		textoRevisionFinal,
		estadoPliegoID,
	).Scan(&pliegoID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoNotFound
		}
		return nil, fmt.Errorf("actualizar revisión OCR del pliego: %w", err)
	}

	item, err := r.GetByID(ctx, pliegoID)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (r *PliegoRepository) UpdateRevisionOCRByUnidadID(
	ctx context.Context,
	id int64,
	unidadID int64,
	textoRevisionFinal *string,
	estadoPliegoID int64,
) (*domain.PliegoWithEstado, error) {
	const query = `
		UPDATE pliegos
		SET
			texto_revision_final = $3,
			estado_pliego_id = $4,
			updated_at = NOW()
		WHERE id = $1 AND unidad_id = $2
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var pliegoID int64

	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		unidadID,
		textoRevisionFinal,
		estadoPliegoID,
	).Scan(&pliegoID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoNotFound
		}
		return nil, fmt.Errorf("actualizar revisión OCR del pliego por unidad: %w", err)
	}

	item, err := r.GetByIDAndUnidadID(ctx, pliegoID, unidadID)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (r *PliegoRepository) UpdateByUnidadID(
	ctx context.Context,
	id int64,
	unidadID int64,
	folio string,
	titulo string,
	descripcion *string,
	periodo *string,
	anio *int,
	fechaRecepcion time.Time,
) (*domain.PliegoWithEstado, error) {
	const query = `
		UPDATE pliegos
		SET
			folio = $3,
			titulo = $4,
			descripcion = $5,
			periodo = $6,
			anio = $7,
			fecha_recepcion = $8,
			updated_at = NOW()
		WHERE id = $1 AND unidad_id = $2
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	folio = strings.TrimSpace(folio)
	titulo = strings.TrimSpace(titulo)

	var pliegoID int64
	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		unidadID,
		folio,
		titulo,
		descripcion,
		periodo,
		anio,
		fechaRecepcion,
	).Scan(&pliegoID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoNotFound
		}
		if repoErr := mapPliegoPgError(err); repoErr != nil {
			return nil, repoErr
		}
		return nil, fmt.Errorf("actualizar pliego por unidad: %w", err)
	}

	return r.GetByIDAndUnidadID(ctx, pliegoID, unidadID)
}

func (r *PliegoRepository) DeleteByUnidadID(ctx context.Context, id int64, unidadID int64) error {
	const query = `
		DELETE FROM pliegos
		WHERE id = $1 AND unidad_id = $2;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmdTag, err := r.pool.Exec(ctx, query, id, unidadID)
	if err != nil {
		return fmt.Errorf("eliminar pliego por unidad: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrPliegoNotFound
	}

	return nil
}
