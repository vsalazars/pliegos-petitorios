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

func (h *PuntoValidacionHandler) ListByPuntoIDAdmin(c *gin.Context) {
	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	items, err := h.validacionRepo.ListByPuntoID(c.Request.Context(), puntoID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando validaciones del punto")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PuntoValidacionHandler) CreateAdmin(c *gin.Context) {
	claims, ok := middleware.GetCurrentUserClaims(c)
	if !ok {
		return
	}

	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	var req struct {
		Resultado       string  `json:"resultado" binding:"required"`
		MotivoRechazoID *int64  `json:"motivo_rechazo_id"`
		Comentario      *string `json:"comentario"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Resultado = strings.TrimSpace(strings.ToLower(req.Resultado))
	if req.Resultado == "" {
		response.Error(c, http.StatusBadRequest, "resultado obligatorio")
		return
	}

	switch req.Resultado {
	case "aprobado", "rechazado", "requiere_informacion":
	default:
		response.Error(c, http.StatusBadRequest, "resultado no válido")
		return
	}

	if req.Resultado == "rechazado" && (req.MotivoRechazoID == nil || *req.MotivoRechazoID <= 0) {
		response.Error(c, http.StatusBadRequest, "motivo_rechazo_id obligatorio cuando el resultado es rechazado")
		return
	}

	if req.Comentario != nil {
		value := strings.TrimSpace(*req.Comentario)
		req.Comentario = &value
	}

	usuarioID := claims.UserID
	item, err := h.validacionRepo.Create(
		c.Request.Context(),
		puntoID,
		&usuarioID,
		req.Resultado,
		req.MotivoRechazoID,
		req.Comentario,
		true,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error creando validación")
		return
	}

	if err := h.puntoRepo.AplicarValidacionDES(
		c.Request.Context(),
		puntoID,
		req.Resultado,
		req.Comentario,
	); err != nil {
		response.Error(c, http.StatusInternalServerError, "error aplicando validación al punto")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
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

func (h *PuntoValidacionHandler) ResponderValidacion(c *gin.Context) {
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

	vigente, err := h.validacionRepo.GetVigenteByPuntoIDAndUnidadID(c.Request.Context(), puntoID, unidadID)
	if err != nil {
		if errors.Is(err, repository.ErrPuntoValidacionNotFound) {
			response.Error(c, http.StatusNotFound, "validación vigente no encontrada")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error obteniendo validación vigente")
		return
	}

	if vigente.Resultado == "aprobado" {
		response.Error(c, http.StatusBadRequest, "no se puede responder una validación aprobada")
		return
	}

	usuarioID := claims.UserID
	err = h.puntoRepo.ResponderValidacionByUnidadID(
		c.Request.Context(),
		unidadID,
		puntoID,
		&usuarioID,
		req.Comentario,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error registrando respuesta de la unidad")
		return
	}

	response.OK(c, gin.H{
		"ok": true,
	})
}
