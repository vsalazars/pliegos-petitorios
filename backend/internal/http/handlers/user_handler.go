package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/internal/services"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userRepo    *repository.UserRepository
	authService *services.AuthService
}

type CreateUserRequest struct {
	UnidadID            *int64  `json:"unidad_id"`
	RolID               int64   `json:"rol_id" binding:"required"`
	Nombre              string  `json:"nombre" binding:"required"`
	ApellidoPaterno     *string `json:"apellido_paterno"`
	ApellidoMaterno     *string `json:"apellido_materno"`
	Correo              string  `json:"correo" binding:"required"`
	Username            string  `json:"username" binding:"required"`
	Password            string  `json:"password" binding:"required"`
	DebeCambiarPassword *bool   `json:"debe_cambiar_password"`
}

type UpdateUserRequest struct {
	UnidadID         *int64  `json:"unidad_id"`
	RolID            int64   `json:"rol_id" binding:"required"`
	Nombre           string  `json:"nombre" binding:"required"`
	ApellidoPaterno  *string `json:"apellido_paterno"`
	ApellidoMaterno  *string `json:"apellido_materno"`
	Correo           string  `json:"correo" binding:"required"`
	Username         string  `json:"username" binding:"required"`
	Password         *string `json:"password"`
}

type UpdateCurrentUserRequest struct {
	Nombre           string  `json:"nombre" binding:"required"`
	ApellidoPaterno  *string `json:"apellido_paterno"`
	ApellidoMaterno  *string `json:"apellido_materno"`
	Correo           string  `json:"correo" binding:"required"`
	Username         string  `json:"username" binding:"required"`
	Password         *string `json:"password"`
}

type SetActivoUserRequest struct {
	Activo bool `json:"activo"`
}

func NewUserHandler(userRepo *repository.UserRepository, authService *services.AuthService) *UserHandler {
	return &UserHandler{
		userRepo:    userRepo,
		authService: authService,
	}
}

func (h *UserHandler) List(c *gin.Context) {
	items, err := h.userRepo.List(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando usuarios")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *UserHandler) GetByID(c *gin.Context) {
	id, ok := parseUserIDParam(c)
	if !ok {
		return
	}

	item, err := h.userRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "usuario no encontrado")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error obteniendo usuario")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *UserHandler) Create(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Nombre = strings.TrimSpace(req.Nombre)
	req.Correo = strings.TrimSpace(strings.ToLower(req.Correo))
	req.Username = strings.TrimSpace(req.Username)

	if req.Nombre == "" || req.Correo == "" || req.Username == "" || req.Password == "" || req.RolID <= 0 {
		response.Error(c, http.StatusBadRequest, "nombre, correo, username, password y rol_id son obligatorios")
		return
	}

	passwordHash, err := h.authService.HashPassword(req.Password)
	if err != nil {
		if errors.Is(err, services.ErrInvalidPassword) {
			response.Error(c, http.StatusBadRequest, "password inválido")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error procesando password")
		return
	}

	debeCambiarPassword := true
	if req.DebeCambiarPassword != nil {
		debeCambiarPassword = *req.DebeCambiarPassword
	}

	item, err := h.userRepo.Create(
		c.Request.Context(),
		req.UnidadID,
		req.RolID,
		req.Nombre,
		req.ApellidoPaterno,
		req.ApellidoMaterno,
		req.Correo,
		req.Username,
		passwordHash,
		debeCambiarPassword,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUserCorreoDuplicado) {
			response.Error(c, http.StatusConflict, "el correo ya existe")
			return
		}
		if errors.Is(err, repository.ErrUserUsernameDuplicado) {
			response.Error(c, http.StatusConflict, "el username ya existe")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error creando usuario")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
}

func (h *UserHandler) Update(c *gin.Context) {
	id, ok := parseUserIDParam(c)
	if !ok {
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Nombre = strings.TrimSpace(req.Nombre)
	req.Correo = strings.TrimSpace(strings.ToLower(req.Correo))
	req.Username = strings.TrimSpace(req.Username)

	if req.Nombre == "" || req.Correo == "" || req.Username == "" || req.RolID <= 0 {
		response.Error(c, http.StatusBadRequest, "nombre, correo, username y rol_id son obligatorios")
		return
	}

	var passwordHash *string
	if req.Password != nil && strings.TrimSpace(*req.Password) != "" {
		hashed, err := h.authService.HashPassword(strings.TrimSpace(*req.Password))
		if err != nil {
			if errors.Is(err, services.ErrInvalidPassword) {
				response.Error(c, http.StatusBadRequest, "password inválido")
				return
			}
			response.Error(c, http.StatusInternalServerError, "error procesando password")
			return
		}
		passwordHash = &hashed
	}

	item, err := h.userRepo.Update(
		c.Request.Context(),
		id,
		req.UnidadID,
		req.RolID,
		req.Nombre,
		req.ApellidoPaterno,
		req.ApellidoMaterno,
		req.Correo,
		req.Username,
		passwordHash,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "usuario no encontrado")
			return
		}
		if errors.Is(err, repository.ErrUserCorreoDuplicado) {
			response.Error(c, http.StatusConflict, "el correo ya existe")
			return
		}
		if errors.Is(err, repository.ErrUserUsernameDuplicado) {
			response.Error(c, http.StatusConflict, "el username ya existe")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error actualizando usuario")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *UserHandler) SetActivo(c *gin.Context) {
	id, ok := parseUserIDParam(c)
	if !ok {
		return
	}

	var req SetActivoUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	item, err := h.userRepo.SetActivo(c.Request.Context(), id, req.Activo)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "usuario no encontrado")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error actualizando estatus de usuario")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *UserHandler) UpdateCurrent(c *gin.Context) {
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

	currentUser, err := h.userRepo.GetByID(c.Request.Context(), claims.UserID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "usuario no encontrado")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error obteniendo usuario")
		return
	}

	var req UpdateCurrentUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Nombre = strings.TrimSpace(req.Nombre)
	req.Correo = strings.TrimSpace(strings.ToLower(req.Correo))
	req.Username = strings.TrimSpace(req.Username)

	if req.Nombre == "" || req.Correo == "" || req.Username == "" {
		response.Error(c, http.StatusBadRequest, "nombre, correo y username son obligatorios")
		return
	}

	var passwordHash *string
	if req.Password != nil && strings.TrimSpace(*req.Password) != "" {
		hashed, err := h.authService.HashPassword(strings.TrimSpace(*req.Password))
		if err != nil {
			if errors.Is(err, services.ErrInvalidPassword) {
				response.Error(c, http.StatusBadRequest, "password inválido")
				return
			}

			response.Error(c, http.StatusInternalServerError, "error procesando password")
			return
		}
		passwordHash = &hashed
	}

	item, err := h.userRepo.Update(
		c.Request.Context(),
		claims.UserID,
		currentUser.UnidadID,
		currentUser.RolID,
		req.Nombre,
		req.ApellidoPaterno,
		req.ApellidoMaterno,
		req.Correo,
		req.Username,
		passwordHash,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUserCorreoDuplicado) {
			response.Error(c, http.StatusConflict, "el correo ya existe")
			return
		}
		if errors.Is(err, repository.ErrUserUsernameDuplicado) {
			response.Error(c, http.StatusConflict, "el username ya existe")
			return
		}
		if errors.Is(err, repository.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, "usuario no encontrado")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error actualizando usuario")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func parseUserIDParam(c *gin.Context) (int64, bool) {
	idParam := strings.TrimSpace(c.Param("id"))
	if idParam == "" {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return 0, false
	}

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return 0, false
	}

	return id, true
}
