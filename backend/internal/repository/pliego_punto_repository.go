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

var ErrPliegoPuntoNotFound = errors.New("punto de pliego no encontrado")
var ErrPliegoPuntoNumeroDuplicado = errors.New("el número de punto ya existe en el pliego")

type PliegoPuntoRepository struct {
	pool *pgxpool.Pool
}

func NewPliegoPuntoRepository(pool *pgxpool.Pool) *PliegoPuntoRepository {
	return &PliegoPuntoRepository{
		pool: pool,
	}
}

func (r *PliegoPuntoRepository) ListByPliegoID(ctx context.Context, pliegoID int64) ([]domain.PliegoPuntoWithCatalogos, error) {
	const query = `
		SELECT
			pp.id,
			pp.pliego_id,
			pp.numero_punto,
			pp.texto_original_ocr,
			pp.texto_final,
			pp.categoria_id,
			pp.prioridad_id,
			pp.estado_punto_id,
			pp.responsable_usuario_id,
			pp.fecha_registro,
			pp.fecha_compromiso,
			pp.fecha_envio_validacion,
			pp.fecha_respuesta_unidad,
			pp.fecha_validacion_des,
			pp.fecha_cierre,
			pp.origen_captura,
			pp.requiere_validacion,
			pp.observaciones,
			pp.created_at,
			pp.updated_at,
			cp.clave AS categoria_clave,
			cp.nombre AS categoria_nombre,
			pr.clave AS prioridad_clave,
			pr.nombre AS prioridad_nombre,
			ep.clave AS estado_punto_clave,
			ep.nombre AS estado_punto_nombre
		FROM pliego_puntos pp
		LEFT JOIN categorias_punto cp ON cp.id = pp.categoria_id
		INNER JOIN prioridades pr ON pr.id = pp.prioridad_id
		INNER JOIN estados_punto ep ON ep.id = pp.estado_punto_id
		WHERE pp.pliego_id = $1
		ORDER BY pp.numero_punto ASC, pp.id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, pliegoID)
	if err != nil {
		return nil, fmt.Errorf("listar puntos del pliego: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PliegoPuntoWithCatalogos, 0)

	for rows.Next() {
		var item domain.PliegoPuntoWithCatalogos

		if err := rows.Scan(
			&item.ID,
			&item.PliegoID,
			&item.NumeroPunto,
			&item.TextoOriginalOCR,
			&item.TextoFinal,
			&item.CategoriaID,
			&item.PrioridadID,
			&item.EstadoPuntoID,
			&item.ResponsableUsuarioID,
			&item.FechaRegistro,
			&item.FechaCompromiso,
			&item.FechaEnvioValidacion,
			&item.FechaRespuestaUnidad,
			&item.FechaValidacionDES,
			&item.FechaCierre,
			&item.OrigenCaptura,
			&item.RequiereValidacion,
			&item.Observaciones,
			&item.CreatedAt,
			&item.UpdatedAt,
			&item.CategoriaClave,
			&item.CategoriaNombre,
			&item.PrioridadClave,
			&item.PrioridadNombre,
			&item.EstadoPuntoClave,
			&item.EstadoPuntoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan punto del pliego: %w", err)
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar puntos del pliego: %w", err)
	}

	return items, nil
}

func (r *PliegoPuntoRepository) GetByID(ctx context.Context, id int64) (*domain.PliegoPuntoWithCatalogos, error) {
	const query = `
		SELECT
			pp.id,
			pp.pliego_id,
			pp.numero_punto,
			pp.texto_original_ocr,
			pp.texto_final,
			pp.categoria_id,
			pp.prioridad_id,
			pp.estado_punto_id,
			pp.responsable_usuario_id,
			pp.fecha_registro,
			pp.fecha_compromiso,
			pp.fecha_envio_validacion,
			pp.fecha_respuesta_unidad,
			pp.fecha_validacion_des,
			pp.fecha_cierre,
			pp.origen_captura,
			pp.requiere_validacion,
			pp.observaciones,
			pp.created_at,
			pp.updated_at,
			cp.clave AS categoria_clave,
			cp.nombre AS categoria_nombre,
			pr.clave AS prioridad_clave,
			pr.nombre AS prioridad_nombre,
			ep.clave AS estado_punto_clave,
			ep.nombre AS estado_punto_nombre
		FROM pliego_puntos pp
		LEFT JOIN categorias_punto cp ON cp.id = pp.categoria_id
		INNER JOIN prioridades pr ON pr.id = pp.prioridad_id
		INNER JOIN estados_punto ep ON ep.id = pp.estado_punto_id
		WHERE pp.id = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PliegoPuntoWithCatalogos

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.PliegoID,
		&item.NumeroPunto,
		&item.TextoOriginalOCR,
		&item.TextoFinal,
		&item.CategoriaID,
		&item.PrioridadID,
		&item.EstadoPuntoID,
		&item.ResponsableUsuarioID,
		&item.FechaRegistro,
		&item.FechaCompromiso,
		&item.FechaEnvioValidacion,
		&item.FechaRespuestaUnidad,
		&item.FechaValidacionDES,
		&item.FechaCierre,
		&item.OrigenCaptura,
		&item.RequiereValidacion,
		&item.Observaciones,
		&item.CreatedAt,
		&item.UpdatedAt,
		&item.CategoriaClave,
		&item.CategoriaNombre,
		&item.PrioridadClave,
		&item.PrioridadNombre,
		&item.EstadoPuntoClave,
		&item.EstadoPuntoNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoPuntoNotFound
		}
		return nil, fmt.Errorf("obtener punto del pliego por id: %w", err)
	}

	return &item, nil
}

