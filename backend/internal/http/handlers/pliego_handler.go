package handlers

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"pliegos-des/backend/internal/domain"
	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/internal/services"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

const estadoPliegoPendienteRevisionOCRClave = "pendiente_revision_ocr"

type PliegoHandler struct {
	pliegoRepo          *repository.PliegoRepository
	pliegoPuntoRepo     *repository.PliegoPuntoRepository
	pythonParserService *services.PythonParserService
}

type CreatePliegoRequest struct {
	UnidadID               int64   `json:"unidad_id" binding:"required"`
	Folio                  string  `json:"folio" binding:"required"`
	Titulo                 string  `json:"titulo" binding:"required"`
	Descripcion            *string `json:"descripcion"`
	Periodo                *string `json:"periodo"`
	Anio                   *int    `json:"anio"`
	FechaRecepcion         string  `json:"fecha_recepcion" binding:"required"`
	EstadoPliegoID         int64   `json:"estado_pliego_id" binding:"required"`
	ArchivoOriginalID      *int64  `json:"archivo_original_id"`
	TextoOCRBruto          *string `json:"texto_ocr_bruto"`
	TextoRevisionFinal     *string `json:"texto_revision_final"`
	OCRProcesado           bool    `json:"ocr_procesado"`
	OCRFechaProcesado      *string `json:"ocr_fecha_procesado"`
	RegistradoPorUsuarioID *int64  `json:"registrado_por_usuario_id"`
	Observaciones          *string `json:"observaciones"`
}

type CreatePliegoDesdePDFRequest struct {
	UnidadID               int64   `json:"unidad_id" binding:"required"`
	Folio                  string  `json:"folio" binding:"required"`
	Titulo                 string  `json:"titulo" binding:"required"`
	Descripcion            *string `json:"descripcion"`
	Periodo                *string `json:"periodo"`
	Anio                   *int    `json:"anio"`
	FechaRecepcion         string  `json:"fecha_recepcion" binding:"required"`
	ArchivoOriginalID      *int64  `json:"archivo_original_id"`
	ArchivoPath            string  `json:"archivo_path" binding:"required"`
	Idioma                 string  `json:"idioma"`
	RegistradoPorUsuarioID *int64  `json:"registrado_por_usuario_id"`
	Observaciones          *string `json:"observaciones"`
}

type UpdateRevisionOCRPuntoRequest struct {
	NumeroPunto      int    `json:"numero_punto" binding:"required"`
	TextoOriginalOCR string `json:"texto_original_ocr"`
	TextoFinal       string `json:"texto_final" binding:"required"`
}

type UpdateRevisionOCRRequest struct {
	TextoRevisionFinal string                          `json:"texto_revision_final" binding:"required"`
	EstadoClaveDestino string                          `json:"estado_clave_destino" binding:"required"`
	Puntos             []UpdateRevisionOCRPuntoRequest `json:"puntos"`
}

type UpdatePliegoRequest struct {
	Folio          string  `json:"folio" binding:"required"`
	Titulo         string  `json:"titulo" binding:"required"`
	Descripcion    *string `json:"descripcion"`
	Periodo        *string `json:"periodo"`
	Anio           *int    `json:"anio"`
	FechaRecepcion string  `json:"fecha_recepcion" binding:"required"`
}

func NewPliegoHandler(
	pliegoRepo *repository.PliegoRepository,
	pliegoPuntoRepo *repository.PliegoPuntoRepository,
	pythonParserService *services.PythonParserService,
) *PliegoHandler {
	return &PliegoHandler{
		pliegoRepo:          pliegoRepo,
		pliegoPuntoRepo:     pliegoPuntoRepo,
		pythonParserService: pythonParserService,
	}
}

func (h *PliegoHandler) List(c *gin.Context) {
	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}

	var (
		items []domain.PliegoWithEstado
		err   error
	)

	if scoped {
		items, err = h.pliegoRepo.ListByUnidadID(c.Request.Context(), *unidadID)
	} else {
		items, err = h.pliegoRepo.List(c.Request.Context())
	}
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando pliegos")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PliegoHandler) GetByID(c *gin.Context) {
	id, ok := parsePliegoIDParam(c)
	if !ok {
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}

	var item *domain.PliegoWithEstado
	var err error

	if scoped {
		item, err = h.pliegoRepo.GetByIDAndUnidadID(c.Request.Context(), id, *unidadID)
	} else {
		item, err = h.pliegoRepo.GetByID(c.Request.Context(), id)
	}
	if err != nil {
		if errors.Is(err, repository.ErrPliegoNotFound) {
			response.Error(c, http.StatusNotFound, "pliego no encontrado")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error obteniendo pliego")
		return
	}

	// 🔥 NUEVO: traer puntos
	if scoped {
		puntos, err := h.pliegoPuntoRepo.ListByPliegoIDAndUnidadID(c.Request.Context(), id, *unidadID)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "error obteniendo puntos del pliego")
			return
		}

		response.OK(c, gin.H{
			"item":   item,
			"puntos": puntos,
		})
		return
	}

	puntos, err := h.pliegoPuntoRepo.ListByPliegoID(c.Request.Context(), id)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo puntos del pliego")
		return
	}

	response.OK(c, gin.H{
		"item":   item,
		"puntos": puntos,
	})
}

