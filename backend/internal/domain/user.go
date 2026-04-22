package domain

import "time"

type User struct {
	ID                       int64      `db:"id" json:"id"`
	UnidadID                 *int64     `db:"unidad_id" json:"unidad_id,omitempty"`
	RolID                    int64      `db:"rol_id" json:"rol_id"`
	Nombre                   string     `db:"nombre" json:"nombre"`
	ApellidoPaterno          *string    `db:"apellido_paterno" json:"apellido_paterno,omitempty"`
	ApellidoMaterno          *string    `db:"apellido_materno" json:"apellido_materno,omitempty"`
	Correo                   string     `db:"correo" json:"correo"`
	Username                 string     `db:"username" json:"username"`
	PasswordHash             string     `db:"password_hash" json:"-"`
	Activo                   bool       `db:"activo" json:"activo"`
	DebeCambiarPassword      bool       `db:"debe_cambiar_password" json:"debe_cambiar_password"`
	IntentosFallidos         int        `db:"intentos_fallidos" json:"intentos_fallidos"`
	BloqueadoHasta           *time.Time `db:"bloqueado_hasta" json:"bloqueado_hasta,omitempty"`
	UltimoAccesoAt           *time.Time `db:"ultimo_acceso_at" json:"ultimo_acceso_at,omitempty"`
	UltimoCambioPasswordAt   *time.Time `db:"ultimo_cambio_password_at" json:"ultimo_cambio_password_at,omitempty"`
	CreatedAt                time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt                time.Time  `db:"updated_at" json:"updated_at"`
}

type UserWithRole struct {
	User
	RolClave  string `db:"rol_clave" json:"rol_clave"`
	RolNombre string `db:"rol_nombre" json:"rol_nombre"`
	Ambito    string `db:"ambito" json:"ambito"`
}