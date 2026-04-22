package services

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"pliegos-des/backend/internal/config"
	"pliegos-des/backend/internal/domain"
	"pliegos-des/backend/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCredentials = errors.New("credenciales inválidas")
	ErrUserInactive       = errors.New("usuario inactivo")
	ErrUserBlocked        = errors.New("usuario bloqueado temporalmente")
	ErrInvalidPassword    = errors.New("password inválido")
)

type AuthService struct {
	userRepo          *repository.UserRepository
	maxFailedAttempts int
	lockDuration      time.Duration
}

type LoginInput struct {
	Login     string
	Password  string
	IP        string
	UserAgent string
}

func NewAuthService(cfg config.Config, userRepo *repository.UserRepository) *AuthService {
	maxAttempts, err := strconv.Atoi(cfg.AuthMaxAttempts)
	if err != nil || maxAttempts <= 0 {
		maxAttempts = 5
	}

	lockMinutes, err := strconv.Atoi(cfg.AuthLockMinutes)
	if err != nil || lockMinutes <= 0 {
		lockMinutes = 15
	}

	return &AuthService{
		userRepo:          userRepo,
		maxFailedAttempts: maxAttempts,
		lockDuration:      time.Duration(lockMinutes) * time.Minute,
	}
}

func (s *AuthService) HashPassword(password string) (string, error) {
	if password == "" {
		return "", ErrInvalidPassword
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("generar hash de password: %w", err)
	}

	return string(hash), nil
}

func (s *AuthService) Login(ctx context.Context, input LoginInput) (*domain.UserWithRole, error) {
	user, err := s.userRepo.FindByUsernameOrEmail(ctx, input.Login)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			_ = s.userRepo.RegisterLoginAttempt(
				ctx,
				nil,
				input.Login,
				input.Login,
				input.IP,
				input.UserAgent,
				false,
				"usuario no encontrado",
			)
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("buscar usuario: %w", err)
	}

	if !user.Activo {
		_ = s.userRepo.RegisterLoginAttempt(
			ctx,
			&user.ID,
			user.Username,
			user.Correo,
			input.IP,
			input.UserAgent,
			false,
			"usuario inactivo",
		)
		return nil, ErrUserInactive
	}

	if user.BloqueadoHasta != nil && user.BloqueadoHasta.After(time.Now()) {
		_ = s.userRepo.RegisterLoginAttempt(
			ctx,
			&user.ID,
			user.Username,
			user.Correo,
			input.IP,
			input.UserAgent,
			false,
			"usuario bloqueado temporalmente",
		)
		return nil, ErrUserBlocked
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		_ = s.userRepo.IncrementFailedAttempts(ctx, user.ID)

		attempts, attemptsErr := s.userRepo.GetFailedAttempts(ctx, user.ID)
		if attemptsErr == nil && attempts >= s.maxFailedAttempts {
			lockUntil := time.Now().Add(s.lockDuration)
			_ = s.userRepo.BlockUserUntil(ctx, user.ID, lockUntil)
		}

		_ = s.userRepo.RegisterLoginAttempt(
			ctx,
			&user.ID,
			user.Username,
			user.Correo,
			input.IP,
			input.UserAgent,
			false,
			"contraseña incorrecta",
		)
		return nil, ErrInvalidCredentials
	}

	if err := s.userRepo.ResetFailedAttempts(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("resetear intentos fallidos: %w", err)
	}

	if err := s.userRepo.ClearLockInfo(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("limpiar bloqueo: %w", err)
	}

	if err := s.userRepo.UpdateLastAccess(ctx, user.ID); err != nil {
		return nil, fmt.Errorf("actualizar último acceso: %w", err)
	}

	_ = s.userRepo.RegisterLoginAttempt(
		ctx,
		&user.ID,
		user.Username,
		user.Correo,
		input.IP,
		input.UserAgent,
		true,
		"login exitoso",
	)

	user.IntentosFallidos = 0
	now := time.Now()
	user.UltimoAccesoAt = &now
	user.BloqueadoHasta = nil

	return user, nil
}