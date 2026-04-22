package domain

import "time"

type PliegoPunto struct {
	ID                    int64      `db:"id" json:"id"`
	PliegoID              int64      `db:"pliego_id" json:"pliego_id"`
	NumeroPunto           int        `db:"numero_punto" json:"numero_punto"`
	TextoOriginalOCR      *string    `db:"texto_original_ocr" json:"texto_original_ocr,omitempty"`
	TextoFinal            string     `db:"texto_final" json:"texto_final"`
	CategoriaID           *int64     `db:"categoria_id" json:"categoria_id,omitempty"`
	PrioridadID           int64      `db:"prioridad_id" json:"prioridad_id"`
	EstadoPuntoID         int64      `db:"estado_punto_id" json:"estado_punto_id"`
	ResponsableUsuarioID  *int64     `db:"responsable_usuario_id" json:"responsable_usuario_id,omitempty"`
	FechaRegistro         time.Time  `db:"fecha_registro" json:"fecha_registro"`
	FechaCompromiso       *time.Time `db:"fecha_compromiso" json:"fecha_compromiso,omitempty"`
	FechaEnvioValidacion  *time.Time `db:"fecha_envio_validacion" json:"fecha_envio_validacion,omitempty"`
	FechaRespuestaUnidad  *time.Time `db:"fecha_respuesta_unidad" json:"fecha_respuesta_unidad,omitempty"`
	FechaValidacionDES    *time.Time `db:"fecha_validacion_des" json:"fecha_validacion_des,omitempty"`
	FechaCierre           *time.Time `db:"fecha_cierre" json:"fecha_cierre,omitempty"`
	OrigenCaptura         string     `db:"origen_captura" json:"origen_captura"`
	RequiereValidacion    bool       `db:"requiere_validacion" json:"requiere_validacion"`
	Observaciones         *string    `db:"observaciones" json:"observaciones,omitempty"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time  `db:"updated_at" json:"updated_at"`
}

type PliegoPuntoWithCatalogos struct {
	PliegoPunto
	CategoriaClave    *string `db:"categoria_clave" json:"categoria_clave,omitempty"`
	CategoriaNombre   *string `db:"categoria_nombre" json:"categoria_nombre,omitempty"`
	PrioridadClave    string  `db:"prioridad_clave" json:"prioridad_clave"`
	PrioridadNombre   string  `db:"prioridad_nombre" json:"prioridad_nombre"`
	EstadoPuntoClave  string  `db:"estado_punto_clave" json:"estado_punto_clave"`
	EstadoPuntoNombre string  `db:"estado_punto_nombre" json:"estado_punto_nombre"`
}