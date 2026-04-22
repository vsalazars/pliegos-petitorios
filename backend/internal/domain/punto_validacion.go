package domain

import "time"

type PuntoValidacion struct {
	ID                 int64     `db:"id" json:"id"`
	PuntoID            int64     `db:"punto_id" json:"punto_id"`
	UsuarioValidadorID *int64    `db:"usuario_validador_id" json:"usuario_validador_id,omitempty"`
	Resultado          string    `db:"resultado" json:"resultado"`
	MotivoRechazoID    *int64    `db:"motivo_rechazo_id" json:"motivo_rechazo_id,omitempty"`
	Comentario         *string   `db:"comentario" json:"comentario,omitempty"`
	EsVigente          bool      `db:"es_vigente" json:"es_vigente"`
	CreatedAt          time.Time `db:"created_at" json:"created_at"`
}

type PuntoValidacionWithDetalle struct {
	PuntoValidacion
	Username            *string `db:"username" json:"username,omitempty"`
	NombreUsuario       *string `db:"nombre_usuario" json:"nombre_usuario,omitempty"`
	MotivoRechazoClave  *string `db:"motivo_rechazo_clave" json:"motivo_rechazo_clave,omitempty"`
	MotivoRechazoNombre *string `db:"motivo_rechazo_nombre" json:"motivo_rechazo_nombre,omitempty"`
}
