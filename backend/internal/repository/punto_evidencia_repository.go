package repository

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PuntoEvidenciaRepository struct {
	pool *pgxpool.Pool
}

var ErrPuntoEvidenciaNotFound = fmt.Errorf("evidencia no encontrada")

func NewPuntoEvidenciaRepository(pool *pgxpool.Pool) *PuntoEvidenciaRepository {
	return &PuntoEvidenciaRepository{pool: pool}
}

func (r *PuntoEvidenciaRepository) ListByPuntoIDAndUnidadID(ctx context.Context, puntoID int64, unidadID int64) ([]domain.PuntoEvidenciaWithDetalle, error) {
	const query = `
		SELECT
			pe.id,
			pe.punto_id,
			pe.archivo_id,
			pe.tipo_evidencia_id,
			pe.titulo,
			pe.descripcion,
			pe.visible_unidad,
			pe.visible_des,
			pe.es_vigente,
			pe.subido_por_usuario_id,
			pe.created_at,
			te.clave AS tipo_evidencia_clave,
			te.nombre AS tipo_evidencia_nombre,
			a.id,
			a.nombre_original,
			a.nombre_storage,
			a.ruta_storage,
			a.mime_type,
			a.extension,
			a.tamano_bytes,
			a.hash_sha256,
			a.subido_por_usuario_id,
			a.created_at
		FROM punto_evidencias pe
		INNER JOIN pliego_puntos pp ON pp.id = pe.punto_id
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		INNER JOIN tipos_evidencia te ON te.id = pe.tipo_evidencia_id
		INNER JOIN archivos a ON a.id = pe.archivo_id
		WHERE pe.punto_id = $1
		  AND p.unidad_id = $2
		ORDER BY pe.created_at DESC, pe.id DESC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, puntoID, unidadID)
	if err != nil {
		return nil, fmt.Errorf("listar evidencias por punto y unidad: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PuntoEvidenciaWithDetalle, 0)
	for rows.Next() {
		var item domain.PuntoEvidenciaWithDetalle
		if err := rows.Scan(
			&item.ID,
			&item.PuntoID,
			&item.ArchivoID,
			&item.TipoEvidenciaID,
			&item.Titulo,
			&item.Descripcion,
			&item.VisibleUnidad,
			&item.VisibleDES,
			&item.EsVigente,
			&item.SubidoPorUsuarioID,
			&item.CreatedAt,
			&item.TipoEvidenciaClave,
			&item.TipoEvidenciaNombre,
			&item.Archivo.ID,
			&item.Archivo.NombreOriginal,
			&item.Archivo.NombreStorage,
			&item.Archivo.RutaStorage,
			&item.Archivo.MimeType,
			&item.Archivo.Extension,
			&item.Archivo.TamanoBytes,
			&item.Archivo.HashSHA256,
			&item.Archivo.SubidoPorUsuarioID,
			&item.Archivo.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan evidencia de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar evidencias de punto: %w", err)
	}

	return items, nil
}

func (r *PuntoEvidenciaRepository) ListByPuntoID(ctx context.Context, puntoID int64) ([]domain.PuntoEvidenciaWithDetalle, error) {
	const query = `
		SELECT
			pe.id,
			pe.punto_id,
			pe.archivo_id,
			pe.tipo_evidencia_id,
			pe.titulo,
			pe.descripcion,
			pe.visible_unidad,
			pe.visible_des,
			pe.es_vigente,
			pe.subido_por_usuario_id,
			pe.created_at,
			te.clave AS tipo_evidencia_clave,
			te.nombre AS tipo_evidencia_nombre,
			a.id,
			a.nombre_original,
			a.nombre_storage,
			a.ruta_storage,
			a.mime_type,
			a.extension,
			a.tamano_bytes,
			a.hash_sha256,
			a.subido_por_usuario_id,
			a.created_at
		FROM punto_evidencias pe
		INNER JOIN tipos_evidencia te ON te.id = pe.tipo_evidencia_id
		INNER JOIN archivos a ON a.id = pe.archivo_id
		WHERE pe.punto_id = $1
		ORDER BY pe.created_at DESC, pe.id DESC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query, puntoID)
	if err != nil {
		return nil, fmt.Errorf("listar evidencias por punto: %w", err)
	}
	defer rows.Close()

	items := make([]domain.PuntoEvidenciaWithDetalle, 0)
	for rows.Next() {
		var item domain.PuntoEvidenciaWithDetalle
		if err := rows.Scan(
			&item.ID,
			&item.PuntoID,
			&item.ArchivoID,
			&item.TipoEvidenciaID,
			&item.Titulo,
			&item.Descripcion,
			&item.VisibleUnidad,
			&item.VisibleDES,
			&item.EsVigente,
			&item.SubidoPorUsuarioID,
			&item.CreatedAt,
			&item.TipoEvidenciaClave,
			&item.TipoEvidenciaNombre,
			&item.Archivo.ID,
			&item.Archivo.NombreOriginal,
			&item.Archivo.NombreStorage,
			&item.Archivo.RutaStorage,
			&item.Archivo.MimeType,
			&item.Archivo.Extension,
			&item.Archivo.TamanoBytes,
			&item.Archivo.HashSHA256,
			&item.Archivo.SubidoPorUsuarioID,
			&item.Archivo.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan evidencia global de punto: %w", err)
		}
		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar evidencias globales de punto: %w", err)
	}

	return items, nil
}