func (r *PliegoPuntoRepository) Create(
	ctx context.Context,
	pliegoID int64,
	numeroPunto int,
	textoOriginalOCR *string,
	textoFinal string,
	categoriaID *int64,
	prioridadID int64,
	estadoPuntoID int64,
	responsableUsuarioID *int64,
	fechaCompromiso *time.Time,
	origenCaptura string,
	requiereValidacion bool,
	observaciones *string,
) (*domain.PliegoPuntoWithCatalogos, error) {
	const query = `
		INSERT INTO pliego_puntos (
			pliego_id,
			numero_punto,
			texto_original_ocr,
			texto_final,
			categoria_id,
			prioridad_id,
			estado_punto_id,
			responsable_usuario_id,
			fecha_compromiso,
			origen_captura,
			requiere_validacion,
			observaciones
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
		)
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	textoFinal = strings.TrimSpace(textoFinal)
	origenCaptura = strings.TrimSpace(strings.ToLower(origenCaptura))

	var puntoID int64

	err := r.pool.QueryRow(
		ctx,
		query,
		pliegoID,
		numeroPunto,
		textoOriginalOCR,
		textoFinal,
		categoriaID,
		prioridadID,
		estadoPuntoID,
		responsableUsuarioID,
		fechaCompromiso,
		origenCaptura,
		requiereValidacion,
		observaciones,
	).Scan(&puntoID)
	if err != nil {
		if repoErr := mapPliegoPuntoPgError(err); repoErr != nil {
			return nil, repoErr
		}
		return nil, fmt.Errorf("crear punto del pliego: %w", err)
	}

	item, err := r.GetByID(ctx, puntoID)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func mapPliegoPuntoPgError(err error) error {
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
	case strings.Contains(constraint, "numero"):
		return ErrPliegoPuntoNumeroDuplicado
	case strings.Contains(message, "numero"):
		return ErrPliegoPuntoNumeroDuplicado
	case strings.Contains(detail, "numero"):
		return ErrPliegoPuntoNumeroDuplicado
	}

	return fmt.Errorf("violación de unicidad en pliego_puntos: %w", err)
}

type CreatePliegoPuntoFromOCRInput struct {
	NumeroPunto      int
	TextoOriginalOCR string
	TextoFinal       string
}

func (r *PliegoPuntoRepository) CreateFromOCR(
	ctx context.Context,
	pliegoID int64,
	puntos []CreatePliegoPuntoFromOCRInput,
) error {
	const query = `
		INSERT INTO pliego_puntos (
			pliego_id,
			numero_punto,
			texto_original_ocr,
			texto_final,
			prioridad_id,
			estado_punto_id,
			origen_captura
		)
		VALUES ($1, $2, $3, $4, $5, $6, 'ocr');
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	const prioridadDefault int64 = 2 // media
	const estadoDetectado int64 = 1  // detectado

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, p := range puntos {
		_, err := tx.Exec(
			ctx,
			query,
			pliegoID,
			p.NumeroPunto,
			p.TextoOriginalOCR,
			p.TextoFinal,
			prioridadDefault,
			estadoDetectado,
		)
		if err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *PliegoPuntoRepository) UpdateTextoFinal(
	ctx context.Context,
	id int64,
	textoFinal string,
) error {
	query := `
	UPDATE pliego_puntos
	SET texto_final = $1,
	    requiere_validacion = false,
	    updated_at = NOW()
	WHERE id = $2
	`

	cmdTag, err := r.pool.Exec(ctx, query, textoFinal, id)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("punto no encontrado")
	}

	return nil
}

func (r *PliegoPuntoRepository) UpdateCompleto(
	ctx context.Context,
	id int64,
	textoFinal string,
	prioridadID int64,
	estadoPuntoID int64,
	categoriaID *int64,
	responsableUsuarioID *int64,
	fechaCompromiso *time.Time,
	observaciones *string,
) error {
	var estadoAnteriorID int64

	err := r.pool.QueryRow(ctx, `
		SELECT estado_punto_id
		FROM pliego_puntos
		WHERE id = $1
	`, id).Scan(&estadoAnteriorID)
	if err != nil {
		return err
	}

	query := `
	UPDATE pliego_puntos
	SET texto_final = $1,
	    prioridad_id = $2,
	    estado_punto_id = $3,
	    categoria_id = $4,
	    responsable_usuario_id = $5,
	    fecha_compromiso = $6,
	    observaciones = $7,
	    requiere_validacion = false,
	    updated_at = NOW()
	WHERE id = $8
	`

	cmdTag, err := r.pool.Exec(
		ctx,
		query,
		textoFinal,
		prioridadID,
		estadoPuntoID,
		categoriaID,
		responsableUsuarioID,
		fechaCompromiso,
		observaciones,
		id,
	)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("punto no encontrado")
	}

	tipoMovimiento := "observacion"
	comentario := "Punto actualizado manualmente"

	var estadoAnteriorPtr *int64
	var estadoNuevoPtr *int64

	if estadoAnteriorID != estadoPuntoID {
		tipoMovimiento = "cambio_estado"
		comentario = "Cambio de estado del punto"
		estadoAnteriorPtr = &estadoAnteriorID
		estadoNuevoPtr = &estadoPuntoID
	}

	_, err = r.pool.Exec(ctx, `
		INSERT INTO punto_seguimientos (
			punto_id,
			tipo_movimiento,
			comentario,
			estado_anterior_id,
			estado_nuevo_id
		) VALUES ($1, $2, $3, $4, $5)
	`,
		id,
		tipoMovimiento,
		comentario,
		estadoAnteriorPtr,
		estadoNuevoPtr,
	)
	if err != nil {
		return err
	}

	return nil
}