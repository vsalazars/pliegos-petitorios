package domain

import "time"

type Pliego struct {
	ID                     int64      `db:"id" json:"id"`
	UnidadID               int64      `db:"unidad_id" json:"unidad_id"`
	Folio                  string     `db:"folio" json:"folio"`
	Titulo                 string     `db:"titulo" json:"titulo"`
	Descripcion            *string    `db:"descripcion" json:"descripcion,omitempty"`
	Periodo                *string    `db:"periodo" json:"periodo,omitempty"`
	Anio                   *int       `db:"anio" json:"anio,omitempty"`
	FechaRecepcion         time.Time  `db:"fecha_recepcion" json:"fecha_recepcion"`
	FechaRegistro          time.Time  `db:"fecha_registro" json:"fecha_registro"`
	EstadoPliegoID         int64      `db:"estado_pliego_id" json:"estado_pliego_id"`
	ArchivoOriginalID      *int64     `db:"archivo_original_id" json:"archivo_original_id,omitempty"`
	TextoOCRBruto          *string    `db:"texto_ocr_bruto" json:"texto_ocr_bruto,omitempty"`
	TextoRevisionFinal     *string    `db:"texto_revision_final" json:"texto_revision_final,omitempty"`
	OCRProcesado           bool       `db:"ocr_procesado" json:"ocr_procesado"`
	OCRFechaProcesado      *time.Time `db:"ocr_fecha_procesado" json:"ocr_fecha_procesado,omitempty"`
	RegistradoPorUsuarioID *int64     `db:"registrado_por_usuario_id" json:"registrado_por_usuario_id,omitempty"`
	Observaciones          *string    `db:"observaciones" json:"observaciones,omitempty"`
	CreatedAt              time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt              time.Time  `db:"updated_at" json:"updated_at"`
}

type PliegoWithEstado struct {
	Pliego
	EstadoPliegoClave  string `db:"estado_pliego_clave" json:"estado_pliego_clave"`
	EstadoPliegoNombre string `db:"estado_pliego_nombre" json:"estado_pliego_nombre"`
}