package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"pliegos-des/backend/internal/domain"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrUserNotFound = errors.New("usuario no encontrado")
var ErrUserCorreoDuplicado = errors.New("el correo ya existe")
var ErrUserUsernameDuplicado = errors.New("el username ya existe")

type UserRepository struct {
	pool *pgxpool.Pool
}

func NewUserRepository(pool *pgxpool.Pool) *UserRepository {
	return &UserRepository{
		pool: pool,
	}
}

func (r *UserRepository) List(ctx context.Context) ([]domain.UserWithRole, error) {
	const query = `
		SELECT
			u.id,
			u.unidad_id,
			u.rol_id,
			u.nombre,
			u.apellido_paterno,
			u.apellido_materno,
			u.correo,
			u.username,
			u.password_hash,
			u.activo,
			u.debe_cambiar_password,
			u.intentos_fallidos,
			u.bloqueado_hasta,
			u.ultimo_acceso_at,
			u.ultimo_cambio_password_at,
			u.created_at,
			u.updated_at,
			r.clave AS rol_clave,
			r.nombre AS rol_nombre,
			r.ambito,
			ua.clave AS unidad_clave,
			ua.nombre AS unidad_nombre
		FROM usuarios u
		INNER JOIN roles r ON r.id = u.rol_id
		LEFT JOIN unidades_academicas ua ON ua.id = u.unidad_id
		ORDER BY u.nombre ASC, u.apellido_paterno ASC, u.apellido_materno ASC, u.id ASC;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("listar usuarios: %w", err)
	}
	defer rows.Close()

	items := make([]domain.UserWithRole, 0)

	for rows.Next() {
		var user domain.UserWithRole

		if err := rows.Scan(
			&user.ID,
			&user.UnidadID,
			&user.RolID,
			&user.Nombre,
			&user.ApellidoPaterno,
			&user.ApellidoMaterno,
			&user.Correo,
			&user.Username,
			&user.PasswordHash,
			&user.Activo,
			&user.DebeCambiarPassword,
			&user.IntentosFallidos,
			&user.BloqueadoHasta,
			&user.UltimoAccesoAt,
			&user.UltimoCambioPasswordAt,
			&user.CreatedAt,
			&user.UpdatedAt,
			&user.RolClave,
			&user.RolNombre,
			&user.Ambito,
			&user.UnidadClave,
			&user.UnidadNombre,
		); err != nil {
			return nil, fmt.Errorf("scan usuario: %w", err)
		}

		items = append(items, user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterar usuarios: %w", err)
	}

	return items, nil
}

func (r *UserRepository) GetByID(ctx context.Context, id int64) (*domain.UserWithRole, error) {
	const query = `
		SELECT
			u.id,
			u.unidad_id,
			u.rol_id,
			u.nombre,
			u.apellido_paterno,
			u.apellido_materno,
			u.correo,
			u.username,
			u.password_hash,
			u.activo,
			u.debe_cambiar_password,
			u.intentos_fallidos,
			u.bloqueado_hasta,
			u.ultimo_acceso_at,
			u.ultimo_cambio_password_at,
			u.created_at,
			u.updated_at,
			r.clave AS rol_clave,
			r.nombre AS rol_nombre,
			r.ambito,
			ua.clave AS unidad_clave,
			ua.nombre AS unidad_nombre
		FROM usuarios u
		INNER JOIN roles r ON r.id = u.rol_id
		LEFT JOIN unidades_academicas ua ON ua.id = u.unidad_id
		WHERE u.id = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var user domain.UserWithRole

	err := r.pool.QueryRow(ctx, query, id).Scan(
		&user.ID,
		&user.UnidadID,
		&user.RolID,
		&user.Nombre,
		&user.ApellidoPaterno,
		&user.ApellidoMaterno,
		&user.Correo,
		&user.Username,
		&user.PasswordHash,
		&user.Activo,
		&user.DebeCambiarPassword,
		&user.IntentosFallidos,
		&user.BloqueadoHasta,
		&user.UltimoAccesoAt,
		&user.UltimoCambioPasswordAt,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.RolClave,
		&user.RolNombre,
		&user.Ambito,
		&user.UnidadClave,
		&user.UnidadNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("obtener usuario por id: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) Create(
	ctx context.Context,
	unidadID *int64,
	rolID int64,
	nombre string,
	apellidoPaterno *string,
	apellidoMaterno *string,
	correo string,
	username string,
	passwordHash string,
	debeCambiarPassword bool,
) (*domain.UserWithRole, error) {
	const query = `
		INSERT INTO usuarios (
			unidad_id,
			rol_id,
			nombre,
			apellido_paterno,
			apellido_materno,
			correo,
			username,
			password_hash,
			activo,
			debe_cambiar_password,
			intentos_fallidos,
			bloqueado_hasta,
			ultimo_acceso_at,
			ultimo_cambio_password_at
		)
		VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8,
			TRUE, $9, 0, NULL, NULL, NULL
		)
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var userID int64

	err := r.pool.QueryRow(
		ctx,
		query,
		unidadID,
		rolID,
		nombre,
		apellidoPaterno,
		apellidoMaterno,
		correo,
		username,
		passwordHash,
		debeCambiarPassword,
	).Scan(&userID)
	if err != nil {
		if repoErr := mapUserPgError(err); repoErr != nil {
			return nil, repoErr
		}
		return nil, fmt.Errorf("crear usuario: %w", err)
	}

	created, err := r.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return created, nil
}

func (r *UserRepository) Update(
	ctx context.Context,
	id int64,
	unidadID *int64,
	rolID int64,
	nombre string,
	apellidoPaterno *string,
	apellidoMaterno *string,
	correo string,
	username string,
	passwordHash *string,
) (*domain.UserWithRole, error) {
	const query = `
		UPDATE usuarios
		SET
			unidad_id = $2,
			rol_id = $3,
			nombre = $4,
			apellido_paterno = $5,
			apellido_materno = $6,
			correo = $7,
			username = $8,
			password_hash = COALESCE($9, password_hash),
			debe_cambiar_password = CASE
				WHEN $9 IS NULL THEN debe_cambiar_password
				ELSE TRUE
			END
		WHERE id = $1
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var userID int64

	err := r.pool.QueryRow(
		ctx,
		query,
		id,
		unidadID,
		rolID,
		nombre,
		apellidoPaterno,
		apellidoMaterno,
		correo,
		username,
		passwordHash,
	).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		if repoErr := mapUserPgError(err); repoErr != nil {
			return nil, repoErr
		}
		return nil, fmt.Errorf("actualizar usuario: %w", err)
	}

	updated, err := r.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return updated, nil
}

func (r *UserRepository) SetActivo(ctx context.Context, id int64, activo bool) (*domain.UserWithRole, error) {
	const query = `
		UPDATE usuarios
		SET activo = $2
		WHERE id = $1
		RETURNING id;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var userID int64

	err := r.pool.QueryRow(ctx, query, id, activo).Scan(&userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		return nil, fmt.Errorf("actualizar activo de usuario: %w", err)
	}

	item, err := r.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (r *UserRepository) FindByUsernameOrEmail(ctx context.Context, login string) (*domain.UserWithRole, error) {
	const query = `
		SELECT
			u.id,
			u.unidad_id,
			u.rol_id,
			u.nombre,
			u.apellido_paterno,
			u.apellido_materno,
			u.correo,
			u.username,
			u.password_hash,
			u.activo,
			u.debe_cambiar_password,
			u.intentos_fallidos,
			u.bloqueado_hasta,
			u.ultimo_acceso_at,
			u.ultimo_cambio_password_at,
			u.created_at,
			u.updated_at,
			r.clave AS rol_clave,
			r.nombre AS rol_nombre,
			r.ambito,
			ua.clave AS unidad_clave,
			ua.nombre AS unidad_nombre
		FROM usuarios u
		INNER JOIN roles r ON r.id = u.rol_id
		LEFT JOIN unidades_academicas ua ON ua.id = u.unidad_id
		WHERE u.username = $1 OR u.correo = $1
		LIMIT 1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var user domain.UserWithRole

	err := r.pool.QueryRow(ctx, query, login).Scan(
		&user.ID,
		&user.UnidadID,
		&user.RolID,
		&user.Nombre,
		&user.ApellidoPaterno,
		&user.ApellidoMaterno,
		&user.Correo,
		&user.Username,
		&user.PasswordHash,
		&user.Activo,
		&user.DebeCambiarPassword,
		&user.IntentosFallidos,
		&user.BloqueadoHasta,
		&user.UltimoAccesoAt,
		&user.UltimoCambioPasswordAt,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.RolClave,
		&user.RolNombre,
		&user.Ambito,
		&user.UnidadClave,
		&user.UnidadNombre,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, ErrUserNotFound
		}
		if errors.Is(err, context.DeadlineExceeded) {
			return nil, fmt.Errorf("timeout consultando usuario: %w", err)
		}
		return nil, fmt.Errorf("consultar usuario: %w", err)
	}

	return &user, nil
}

