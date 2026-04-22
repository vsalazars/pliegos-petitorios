package services

import (
	"fmt"
	"strconv"
	"time"

	"pliegos-des/backend/internal/config"
	"pliegos-des/backend/internal/domain"

	"github.com/golang-jwt/jwt/v5"
)

type JWTService struct {
	secret      []byte
	expiresIn   time.Duration
}

type UserClaims struct {
	UserID               int64  `json:"user_id"`
	UnidadID             *int64 `json:"unidad_id,omitempty"`
	RolID                int64  `json:"rol_id"`
	RolClave             string `json:"rol_clave"`
	Ambito               string `json:"ambito"`
	Username             string `json:"username"`
	Correo               string `json:"correo"`
	DebeCambiarPassword  bool   `json:"debe_cambiar_password"`
	jwt.RegisteredClaims
}

func NewJWTService(cfg config.Config) *JWTService {
	hours, err := strconv.Atoi(cfg.JTTExpiresHours)
	if err != nil || hours <= 0 {
		hours = 12
	}

	return &JWTService{
		secret:    []byte(cfg.JWTSecret),
		expiresIn: time.Duration(hours) * time.Hour,
	}
}

func (s *JWTService) GenerateToken(user *domain.UserWithRole) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.expiresIn)

	claims := UserClaims{
		UserID:              user.ID,
		UnidadID:            user.UnidadID,
		RolID:               user.RolID,
		RolClave:            user.RolClave,
		Ambito:              user.Ambito,
		Username:            user.Username,
		Correo:              user.Correo,
		DebeCambiarPassword: user.DebeCambiarPassword,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", user.ID),
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	signedToken, err := token.SignedString(s.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("firmar jwt: %w", err)
	}

	return signedToken, expiresAt, nil
}

func (s *JWTService) ParseToken(tokenString string) (*UserClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &UserClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, fmt.Errorf("método de firma inválido")
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("parsear jwt: %w", err)
	}

	claims, ok := token.Claims.(*UserClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("token inválido")
	}

	return claims, nil
}