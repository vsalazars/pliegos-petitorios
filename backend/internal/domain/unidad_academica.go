package domain

import "time"

type UnidadAcademica struct {
	ID            int64      `db:"id" json:"id"`
	Clave         string     `db:"clave" json:"clave"`
	Nombre        string     `db:"nombre" json:"nombre"`
	CorreoOficial *string    `db:"correo_oficial" json:"correo_oficial,omitempty"`
	Telefono      *string    `db:"telefono" json:"telefono,omitempty"`
	TitularNombre *string    `db:"titular_nombre" json:"titular_nombre,omitempty"`
	Activo        bool       `db:"activo" json:"activo"`
	CreatedAt     time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt     time.Time  `db:"updated_at" json:"updated_at"`
}