func (r *UserRepository) IncrementFailedAttempts(ctx context.Context, userID int64) error {
	const query = `
		UPDATE usuarios
		SET intentos_fallidos = intentos_fallidos + 1
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd, err := r.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("incrementar intentos fallidos: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) ResetFailedAttempts(ctx context.Context, userID int64) error {
	const query = `
		UPDATE usuarios
		SET intentos_fallidos = 0
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd, err := r.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("resetear intentos fallidos: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) UpdateLastAccess(ctx context.Context, userID int64) error {
	const query = `
		UPDATE usuarios
		SET ultimo_acceso_at = NOW()
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd, err := r.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("actualizar último acceso: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) RegisterLoginAttempt(
	ctx context.Context,
	userID *int64,
	usernameAttempted string,
	emailAttempted string,
	ip string,
	userAgent string,
	success bool,
	reason string,
) error {
	const query = `
		INSERT INTO login_intentos (
			usuario_id,
			username_intentado,
			correo_intentado,
			ip,
			user_agent,
			exitoso,
			motivo
		)
		VALUES ($1, $2, $3, NULLIF($4, '')::inet, $5, $6, $7);
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	_, err := r.pool.Exec(
		ctx,
		query,
		userID,
		usernameAttempted,
		emailAttempted,
		ip,
		userAgent,
		success,
		reason,
	)
	if err != nil {
		return fmt.Errorf("registrar intento de login: %w", err)
	}

	return nil
}

func (r *UserRepository) ClearLockInfo(ctx context.Context, userID int64) error {
	const query = `
		UPDATE usuarios
		SET bloqueado_hasta = NULL
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd, err := r.pool.Exec(ctx, query, userID)
	if err != nil {
		return fmt.Errorf("limpiar bloqueo de usuario: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) BlockUserUntil(ctx context.Context, userID int64, until time.Time) error {
	const query = `
		UPDATE usuarios
		SET bloqueado_hasta = $2
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	cmd, err := r.pool.Exec(ctx, query, userID, until)
	if err != nil {
		return fmt.Errorf("bloquear usuario: %w", err)
	}
	if cmd.RowsAffected() == 0 {
		return ErrUserNotFound
	}

	return nil
}

func (r *UserRepository) GetFailedAttempts(ctx context.Context, userID int64) (int, error) {
	const query = `
		SELECT intentos_fallidos
		FROM usuarios
		WHERE id = $1;
	`

	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var attempts int
	err := r.pool.QueryRow(ctx, query, userID).Scan(&attempts)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, ErrUserNotFound
		}
		return 0, fmt.Errorf("consultar intentos fallidos: %w", err)
	}

	return attempts, nil
}

func mapUserPgError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return nil
	}

	if pgErr.Code != "23505" {
		return nil
	}

	constraint := strings.ToLower(pgErr.ConstraintName)
	message := strings.ToLower(pgErr.Message)
	detail := strings.ToLower(pgErr.Detail)

	switch {
	case strings.Contains(constraint, "correo"):
		return ErrUserCorreoDuplicado
	case strings.Contains(constraint, "username"):
		return ErrUserUsernameDuplicado
	case strings.Contains(message, "correo"):
		return ErrUserCorreoDuplicado
	case strings.Contains(message, "username"):
		return ErrUserUsernameDuplicado
	case strings.Contains(detail, "correo"):
		return ErrUserCorreoDuplicado
	case strings.Contains(detail, "username"):
		return ErrUserUsernameDuplicado
	}

	return fmt.Errorf("violación de unicidad en usuarios: %w", err)
}