func (h *PliegoHandler) Create(c *gin.Context) {
	var req CreatePliegoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Folio = strings.TrimSpace(req.Folio)
	req.Titulo = strings.TrimSpace(req.Titulo)

	if req.UnidadID <= 0 || req.EstadoPliegoID <= 0 || req.Folio == "" || req.Titulo == "" || strings.TrimSpace(req.FechaRecepcion) == "" {
		response.Error(c, http.StatusBadRequest, "unidad_id, folio, titulo, fecha_recepcion y estado_pliego_id son obligatorios")
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}
	if scoped {
		req.UnidadID = *unidadID
	}

	fechaRecepcion, err := time.Parse("2006-01-02", strings.TrimSpace(req.FechaRecepcion))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "fecha_recepcion inválida, usa formato YYYY-MM-DD")
		return
	}

	var ocrFechaProcesado *time.Time
	if req.OCRFechaProcesado != nil && strings.TrimSpace(*req.OCRFechaProcesado) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(*req.OCRFechaProcesado))
		if err != nil {
			response.Error(c, http.StatusBadRequest, "ocr_fecha_procesado inválida, usa formato RFC3339")
			return
		}
		ocrFechaProcesado = &parsed
	}

	item, err := h.pliegoRepo.Create(
		c.Request.Context(),
		req.UnidadID,
		req.Folio,
		req.Titulo,
		req.Descripcion,
		req.Periodo,
		req.Anio,
		fechaRecepcion,
		req.EstadoPliegoID,
		req.ArchivoOriginalID,
		req.TextoOCRBruto,
		req.TextoRevisionFinal,
		req.OCRProcesado,
		ocrFechaProcesado,
		req.RegistradoPorUsuarioID,
		req.Observaciones,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPliegoFolioDuplicado) {
			response.Error(c, http.StatusConflict, "el folio del pliego ya existe")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error creando pliego")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
}

