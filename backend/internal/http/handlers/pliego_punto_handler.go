package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type PliegoPuntoHandler struct {
	pliegoPuntoRepo *repository.PliegoPuntoRepository
}

type CreatePliegoPuntoRequest struct {
	NumeroPunto          int     `json:"numero_punto" binding:"required"`
	TextoOriginalOCR     *string `json:"texto_original_ocr"`
	TextoFinal           string  `json:"texto_final" binding:"required"`
	CategoriaID          *int64  `json:"categoria_id"`
	PrioridadID          int64   `json:"prioridad_id" binding:"required"`
	EstadoPuntoID        int64   `json:"estado_punto_id" binding:"required"`
	ResponsableUsuarioID *int64  `json:"responsable_usuario_id"`
	FechaCompromiso      *string `json:"fecha_compromiso"`
	OrigenCaptura        string  `json:"origen_captura" binding:"required"`
	RequiereValidacion   bool    `json:"requiere_validacion"`
	Observaciones        *string `json:"observaciones"`
}

func NewPliegoPuntoHandler(pliegoPuntoRepo *repository.PliegoPuntoRepository) *PliegoPuntoHandler {
	return &PliegoPuntoHandler{
		pliegoPuntoRepo: pliegoPuntoRepo,
	}
}

func (h *PliegoPuntoHandler) ListByPliegoID(c *gin.Context) {
	
	pliegoID, ok := parsePliegoIDParamFromPunto(c)
	if !ok {
		return
	}

	items, err := h.pliegoPuntoRepo.ListByPliegoID(c.Request.Context(), pliegoID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando puntos del pliego")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PliegoPuntoHandler) Create(c *gin.Context) {
	pliegoID, ok := parsePliegoIDParamFromPunto(c)
	
	if !ok {
		return
	}

	var req CreatePliegoPuntoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.TextoFinal = strings.TrimSpace(req.TextoFinal)
	req.OrigenCaptura = strings.TrimSpace(strings.ToLower(req.OrigenCaptura))

	if req.NumeroPunto <= 0 || req.TextoFinal == "" || req.PrioridadID <= 0 || req.EstadoPuntoID <= 0 || req.OrigenCaptura == "" {
		response.Error(c, http.StatusBadRequest, "numero_punto, texto_final, prioridad_id, estado_punto_id y origen_captura son obligatorios")
		return
	}

	if req.OrigenCaptura != "ocr" && req.OrigenCaptura != "manual" {
		response.Error(c, http.StatusBadRequest, "origen_captura inválido, usa 'ocr' o 'manual'")
		return
	}

	var fechaCompromiso *time.Time
	if req.FechaCompromiso != nil && strings.TrimSpace(*req.FechaCompromiso) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.FechaCompromiso))
		if err != nil {
			response.Error(c, http.StatusBadRequest, "fecha_compromiso inválida, usa formato YYYY-MM-DD")
			return
		}
		fechaCompromiso = &parsed
	}

	item, err := h.pliegoPuntoRepo.Create(
		c.Request.Context(),
		pliegoID,
		req.NumeroPunto,
		req.TextoOriginalOCR,
		req.TextoFinal,
		req.CategoriaID,
		req.PrioridadID,
		req.EstadoPuntoID,
		req.ResponsableUsuarioID,
		fechaCompromiso,
		req.OrigenCaptura,
		req.RequiereValidacion,
		req.Observaciones,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPliegoPuntoNumeroDuplicado) {
			response.Error(c, http.StatusConflict, "el número de punto ya existe en el pliego")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error creando punto del pliego")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
}

func parsePliegoIDParamFromPunto(c *gin.Context) (int64, bool) {
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