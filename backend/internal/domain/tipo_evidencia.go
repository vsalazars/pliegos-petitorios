package domain

import "time"

type TipoEvidencia struct {
	ID        int64     `db:"id" json:"id"`
	Clave     string    `db:"clave" json:"clave"`
	Nombre    string    `db:"nombre" json:"nombre"`
	Activo    bool      `db:"activo" json:"activo"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
