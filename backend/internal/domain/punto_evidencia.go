package domain

import "time"

type PuntoEvidencia struct {
	ID                 int64     `db:"id" json:"id"`
	PuntoID            int64     `db:"punto_id" json:"punto_id"`
	ArchivoID          int64     `db:"archivo_id" json:"archivo_id"`
	TipoEvidenciaID    int64     `db:"tipo_evidencia_id" json:"tipo_evidencia_id"`
	Titulo             *string   `db:"titulo" json:"titulo,omitempty"`
	Descripcion        *string   `db:"descripcion" json:"descripcion,omitempty"`
	VisibleUnidad      bool      `db:"visible_unidad" json:"visible_unidad"`
	VisibleDES         bool      `db:"visible_des" json:"visible_des"`
	EsVigente          bool      `db:"es_vigente" json:"es_vigente"`
	SubidoPorUsuarioID *int64    `db:"subido_por_usuario_id" json:"subido_por_usuario_id,omitempty"`
	CreatedAt          time.Time `db:"created_at" json:"created_at"`
}

type PuntoEvidenciaWithDetalle struct {
	PuntoEvidencia
	TipoEvidenciaClave  string  `db:"tipo_evidencia_clave" json:"tipo_evidencia_clave"`
	TipoEvidenciaNombre string  `db:"tipo_evidencia_nombre" json:"tipo_evidencia_nombre"`
	Archivo             Archivo `json:"archivo"`
}