func (h *PliegoHandler) CreateDesdePDF(c *gin.Context) {
	var req CreatePliegoDesdePDFRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Folio = strings.TrimSpace(req.Folio)
	req.Titulo = strings.TrimSpace(req.Titulo)
	req.ArchivoPath = strings.TrimSpace(req.ArchivoPath)
	req.Idioma = strings.TrimSpace(req.Idioma)

	if req.Idioma == "" {
		req.Idioma = "spa"
	}

	if req.UnidadID <= 0 || req.Folio == "" || req.Titulo == "" || strings.TrimSpace(req.FechaRecepcion) == "" || req.ArchivoPath == "" {
		response.Error(c, http.StatusBadRequest, "unidad_id, folio, titulo, fecha_recepcion y archivo_path son obligatorios")
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}
	if scoped {
		req.UnidadID = *unidadID
	}

	if h.pythonParserService == nil {
		response.Error(c, http.StatusInternalServerError, "python parser no configurado")
		return
	}

	fechaRecepcion, err := time.Parse("2006-01-02", strings.TrimSpace(req.FechaRecepcion))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "fecha_recepcion inválida, usa formato YYYY-MM-DD")
		return
	}

	estadoPliegoID, err := h.pliegoRepo.GetEstadoPliegoIDByClave(
		c.Request.Context(),
		estadoPliegoPendienteRevisionOCRClave,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "no se encontró el estado pendiente_revision_ocr")
		return
	}

	parseResp, err := h.pythonParserService.ParsePDF(
		c.Request.Context(),
		req.ArchivoPath,
		req.Idioma,
		true,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error procesando PDF con parser Python")
		return
	}

	if parseResp == nil || parseResp.Data == nil {
		response.Error(c, http.StatusInternalServerError, "respuesta inválida del parser Python")
		return
	}

	var textoOCRBruto *string
	if strings.TrimSpace(parseResp.Data.TextoOCRBruto) != "" {
		texto := strings.TrimSpace(parseResp.Data.TextoOCRBruto)
		textoOCRBruto = &texto
	}

	var textoRevisionFinal *string
	if parseResp.Data.TextoRevisionSugerida != nil && strings.TrimSpace(*parseResp.Data.TextoRevisionSugerida) != "" {
		texto := strings.TrimSpace(*parseResp.Data.TextoRevisionSugerida)
		textoRevisionFinal = &texto
	}

	var ocrFechaProcesado *time.Time
	if strings.TrimSpace(parseResp.Data.OCRFechaProcesado) != "" {
		parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(parseResp.Data.OCRFechaProcesado))
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "ocr_fecha_procesado devuelta por parser Python es inválida")
			return
		}
		ocrFechaProcesado = &parsed
	}

	item, err := h.pliegoRepo.Create(
		c.Request.Context(),
		req.UnidadID,
		req.Folio,
		req.Titulo,
		req.Descripcion,
		req.Periodo,
		req.Anio,
		fechaRecepcion,
		estadoPliegoID,
		req.ArchivoOriginalID,
		textoOCRBruto,
		textoRevisionFinal,
		parseResp.Data.OCRProcesado,
		ocrFechaProcesado,
		req.RegistradoPorUsuarioID,
		req.Observaciones,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPliegoFolioDuplicado) {
			response.Error(c, http.StatusConflict, "el folio del pliego ya existe")
			return
		}

		response.Error(c, http.StatusInternalServerError, "error creando pliego desde PDF")
		return
	}

	// Guardar puntos detectados automáticamente
	if len(parseResp.Data.PuntosDetectados) > 0 {
		puntos := make([]repository.CreatePliegoPuntoFromOCRInput, 0, len(parseResp.Data.PuntosDetectados))

		for _, p := range parseResp.Data.PuntosDetectados {
			textoFinal := strings.TrimSpace(p.TextoFinalSugerido)
			textoOriginalOCR := strings.TrimSpace(p.TextoOriginalOCR)

			if p.NumeroPunto <= 0 || textoFinal == "" {
				continue
			}

			puntos = append(puntos, repository.CreatePliegoPuntoFromOCRInput{
				NumeroPunto:      p.NumeroPunto,
				TextoOriginalOCR: textoOriginalOCR,
				TextoFinal:       textoFinal,
			})
		}

		if len(puntos) > 0 {
			if scoped {
				err = h.pliegoPuntoRepo.CreateFromOCRByUnidadID(c.Request.Context(), *unidadID, item.ID, puntos)
			} else {
				err = h.pliegoPuntoRepo.CreateFromOCR(c.Request.Context(), item.ID, puntos)
			}
			if err != nil {
				response.Error(c, http.StatusInternalServerError, "error guardando puntos OCR del pliego")
				return
			}
		}
	}

	puntosDetectados := make([]gin.H, 0, len(parseResp.Data.PuntosDetectados))
	for _, punto := range parseResp.Data.PuntosDetectados {
		puntosDetectados = append(puntosDetectados, gin.H{
			"numero_punto":       punto.NumeroPunto,
			"texto_original_ocr": punto.TextoOriginalOCR,
			"texto_final":        punto.TextoFinalSugerido,
			"origen_captura":     punto.OrigenCaptura,
			"confidence":         punto.Confidence,
			"warnings":           punto.Warnings,
		})
	}

	response.Created(c, gin.H{
		"item":              item,
		"puntos_detectados": puntosDetectados,
		"warnings_globales": parseResp.Data.WarningsGlobales,
	})
}

