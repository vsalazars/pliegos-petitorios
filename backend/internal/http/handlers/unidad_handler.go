package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type UnidadHandler struct {
	unidadRepo *repository.UnidadRepository
}

type CreateUnidadRequest struct {
	Clave         string  `json:"clave" binding:"required"`
	Nombre        string  `json:"nombre" binding:"required"`
	CorreoOficial *string `json:"correo_oficial"`
	Telefono      *string `json:"telefono"`
	TitularNombre *string `json:"titular_nombre"`
}

type UpdateUnidadRequest struct {
	Clave         string  `json:"clave" binding:"required"`
	Nombre        string  `json:"nombre" binding:"required"`
	CorreoOficial *string `json:"correo_oficial"`
	Telefono      *string `json:"telefono"`
	TitularNombre *string `json:"titular_nombre"`
}

type SetActivoUnidadRequest struct {
	Activo bool `json:"activo"`
}

func NewUnidadHandler(unidadRepo *repository.UnidadRepository) *UnidadHandler {
	return &UnidadHandler{
		unidadRepo: unidadRepo,
	}
}

func (h *UnidadHandler) List(c *gin.Context) {
	unidades, err := h.unidadRepo.List(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando unidades académicas")
		return
	}

	response.OK(c, gin.H{
		"items": unidades,
		"total": len(unidades),
	})
}

func (h *UnidadHandler) GetByID(c *gin.Context) {
	idParam := strings.TrimSpace(c.Param("id"))
	if idParam == "" {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return
	}

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return
	}

	item, err := h.unidadRepo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, repository.ErrUnidadNoEncontrada) {
			response.Error(c, http.StatusNotFound, "unidad académica no encontrada")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error obteniendo unidad académica")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *UnidadHandler) Create(c *gin.Context) {
	var req CreateUnidadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Clave = strings.ToUpper(strings.TrimSpace(req.Clave))
	req.Nombre = strings.TrimSpace(req.Nombre)

	if req.Clave == "" || req.Nombre == "" {
		response.Error(c, http.StatusBadRequest, "clave y nombre son obligatorios")
		return
	}

	item, err := h.unidadRepo.Create(
		c.Request.Context(),
		req.Clave,
		req.Nombre,
		req.CorreoOficial,
		req.Telefono,
		req.TitularNombre,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUnidadClaveDuplicada) {
			response.Error(c, http.StatusConflict, "la clave de la unidad ya existe")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error creando unidad académica")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
}

func (h *UnidadHandler) Update(c *gin.Context) {
	idParam := strings.TrimSpace(c.Param("id"))
	if idParam == "" {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return
	}

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return
	}

	var req UpdateUnidadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Clave = strings.ToUpper(strings.TrimSpace(req.Clave))
	req.Nombre = strings.TrimSpace(req.Nombre)

	if req.Clave == "" || req.Nombre == "" {
		response.Error(c, http.StatusBadRequest, "clave y nombre son obligatorios")
		return
	}

	item, err := h.unidadRepo.Update(
		c.Request.Context(),
		id,
		req.Clave,
		req.Nombre,
		req.CorreoOficial,
		req.Telefono,
		req.TitularNombre,
	)
	if err != nil {
		if errors.Is(err, repository.ErrUnidadNoEncontrada) {
			response.Error(c, http.StatusNotFound, "unidad académica no encontrada")
			return
		}

		if errors.Is(err, repository.ErrUnidadClaveDuplicada) {
			response.Error(c, http.StatusConflict, "la clave de la unidad ya existe")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error actualizando unidad académica")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *UnidadHandler) SetActivo(c *gin.Context) {
	idParam := strings.TrimSpace(c.Param("id"))
	if idParam == "" {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return
	}

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "id inválido")
		return
	}

	var req SetActivoUnidadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	item, err := h.unidadRepo.SetActivo(c.Request.Context(), id, req.Activo)
	if err != nil {
		if errors.Is(err, repository.ErrUnidadNoEncontrada) {
			response.Error(c, http.StatusNotFound, "unidad académica no encontrada")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error actualizando estatus de unidad académica")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}