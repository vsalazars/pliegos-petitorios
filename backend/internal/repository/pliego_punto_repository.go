package repository

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrPliegoPuntoNotFound = errors.New("punto de pliego no encontrado")
var ErrPliegoPuntoNumeroDuplicado = errors.New("el número de punto ya existe en el pliego")
var ErrPliegoPuntoDeleteBlocked = errors.New("el punto no se puede eliminar porque ya tiene historial asociado")

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
			COALESCE(ev.total_evidencias, 0) AS evidencias_count,
			pv.resultado AS validacion_resultado_vigente,
			pv.comentario AS validacion_comentario_vigente,
			mr.nombre AS validacion_motivo_rechazo_nombre,
			cp.clave AS categoria_clave,
			cp.nombre AS categoria_nombre,
			pr.clave AS prioridad_clave,
			pr.nombre AS prioridad_nombre,
			ep.clave AS estado_punto_clave,
			ep.nombre AS estado_punto_nombre
		FROM pliego_puntos pp
		LEFT JOIN (
			SELECT punto_id, COUNT(*) AS total_evidencias
			FROM punto_evidencias
			GROUP BY punto_id
		) ev ON ev.punto_id = pp.id
		LEFT JOIN punto_validaciones pv ON pv.punto_id = pp.id AND pv.es_vigente = TRUE
		LEFT JOIN motivos_rechazo mr ON mr.id = pv.motivo_rechazo_id
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
			&item.EvidenciasCount,
			&item.ValidacionResultadoVigente,
			&item.ValidacionComentarioVigente,
			&item.ValidacionMotivoRechazoNombre,
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

