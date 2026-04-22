package domain

import "time"

type Prioridad struct {
	ID         int64     `db:"id" json:"id"`
	Clave      string    `db:"clave" json:"clave"`
	Nombre     string    `db:"nombre" json:"nombre"`
	NivelOrden int       `db:"nivel_orden" json:"nivel_orden"`
	DiasSLA    int       `db:"dias_sla" json:"dias_sla"`
	Activo     bool      `db:"activo" json:"activo"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
	UpdatedAt  time.Time `db:"updated_at" json:"updated_at"`
}