func parsePliegoIDParam(c *gin.Context) (int64, bool) {
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

func (h *PliegoHandler) UpdateRevisionOCR(c *gin.Context) {
	id, ok := parsePliegoIDParam(c)
	if !ok {
		return
	}

	var req UpdateRevisionOCRRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.TextoRevisionFinal = strings.TrimSpace(req.TextoRevisionFinal)
	req.EstadoClaveDestino = strings.TrimSpace(req.EstadoClaveDestino)

	if req.TextoRevisionFinal == "" || req.EstadoClaveDestino == "" {
		response.Error(c, http.StatusBadRequest, "texto_revision_final y estado_clave_destino son obligatorios")
		return
	}

	estadoDestinoID, err := h.pliegoRepo.GetEstadoPliegoIDByClave(
		c.Request.Context(),
		req.EstadoClaveDestino,
	)
	if err != nil {
		response.Error(c, http.StatusBadRequest, "estado_clave_destino no válido")
		return
	}

	textoRevisionFinal := req.TextoRevisionFinal

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok {
		return
	}

	var item *domain.PliegoWithEstado
	if scoped {
		item, err = h.pliegoRepo.UpdateRevisionOCRByUnidadID(
			c.Request.Context(),
			id,
			*unidadID,
			&textoRevisionFinal,
			estadoDestinoID,
		)
	} else {
		item, err = h.pliegoRepo.UpdateRevisionOCR(
			c.Request.Context(),
			id,
			&textoRevisionFinal,
			estadoDestinoID,
		)
	}
	if err != nil {
		if errors.Is(err, repository.ErrPliegoNotFound) {
			response.Error(c, http.StatusNotFound, "pliego no encontrado")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error actualizando revisión OCR")
		return
	}

	if len(req.Puntos) > 0 {
		puntos := make([]repository.CreatePliegoPuntoFromOCRInput, 0, len(req.Puntos))

		for _, p := range req.Puntos {
			textoFinal := strings.TrimSpace(p.TextoFinal)
			textoOriginalOCR := strings.TrimSpace(p.TextoOriginalOCR)

			if p.NumeroPunto <= 0 || textoFinal == "" {
				response.Error(c, http.StatusBadRequest, "cada punto requiere numero_punto válido y texto_final")
				return
			}

			puntos = append(puntos, repository.CreatePliegoPuntoFromOCRInput{
				NumeroPunto:      p.NumeroPunto,
				TextoOriginalOCR: textoOriginalOCR,
				TextoFinal:       textoFinal,
			})
		}

		if scoped {
			err = h.pliegoPuntoRepo.CreateFromOCRByUnidadID(c.Request.Context(), *unidadID, id, puntos)
		} else {
			err = h.pliegoPuntoRepo.CreateFromOCR(c.Request.Context(), id, puntos)
		}
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "error guardando puntos del pliego")
			return
		}
	}

	response.OK(c, gin.H{
		"item": item,
	})
}

func (h *PliegoHandler) UpdateByUnidadID(c *gin.Context) {
	id, ok := parsePliegoIDParam(c)
	if !ok {
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok || !scoped || unidadID == nil {
		response.Error(c, http.StatusForbidden, "acceso no permitido")
		return
	}

	var req UpdatePliegoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	req.Folio = strings.TrimSpace(req.Folio)
	req.Titulo = strings.TrimSpace(req.Titulo)

	if req.Folio == "" || req.Titulo == "" || strings.TrimSpace(req.FechaRecepcion) == "" {
		response.Error(c, http.StatusBadRequest, "folio, titulo y fecha_recepcion son obligatorios")
		return
	}

	fechaRecepcion, err := time.Parse("2006-01-02", strings.TrimSpace(req.FechaRecepcion))
	if err != nil {
		response.Error(c, http.StatusBadRequest, "fecha_recepcion inválida, usa formato YYYY-MM-DD")
		return
	}

	item, err := h.pliegoRepo.UpdateByUnidadID(
		c.Request.Context(),
		id,
		*unidadID,
		req.Folio,
		req.Titulo,
		req.Descripcion,
		req.Periodo,
		req.Anio,
		fechaRecepcion,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPliegoNotFound) {
			response.Error(c, http.StatusNotFound, "pliego no encontrado")
			return
		}
		if errors.Is(err, repository.ErrPliegoFolioDuplicado) {
			response.Error(c, http.StatusConflict, "el folio del pliego ya existe")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error actualizando pliego")
		return
	}

	response.OK(c, gin.H{
		"item":    item,
		"message": "Pliego actualizado correctamente.",
	})
}

func (h *PliegoHandler) DeleteByUnidadID(c *gin.Context) {
	id, ok := parsePliegoIDParam(c)
	if !ok {
		return
	}

	unidadID, scoped, ok := getScopedUnidadID(c)
	if !ok || !scoped || unidadID == nil {
		response.Error(c, http.StatusForbidden, "acceso no permitido")
		return
	}

	if err := h.pliegoRepo.DeleteByUnidadID(c.Request.Context(), id, *unidadID); err != nil {
		if errors.Is(err, repository.ErrPliegoNotFound) {
			response.Error(c, http.StatusNotFound, "pliego no encontrado")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error eliminando pliego")
		return
	}

	response.OK(c, gin.H{
		"message": "Pliego eliminado correctamente.",
	})
}

func getScopedUnidadID(c *gin.Context) (*int64, bool, bool) {
	if !strings.HasPrefix(c.FullPath(), "/unidad/") {
		return nil, false, true
	}

	claims, ok := middleware.GetCurrentUserClaims(c)
	if !ok {
		return nil, false, false
	}
	if claims.UnidadID == nil || *claims.UnidadID <= 0 {
		response.Error(c, http.StatusForbidden, "usuario sin unidad asignada")
		return nil, false, false
	}

	return claims.UnidadID, true, true
}