func (r *PuntoEvidenciaRepository) CreateByUnidadID(
	ctx context.Context,
	unidadID int64,
	puntoID int64,
	archivoID int64,
	tipoEvidenciaID int64,
	titulo *string,
	descripcion *string,
	visibleUnidad bool,
	visibleDES bool,
	esVigente bool,
	subidoPorUsuarioID *int64,
) (*domain.PuntoEvidenciaWithDetalle, error) {
	const query = `
		INSERT INTO punto_evidencias (
			punto_id,
			archivo_id,
			tipo_evidencia_id,
			titulo,
			descripcion,
			visible_unidad,
			visible_des,
			es_vigente,
			subido_por_usuario_id
		)
		SELECT
			pp.id, $3, $4, $5, $6, $7, $8, $9, $10
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pp.id = $1
		  AND p.unidad_id = $2
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var evidenciaID int64
	err := r.pool.QueryRow(
		ctx,
		query,
		puntoID,
		unidadID,
		archivoID,
		tipoEvidenciaID,
		titulo,
		descripcion,
		visibleUnidad,
		visibleDES,
		esVigente,
		subidoPorUsuarioID,
	).Scan(&evidenciaID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrPliegoPuntoNotFound
		}
		return nil, fmt.Errorf("crear evidencia por unidad: %w", err)
	}

	return r.GetByID(ctx, evidenciaID)
}

func (r *PuntoEvidenciaRepository) GetByID(ctx context.Context, id int64) (*domain.PuntoEvidenciaWithDetalle, error) {
	const query = `
		SELECT
			pe.id,
			pe.punto_id,
			pe.archivo_id,
			pe.tipo_evidencia_id,
			pe.titulo,
			pe.descripcion,
			pe.visible_unidad,
			pe.visible_des,
			pe.es_vigente,
			pe.subido_por_usuario_id,
			pe.created_at,
			te.clave AS tipo_evidencia_clave,
			te.nombre AS tipo_evidencia_nombre,
			a.id,
			a.nombre_original,
			a.nombre_storage,
			a.ruta_storage,
			a.mime_type,
			a.extension,
			a.tamano_bytes,
			a.hash_sha256,
			a.subido_por_usuario_id,
			a.created_at
		FROM punto_evidencias pe
		INNER JOIN tipos_evidencia te ON te.id = pe.tipo_evidencia_id
		INNER JOIN archivos a ON a.id = pe.archivo_id
		WHERE pe.id = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var item domain.PuntoEvidenciaWithDetalle
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID,
		&item.PuntoID,
		&item.ArchivoID,
		&item.TipoEvidenciaID,
		&item.Titulo,
		&item.Descripcion,
		&item.VisibleUnidad,
		&item.VisibleDES,
		&item.EsVigente,
		&item.SubidoPorUsuarioID,
		&item.CreatedAt,
		&item.TipoEvidenciaClave,
		&item.TipoEvidenciaNombre,
		&item.Archivo.ID,
		&item.Archivo.NombreOriginal,
		&item.Archivo.NombreStorage,
		&item.Archivo.RutaStorage,
		&item.Archivo.MimeType,
		&item.Archivo.Extension,
		&item.Archivo.TamanoBytes,
		&item.Archivo.HashSHA256,
		&item.Archivo.SubidoPorUsuarioID,
		&item.Archivo.CreatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("obtener evidencia por id: %w", err)
	}

	return &item, nil
}

func (r *PuntoEvidenciaRepository) UpdateByUnidadID(
	ctx context.Context,
	unidadID int64,
	evidenciaID int64,
	tipoEvidenciaID int64,
	titulo *string,
	descripcion *string,
) (*domain.PuntoEvidenciaWithDetalle, error) {
	const query = `
		UPDATE punto_evidencias pe
		SET tipo_evidencia_id = $3,
		    titulo = $4,
		    descripcion = $5
		FROM pliego_puntos pp
		INNER JOIN pliegos p ON p.id = pp.pliego_id
		WHERE pe.id = $1
		  AND pp.id = pe.punto_id
		  AND p.unidad_id = $2
		RETURNING pe.id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var updatedID int64
	err := r.pool.QueryRow(
		ctx,
		query,
		evidenciaID,
		unidadID,
		tipoEvidenciaID,
		titulo,
		descripcion,
	).Scan(&updatedID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, ErrPuntoEvidenciaNotFound
		}
		return nil, fmt.Errorf("actualizar evidencia por unidad: %w", err)
	}

	return r.GetByID(ctx, updatedID)
}

func (r *PuntoEvidenciaRepository) DeleteByUnidadID(
	ctx context.Context,
	unidadID int64,
	evidenciaID int64,
) error {
	const query = `
		DELETE FROM punto_evidencias pe
		USING pliego_puntos pp, pliegos p
		WHERE pe.id = $1
		  AND pp.id = pe.punto_id
		  AND p.id = pp.pliego_id
		  AND p.unidad_id = $2;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmdTag, err := r.pool.Exec(ctx, query, evidenciaID, unidadID)
	if err != nil {
		return fmt.Errorf("eliminar evidencia por unidad: %w", err)
	}
	if cmdTag.RowsAffected() == 0 {
		return ErrPuntoEvidenciaNotFound
	}

	return nil
}
