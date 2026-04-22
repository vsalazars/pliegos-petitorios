package domain

import "time"

type Archivo struct {
	ID                 int64     `db:"id" json:"id"`
	NombreOriginal     string    `db:"nombre_original" json:"nombre_original"`
	NombreStorage      string    `db:"nombre_storage" json:"nombre_storage"`
	RutaStorage        string    `db:"ruta_storage" json:"ruta_storage"`
	MimeType           string    `db:"mime_type" json:"mime_type"`
	Extension          *string   `db:"extension" json:"extension,omitempty"`
	TamanoBytes        int64     `db:"tamano_bytes" json:"tamano_bytes"`
	HashSHA256         *string   `db:"hash_sha256" json:"hash_sha256,omitempty"`
	SubidoPorUsuarioID *int64    `db:"subido_por_usuario_id" json:"subido_por_usuario_id,omitempty"`
	CreatedAt          time.Time `db:"created_at" json:"created_at"`
}