func (r *PliegoPuntoRepository) ListByPliegoIDAndUnidadID(ctx context.Context, pliegoID int64, unidadID int64) ([]domain.PliegoPuntoWithCatalogos, error) {
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
			COALESCE(ev.total_evidencias, 0) AS evidencias_count,
			pv.resultado AS validacion_resultado_vigente,
			pv.comentario AS validacion_comentario_vigente,
			mr.nombre AS validacion_motivo_rechazo_nombre,
			cp.clave AS categoria_clave,
			cp.nombre AS categoria_nombre,
			pr.clave AS prioridad_clave,
			pr.nombre AS prioridad_nombre,
			ep.clave AS estado_punto_clave,
			ep.nombre AS estado_punto_nombre
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		LEFT JOIN (
			SELECT punto_id, COUNT(*) AS total_evidencias
			FROM punto_evidencias
			GROUP BY punto_id
		) ev ON ev.punto_id = pp.id
		LEFT JOIN punto_validaciones pv ON pv.punto_id = pp.id AND pv.es_vigente = TRUE
		LEFT JOIN motivos_rechazo mr ON mr.id = pv.motivo_rechazo_id
		LEFT JOIN categorias_punto cp ON cp.id = pp.categoria_id
		INNER JOIN prioridades pr ON pr.id = pp.prioridad_id
		INNER JOIN estados_punto ep ON ep.id = pp.estado_punto_id
		WHERE pp.pliego_id = $1 AND p.unidad_id = $2
		ORDER BY pp.numero_punto ASC, pp.id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, pliegoID, unidadID)
	if err != nil {
		return nil, fmt.Errorf("listar puntos del pliego por unidad: %w", err)
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
			&item.EvidenciasCount,
			&item.ValidacionResultadoVigente,
			&item.ValidacionComentarioVigente,
			&item.ValidacionMotivoRechazoNombre,
			&item.CategoriaClave,
			&item.CategoriaNombre,
			&item.PrioridadClave,
			&item.PrioridadNombre,
			&item.EstadoPuntoClave,
			&item.EstadoPuntoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan punto del pliego por unidad: %w", err)
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar puntos del pliego por unidad: %w", err)
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

type ListPuntosFilters struct {
	UnidadID           *int64
	EstadoPuntoID      *int64
	PrioridadID        *int64
	CategoriaID        *int64
	RequiereValidacion *bool
	Query              string
}

func (r *PliegoPuntoRepository) ListAll(ctx context.Context, filters ListPuntosFilters) ([]domain.PliegoPuntoWithCatalogos, error) {
	baseQuery := `
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
			COALESCE(ev.total_evidencias, 0) AS evidencias_count,
			p.unidad_id,
			ua.clave AS unidad_clave,
			ua.nombre AS unidad_nombre,
			p.folio AS folio_pliego,
			p.titulo AS titulo_pliego,
			cp.clave AS categoria_clave,
			cp.nombre AS categoria_nombre,
			pr.clave AS prioridad_clave,
			pr.nombre AS prioridad_nombre,
			ep.clave AS estado_punto_clave,
			ep.nombre AS estado_punto_nombre
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		LEFT JOIN (
			SELECT punto_id, COUNT(*) AS total_evidencias
			FROM punto_evidencias
			GROUP BY punto_id
		) ev ON ev.punto_id = pp.id
		LEFT JOIN unidades_academicas ua ON ua.id = p.unidad_id
		LEFT JOIN categorias_punto cp ON cp.id = pp.categoria_id
		INNER JOIN prioridades pr ON pr.id = pp.prioridad_id
		INNER JOIN estados_punto ep ON ep.id = pp.estado_punto_id
	`

	conditions := make([]string, 0)
	args := make([]any, 0)
	argPos := 1

	if filters.UnidadID != nil && *filters.UnidadID > 0 {
		conditions = append(conditions, "p.unidad_id = $"+strconv.Itoa(argPos))
		args = append(args, *filters.UnidadID)
		argPos++
	}

	if filters.EstadoPuntoID != nil && *filters.EstadoPuntoID > 0 {
		conditions = append(conditions, "pp.estado_punto_id = $"+strconv.Itoa(argPos))
		args = append(args, *filters.EstadoPuntoID)
		argPos++
	}

	if filters.PrioridadID != nil && *filters.PrioridadID > 0 {
		conditions = append(conditions, "pp.prioridad_id = $"+strconv.Itoa(argPos))
		args = append(args, *filters.PrioridadID)
		argPos++
	}

	if filters.CategoriaID != nil && *filters.CategoriaID > 0 {
		conditions = append(conditions, "pp.categoria_id = $"+strconv.Itoa(argPos))
		args = append(args, *filters.CategoriaID)
		argPos++
	}

	if filters.RequiereValidacion != nil {
		conditions = append(conditions, "pp.requiere_validacion = $"+strconv.Itoa(argPos))
		args = append(args, *filters.RequiereValidacion)
		argPos++
	}

	queryText := strings.TrimSpace(filters.Query)
	if queryText != "" {
		pattern := "%" + strings.ToLower(queryText) + "%"
		conditions = append(conditions, "(LOWER(pp.texto_final) LIKE $"+strconv.Itoa(argPos)+" OR LOWER(COALESCE(pp.texto_original_ocr, '')) LIKE $"+strconv.Itoa(argPos)+" OR CAST(pp.numero_punto AS TEXT) LIKE $"+strconv.Itoa(argPos)+")")
		args = append(args, pattern)
		argPos++
	}

	query := baseQuery
	if len(conditions) > 0 {
		query += "\nWHERE " + strings.Join(conditions, " AND ")
	}
	query += "\nORDER BY pp.created_at DESC, pp.id DESC;"

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("listar puntos globalmente: %w", err)
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
			&item.EvidenciasCount,
			&item.UnidadID,
			&item.UnidadClave,
			&item.UnidadNombre,
			&item.FolioPliego,
			&item.TituloPliego,
			&item.CategoriaClave,
			&item.CategoriaNombre,
			&item.PrioridadClave,
			&item.PrioridadNombre,
			&item.EstadoPuntoClave,
			&item.EstadoPuntoNombre,
		); err != nil {
			return nil, fmt.Errorf("scan punto global: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar puntos globales: %w", err)
	}

	return items, nil
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

func (r *PliegoPuntoRepository) CreateByUnidadID(
	ctx context.Context,
	unidadID int64,
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
		SELECT
			p.id, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
		FROM pliegos p
		WHERE p.id = $1 AND p.unidad_id = $2
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
		unidadID,
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
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrPliegoPuntoNotFound
		}
		if repoErr := mapPliegoPuntoPgError(err); repoErr != nil {
			return nil, repoErr
		}
		return nil, fmt.Errorf("crear punto del pliego por unidad: %w", err)
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

func (r *PliegoPuntoRepository) CreateFromOCRByUnidadID(
	ctx context.Context,
	unidadID int64,
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
		SELECT p.id, $3, $4, $5, $6, $7, 'ocr'
		FROM pliegos p
		WHERE p.id = $1 AND p.unidad_id = $2;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	const prioridadDefault int64 = 2
	const estadoDetectado int64 = 1

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	for _, p := range puntos {
		cmdTag, err := tx.Exec(
			ctx,
			query,
			pliegoID,
			unidadID,
			p.NumeroPunto,
			p.TextoOriginalOCR,
			p.TextoFinal,
			prioridadDefault,
			estadoDetectado,
		)
		if err != nil {
			return err
		}
		if cmdTag.RowsAffected() == 0 {
			return ErrPliegoPuntoNotFound
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

func (r *PliegoPuntoRepository) UpdateTextoFinalByUnidadID(
	ctx context.Context,
	unidadID int64,
	id int64,
	textoFinal string,
) error {
	query := `
		UPDATE pliego_puntos pp
		SET texto_final = $1,
		    requiere_validacion = false,
		    updated_at = NOW()
		FROM pliegos p
		WHERE pp.id = $2
		  AND p.id = pp.pliego_id
		  AND p.unidad_id = $3
	`

	cmdTag, err := r.pool.Exec(ctx, query, textoFinal, id, unidadID)
	if err != nil {
		return err
	}

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("punto no encontrado")
	}

	return nil
}

func (r *PliegoPuntoRepository) DeleteByUnidadID(
	ctx context.Context,
	unidadID int64,
	id int64,
) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("iniciar transacción para eliminar punto: %w", err)
	}
	defer tx.Rollback(ctx)

	var puntoExists bool
	err = tx.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM pliego_puntos pp
			INNER JOIN pliegos p ON p.id = pp.pliego_id
			WHERE pp.id = $1
			  AND p.unidad_id = $2
		)
	`, id, unidadID).Scan(&puntoExists)
	if err != nil {
		return fmt.Errorf("verificar punto por unidad: %w", err)
	}
	if !puntoExists {
		return ErrPliegoPuntoNotFound
	}

	var hasDependencies bool
	err = tx.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM punto_evidencias WHERE punto_id = $1
			UNION ALL
			SELECT 1 FROM punto_validaciones WHERE punto_id = $1
			UNION ALL
			SELECT 1 FROM punto_seguimientos WHERE punto_id = $1
		)
	`, id).Scan(&hasDependencies)
	if err != nil {
		return fmt.Errorf("verificar dependencias del punto: %w", err)
	}
	if hasDependencies {
		return ErrPliegoPuntoDeleteBlocked
	}

	cmdTag, err := tx.Exec(ctx, `
		DELETE FROM pliego_puntos pp
		USING pliegos p
		WHERE pp.id = $1
		  AND p.id = pp.pliego_id
		  AND p.unidad_id = $2
	`, id, unidadID)
	if err != nil {
		return fmt.Errorf("eliminar punto por unidad: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrPliegoPuntoNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("confirmar eliminación de punto: %w", err)
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

func (r *PliegoPuntoRepository) UpdateCompletoByUnidadID(
	ctx context.Context,
	unidadID int64,
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
		SELECT pp.estado_punto_id
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pp.id = $1 AND p.unidad_id = $2
	`, id, unidadID).Scan(&estadoAnteriorID)
	if err != nil {
		return err
	}

	query := `
		UPDATE pliego_puntos pp
		SET texto_final = $1,
		    prioridad_id = $2,
		    estado_punto_id = $3,
		    categoria_id = $4,
		    responsable_usuario_id = $5,
		    fecha_compromiso = $6,
		    observaciones = $7,
		    requiere_validacion = false,
		    updated_at = NOW()
		FROM pliegos p
		WHERE pp.id = $8
		  AND p.id = pp.pliego_id
		  AND p.unidad_id = $9
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
		unidadID,
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

func (r *PliegoPuntoRepository) GetEstadoPuntoIDByClave(ctx context.Context, clave string) (int64, error) {
	const query = `
		SELECT id
		FROM estados_punto
		WHERE clave = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var id int64
	err := r.pool.QueryRow(ctx, query, strings.TrimSpace(clave)).Scan(&id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, fmt.Errorf("estado_punto no encontrado para clave %q", clave)
		}
		return 0, fmt.Errorf("obtener estado_punto por clave: %w", err)
	}

	return id, nil
}

func (r *PliegoPuntoRepository) EnviarAValidacionByUnidadID(
	ctx context.Context,
	unidadID int64,
	puntoID int64,
	usuarioID *int64,
	comentario *string,
) error {
	const estadoEnviadoClave = "enviado_validacion"

	estadoNuevoID, err := r.GetEstadoPuntoIDByClave(ctx, estadoEnviadoClave)
	if err != nil {
		return err
	}

	var estadoAnteriorID int64
	var fechaEnvioAnterior *time.Time

	err = r.pool.QueryRow(ctx, `
		SELECT pp.estado_punto_id, pp.fecha_envio_validacion
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pp.id = $1 AND p.unidad_id = $2
	`, puntoID, unidadID).Scan(&estadoAnteriorID, &fechaEnvioAnterior)
	if err != nil {
		return err
	}

	query := `
		UPDATE pliego_puntos pp
		SET estado_punto_id = $1,
		    fecha_envio_validacion = NOW(),
		    fecha_respuesta_unidad = CASE
		        WHEN pp.fecha_envio_validacion IS NULL THEN pp.fecha_respuesta_unidad
		        ELSE NOW()
		    END,
		    requiere_validacion = true,
		    updated_at = NOW()
		FROM pliegos p
		WHERE pp.id = $2
		  AND p.id = pp.pliego_id
		  AND p.unidad_id = $3
	`

	cmdTag, err := r.pool.Exec(ctx, query, estadoNuevoID, puntoID, unidadID)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("punto no encontrado")
	}

	comentarioFinal := "Punto enviado a validación"
	if comentario != nil && strings.TrimSpace(*comentario) != "" {
		comentarioFinal = strings.TrimSpace(*comentario)
	}

	_, err = r.pool.Exec(ctx, `
		INSERT INTO punto_seguimientos (
			punto_id,
			usuario_id,
			tipo_movimiento,
			comentario,
			estado_anterior_id,
			estado_nuevo_id
		) VALUES ($1, $2, 'envio_validacion', $3, $4, $5)
	`,
		puntoID,
		usuarioID,
		comentarioFinal,
		estadoAnteriorID,
		estadoNuevoID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *PliegoPuntoRepository) ResponderValidacionByUnidadID(
	ctx context.Context,
	unidadID int64,
	puntoID int64,
	usuarioID *int64,
	comentario string,
) error {
	const estadoEnProcesoClave = "en_proceso"

	estadoNuevoID, err := r.GetEstadoPuntoIDByClave(ctx, estadoEnProcesoClave)
	if err != nil {
		return err
	}

	var estadoAnteriorID int64
	err = r.pool.QueryRow(ctx, `
		SELECT pp.estado_punto_id
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pp.id = $1 AND p.unidad_id = $2
	`, puntoID, unidadID).Scan(&estadoAnteriorID)
	if err != nil {
		return err
	}

	query := `
		UPDATE pliego_puntos pp
		SET estado_punto_id = $1,
		    fecha_respuesta_unidad = NOW(),
		    requiere_validacion = false,
		    updated_at = NOW()
		FROM pliegos p
		WHERE pp.id = $2
		  AND p.id = pp.pliego_id
		  AND p.unidad_id = $3
	`

	cmdTag, err := r.pool.Exec(ctx, query, estadoNuevoID, puntoID, unidadID)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("punto no encontrado")
	}

	_, err = r.pool.Exec(ctx, `
		UPDATE punto_validaciones pv
		SET es_vigente = FALSE
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pv.punto_id = pp.id
		  AND pp.id = $1
		  AND p.unidad_id = $2
		  AND pv.es_vigente = TRUE
	`, puntoID, unidadID)
	if err != nil {
		return err
	}

	comentarioFinal := strings.TrimSpace(comentario)
	if comentarioFinal == "" {
		comentarioFinal = "La unidad respondió a la validación"
	}

	_, err = r.pool.Exec(ctx, `
		INSERT INTO punto_seguimientos (
			punto_id,
			usuario_id,
			tipo_movimiento,
			comentario,
			estado_anterior_id,
			estado_nuevo_id
		) VALUES ($1, $2, 'observacion', $3, $4, $5)
	`,
		puntoID,
		usuarioID,
		comentarioFinal,
		estadoAnteriorID,
		estadoNuevoID,
	)
	if err != nil {
		return err
	}

	return nil
}

func (r *PliegoPuntoRepository) AplicarValidacionDES(
	ctx context.Context,
	puntoID int64,
	resultado string,
	comentario *string,
) error {
	resultado = strings.TrimSpace(strings.ToLower(resultado))

	estadoClaveDestino := ""
	tipoMovimiento := "validacion"
	comentarioSeguimiento := "Validación registrada por DES"
	requiereValidacion := false

	switch resultado {
	case "aprobado":
		estadoClaveDestino = "validado"
		comentarioSeguimiento = "Punto aprobado por DES"
	case "rechazado":
		estadoClaveDestino = "rechazado"
		tipoMovimiento = "rechazo"
		comentarioSeguimiento = "Punto rechazado por DES"
	case "requiere_informacion":
		estadoClaveDestino = "requiere_informacion"
		tipoMovimiento = "validacion"
		comentarioSeguimiento = "DES requiere información adicional"
	default:
		return fmt.Errorf("resultado de validación no válido")
	}

	if comentario != nil && strings.TrimSpace(*comentario) != "" {
		comentarioSeguimiento = strings.TrimSpace(*comentario)
	}

	estadoNuevoID, err := r.GetEstadoPuntoIDByClave(ctx, estadoClaveDestino)
	if err != nil {
		return err
	}

	var estadoAnteriorID int64
	err = r.pool.QueryRow(ctx, `
		SELECT estado_punto_id
		FROM pliego_puntos
		WHERE id = $1
	`, puntoID).Scan(&estadoAnteriorID)
	if err != nil {
		return err
	}

	query := `
		UPDATE pliego_puntos
		SET estado_punto_id = $1,
		    fecha_validacion_des = NOW(),
		    requiere_validacion = $2,
		    updated_at = NOW()
		WHERE id = $3
	`

	cmdTag, err := r.pool.Exec(ctx, query, estadoNuevoID, requiereValidacion, puntoID)
	if err != nil {
		return err
	}
	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("punto no encontrado")
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
		puntoID,
		tipoMovimiento,
		comentarioSeguimiento,
		estadoAnteriorID,
		estadoNuevoID,
	)
	if err != nil {
		return err
	}

	return nil
}
