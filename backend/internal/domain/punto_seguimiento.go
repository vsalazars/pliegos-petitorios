package domain

import "time"

type PuntoSeguimiento struct {
	ID               int64     `db:"id" json:"id"`
	PuntoID          int64     `db:"punto_id" json:"punto_id"`
	UsuarioID        *int64    `db:"usuario_id" json:"usuario_id,omitempty"`
	TipoMovimiento   string    `db:"tipo_movimiento" json:"tipo_movimiento"`
	Comentario       *string   `db:"comentario" json:"comentario,omitempty"`
	EstadoAnteriorID *int64    `db:"estado_anterior_id" json:"estado_anterior_id,omitempty"`
	EstadoNuevoID    *int64    `db:"estado_nuevo_id" json:"estado_nuevo_id,omitempty"`
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
}

type PuntoSeguimientoWithDetalle struct {
	PuntoSeguimiento
	Username             *string `db:"username" json:"username,omitempty"`
	NombreUsuario        *string `db:"nombre_usuario" json:"nombre_usuario,omitempty"`
	EstadoAnteriorClave  *string `db:"estado_anterior_clave" json:"estado_anterior_clave,omitempty"`
	EstadoAnteriorNombre *string `db:"estado_anterior_nombre" json:"estado_anterior_nombre,omitempty"`
	EstadoNuevoClave     *string `db:"estado_nuevo_clave" json:"estado_nuevo_clave,omitempty"`
	EstadoNuevoNombre    *string `db:"estado_nuevo_nombre" json:"estado_nuevo_nombre,omitempty"`
}
