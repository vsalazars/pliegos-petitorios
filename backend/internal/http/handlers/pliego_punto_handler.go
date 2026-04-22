package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pliegos-des/backend/internal/domain"
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

func (h *PliegoPuntoHandler) ListAll(c *gin.Context) {
	filters := repository.ListPuntosFilters{
		Query: strings.TrimSpace(c.Query("q")),
	}

	if unidadID, ok := parseOptionalInt64Query(c, "unidad_id"); ok {
		filters.UnidadID = unidadID
	}
	if estadoPuntoID, ok := parseOptionalInt64Query(c, "estado_punto_id"); ok {
		filters.EstadoPuntoID = estadoPuntoID
	}
	if prioridadID, ok := parseOptionalInt64Query(c, "prioridad_id"); ok {
		filters.PrioridadID = prioridadID
	}
	if categoriaID, ok := parseOptionalInt64Query(c, "categoria_id"); ok {
		filters.CategoriaID = categoriaID
	}
	if requiereValidacion, ok := parseOptionalBoolQuery(c, "requiere_validacion"); ok {
		filters.RequiereValidacion = requiereValidacion
	}

	items, err := h.pliegoPuntoRepo.ListAll(c.Request.Context(), filters)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando puntos")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PliegoPuntoHandler) ListByPliegoID(c *gin.Context) {

	pliegoID, ok := parsePliegoIDParamFromPunto(c)
	if !ok {
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}

	var (
		items []domain.PliegoPuntoWithCatalogos
		err   error
	)

	if scoped {
		items, err = h.pliegoPuntoRepo.ListByPliegoIDAndUnidadID(c.Request.Context(), pliegoID, *unidadID)
	} else {
		items, err = h.pliegoPuntoRepo.ListByPliegoID(c.Request.Context(), pliegoID)
	}
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

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
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

	var (
		item *domain.PliegoPuntoWithCatalogos
		err  error
	)
	if scoped {
		item, err = h.pliegoPuntoRepo.CreateByUnidadID(
			c.Request.Context(),
			*unidadID,
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
	} else {
		item, err = h.pliegoPuntoRepo.Create(
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
	}
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

func (h *PliegoPuntoHandler) UpdateTextoFinal(c *gin.Context) {
	idParam := c.Param("punto_id")

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "punto_id inválido")
		return
	}

	var body struct {
		TextoFinal string `json:"texto_final" binding:"required"`
	}

	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	body.TextoFinal = strings.TrimSpace(body.TextoFinal)
	if body.TextoFinal == "" {
		response.Error(c, http.StatusBadRequest, "texto_final vacío")
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}

	if scoped {
		err = h.pliegoPuntoRepo.UpdateTextoFinalByUnidadID(
			c.Request.Context(),
			*unidadID,
			id,
			body.TextoFinal,
		)
	} else {
		err = h.pliegoPuntoRepo.UpdateTextoFinal(
			c.Request.Context(),
			id,
			body.TextoFinal,
		)
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error actualizando punto")
		return
	}

	response.OK(c, gin.H{
		"ok": true,
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

func parseOptionalInt64Query(c *gin.Context, key string) (*int64, bool) {
	raw := strings.TrimSpace(c.Query(key))
	if raw == "" {
		return nil, false
	}

	value, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || value <= 0 {
		response.Error(c, http.StatusBadRequest, key+" inválido")
		return nil, false
	}

	return &value, true
}

func parseOptionalBoolQuery(c *gin.Context, key string) (*bool, bool) {
	raw := strings.TrimSpace(c.Query(key))
	if raw == "" {
		return nil, false
	}

	switch strings.ToLower(raw) {
	case "true", "1", "si", "sí", "yes":
		value := true
		return &value, true
	case "false", "0", "no":
		value := false
		return &value, true
	default:
		response.Error(c, http.StatusBadRequest, key+" inválido")
		return nil, false
	}
}

func (h *PliegoPuntoHandler) UpdateCompleto(c *gin.Context) {
	idParam := c.Param("punto_id")

	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil || id <= 0 {
		response.Error(c, http.StatusBadRequest, "punto_id inválido")
		return
	}

	var req struct {
		TextoFinal           string  `json:"texto_final" binding:"required"`
		PrioridadID          int64   `json:"prioridad_id" binding:"required"`
		EstadoPuntoID        int64   `json:"estado_punto_id" binding:"required"`
		CategoriaID          *int64  `json:"categoria_id"`
		ResponsableUsuarioID *int64  `json:"responsable_usuario_id"`
		FechaCompromiso      *string `json:"fecha_compromiso"`
		Observaciones        *string `json:"observaciones"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.TextoFinal = strings.TrimSpace(req.TextoFinal)

	if req.TextoFinal == "" || req.PrioridadID <= 0 || req.EstadoPuntoID <= 0 {
		response.Error(c, http.StatusBadRequest, "campos obligatorios faltantes")
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}

	var fechaCompromiso *time.Time
	if req.FechaCompromiso != nil && strings.TrimSpace(*req.FechaCompromiso) != "" {
		parsed, err := time.Parse("2006-01-02", strings.TrimSpace(*req.FechaCompromiso))
		if err != nil {
			response.Error(c, http.StatusBadRequest, "fecha inválida")
			return
		}
		fechaCompromiso = &parsed
	}

	if scoped {
		err = h.pliegoPuntoRepo.UpdateCompletoByUnidadID(
			c.Request.Context(),
			*unidadID,
			id,
			req.TextoFinal,
			req.PrioridadID,
			req.EstadoPuntoID,
			req.CategoriaID,
			req.ResponsableUsuarioID,
			fechaCompromiso,
			req.Observaciones,
		)
	} else {
		err = h.pliegoPuntoRepo.UpdateCompleto(
			c.Request.Context(),
			id,
			req.TextoFinal,
			req.PrioridadID,
			req.EstadoPuntoID,
			req.CategoriaID,
			req.ResponsableUsuarioID,
			fechaCompromiso,
			req.Observaciones,
		)
	}

	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error actualizando punto")
		return
	}

	response.OK(c, gin.H{
		"ok": true,
	})
}
