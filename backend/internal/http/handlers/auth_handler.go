package handlers

import (
	"errors"
	"net/http"

	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/internal/services"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *services.AuthService
	jwtService  *services.JWTService
	userRepo    *repository.UserRepository
}

type LoginRequest struct {
	Login    string `json:"login" binding:"required"`
	Password string `json:"password" binding:"required"`
}

func NewAuthHandler(
	authService *services.AuthService,
	jwtService *services.JWTService,
	userRepo *repository.UserRepository,
) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		jwtService:  jwtService,
		userRepo:    userRepo,
	}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	user, err := h.authService.Login(c.Request.Context(), services.LoginInput{
		Login:     req.Login,
		Password:  req.Password,
		IP:        c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	})
	if err != nil {
		switch {
		case errors.Is(err, services.ErrInvalidCredentials):
			response.Error(c, http.StatusUnauthorized, "credenciales inválidas")
			return
		case errors.Is(err, services.ErrUserInactive):
			response.Error(c, http.StatusForbidden, "usuario inactivo")
			return
		case errors.Is(err, services.ErrUserBlocked):
			response.Error(c, http.StatusLocked, "usuario bloqueado temporalmente")
			return
		default:
			response.Error(c, http.StatusInternalServerError, "error interno")
			return
		}
	}

	token, expiresAt, err := h.jwtService.GenerateToken(user)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error generando token")
		return
	}

	response.OK(c, gin.H{
		"token":      token,
		"expires_at": expiresAt,
		"user": gin.H{
			"id":                    user.ID,
			"unidad_id":             user.UnidadID,
			"unidad_clave":          user.UnidadClave,
			"unidad_nombre":         user.UnidadNombre,
			"rol_id":                user.RolID,
			"rol_clave":             user.RolClave,
			"rol_nombre":            user.RolNombre,
			"ambito":                user.Ambito,
			"nombre":                user.Nombre,
			"correo":                user.Correo,
			"username":              user.Username,
			"activo":                user.Activo,
			"debe_cambiar_password": user.DebeCambiarPassword,
		},
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	rawClaims, exists := c.Get(middleware.CurrentUserClaimsKey)
	if !exists {
		response.Error(c, http.StatusUnauthorized, "sesión no válida")
		return
	}

	claims, ok := rawClaims.(*services.UserClaims)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "claims inválidos")
		return
	}

	user, err := h.userRepo.GetByID(c.Request.Context(), claims.UserID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "usuario no encontrado")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error obteniendo usuario")
		return
	}

	response.OK(c, gin.H{
		"user": gin.H{
			"id":                    user.ID,
			"unidad_id":             user.UnidadID,
			"unidad_clave":          user.UnidadClave,
			"unidad_nombre":         user.UnidadNombre,
			"rol_id":                user.RolID,
			"rol_clave":             user.RolClave,
			"rol_nombre":            user.RolNombre,
			"ambito":                user.Ambito,
			"nombre":                user.Nombre,
			"apellido_paterno":      user.ApellidoPaterno,
			"apellido_materno":      user.ApellidoMaterno,
			"correo":                user.Correo,
			"username":              user.Username,
			"activo":                user.Activo,
			"debe_cambiar_password": user.DebeCambiarPassword,
		},
	})
}
