package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type PuntoSeguimientoHandler struct {
	repo *repository.PuntoSeguimientoRepository
}

func NewPuntoSeguimientoHandler(repo *repository.PuntoSeguimientoRepository) *PuntoSeguimientoHandler {
	return &PuntoSeguimientoHandler{repo: repo}
}

func (h *PuntoSeguimientoHandler) ListByPuntoIDAdmin(c *gin.Context) {
	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	items, err := h.repo.ListByPuntoID(c.Request.Context(), puntoID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando seguimientos del punto")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PuntoSeguimientoHandler) ListByPuntoID(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	items, err := h.repo.ListByPuntoIDAndUnidadID(c.Request.Context(), puntoID, unidadID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando seguimientos del punto")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PuntoSeguimientoHandler) CreateComentario(c *gin.Context) {
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
		Comentario string `json:"comentario" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Comentario = strings.TrimSpace(req.Comentario)
	if req.Comentario == "" {
		response.Error(c, http.StatusBadRequest, "comentario obligatorio")
		return
	}

	usuarioID := claims.UserID
	item, err := h.repo.CreateComentarioByUnidadID(
		c.Request.Context(),
		unidadID,
		puntoID,
		&usuarioID,
		req.Comentario,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPuntoSeguimientoNotFound) {
			response.Error(c, http.StatusNotFound, "punto no encontrado")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error creando comentario de seguimiento")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
}

func currentUnidadIDFromClaims(c *gin.Context) (int64, bool) {
	claims, ok := middleware.GetCurrentUserClaims(c)
	if !ok {
		return 0, false
	}
	if claims.UnidadID == nil || *claims.UnidadID <= 0 {
		response.Error(c, http.StatusForbidden, "usuario sin unidad asignada")
		return 0, false
	}
	return *claims.UnidadID, true
}

func parsePuntoIDParam(c *gin.Context) (int64, bool) {
	idParam := strings.TrimSpace(c.Param("punto_id"))
	if idParam == "" {
		response.Error(c, http.StatusBadRequest, "punto_id inválido")
		return 0, false
	}

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "punto_id inválido")
		return 0, false
	}

	return id, true
}
