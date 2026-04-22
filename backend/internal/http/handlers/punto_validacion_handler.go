package handlers

import (
	"errors"
	"net/http"
	"strings"

	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type PuntoValidacionHandler struct {
	validacionRepo *repository.PuntoValidacionRepository
	puntoRepo      *repository.PliegoPuntoRepository
}

func NewPuntoValidacionHandler(
	validacionRepo *repository.PuntoValidacionRepository,
	puntoRepo *repository.PliegoPuntoRepository,
) *PuntoValidacionHandler {
	return &PuntoValidacionHandler{
		validacionRepo: validacionRepo,
		puntoRepo:      puntoRepo,
	}
}

func (h *PuntoValidacionHandler) ListByPuntoID(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	items, err := h.validacionRepo.ListByPuntoIDAndUnidadID(c.Request.Context(), puntoID, unidadID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando validaciones del punto")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PuntoValidacionHandler) GetVigenteByPuntoID(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	item, err := h.validacionRepo.GetVigenteByPuntoIDAndUnidadID(c.Request.Context(), puntoID, unidadID)
	if err != nil {
		if errors.Is(err, repository.ErrPuntoValidacionNotFound) {
			response.Error(c, http.StatusNotFound, "validación vigente no encontrada")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error obteniendo validación vigente")
		return
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *PuntoValidacionHandler) EnviarAValidacion(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	claims, ok := middleware.GetCurrentUserClaims(c)
	if !ok {
		return
	}

	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	var req struct {
		Comentario *string `json:"comentario"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	if req.Comentario != nil {
		comentario := strings.TrimSpace(*req.Comentario)
		req.Comentario = &comentario
	}

	usuarioID := claims.UserID
	err := h.puntoRepo.EnviarAValidacionByUnidadID(
		c.Request.Context(),
		unidadID,
		puntoID,
		&usuarioID,
		req.Comentario,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error enviando punto a validación")
		return
	}

	response.OK(c, gin.H{
		"ok": true,
	})
}
