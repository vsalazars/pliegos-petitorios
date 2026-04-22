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

type PuntoEvidenciaHandler struct {
	evidenciaRepo *repository.PuntoEvidenciaRepository
	archivoRepo   *repository.ArchivoRepository
	storage       *services.FileStorageService
}

func NewPuntoEvidenciaHandler(
	evidenciaRepo *repository.PuntoEvidenciaRepository,
	archivoRepo *repository.ArchivoRepository,
	storage *services.FileStorageService,
) *PuntoEvidenciaHandler {
	return &PuntoEvidenciaHandler{
		evidenciaRepo: evidenciaRepo,
		archivoRepo:   archivoRepo,
		storage:       storage,
	}
}

func (h *PuntoEvidenciaHandler) ListByPuntoIDAdmin(c *gin.Context) {
	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	items, err := h.evidenciaRepo.ListByPuntoID(c.Request.Context(), puntoID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando evidencias del punto")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PuntoEvidenciaHandler) ListByPuntoID(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	puntoID, ok := parsePuntoIDParam(c)
	if !ok {
		return
	}

	items, err := h.evidenciaRepo.ListByPuntoIDAndUnidadID(c.Request.Context(), puntoID, unidadID)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando evidencias del punto")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}

func (h *PuntoEvidenciaHandler) Upload(c *gin.Context) {
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

	fileHeader, err := c.FormFile("file")
	if err != nil {
		response.Error(c, http.StatusBadRequest, "archivo requerido")
		return
	}

	tipoEvidenciaID, err := strconv.ParseInt(strings.TrimSpace(c.PostForm("tipo_evidencia_id")), 10, 64)
	if err != nil || tipoEvidenciaID <= 0 {
		response.Error(c, http.StatusBadRequest, "tipo_evidencia_id inválido")
		return
	}

	var titulo *string
	if value := strings.TrimSpace(c.PostForm("titulo")); value != "" {
		titulo = &value
	}

	var descripcion *string
	if value := strings.TrimSpace(c.PostForm("descripcion")); value != "" {
		descripcion = &value
	}

	visibleUnidad := parseBoolForm(c.DefaultPostForm("visible_unidad", "true"))
	visibleDES := parseBoolForm(c.DefaultPostForm("visible_des", "true"))
	esVigente := parseBoolForm(c.DefaultPostForm("es_vigente", "true"))

	savedFile, err := h.storage.SaveMultipartFile(fileHeader)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error guardando archivo")
		return
	}

	usuarioID := claims.UserID
	archivo, err := h.archivoRepo.Create(
		c.Request.Context(),
		savedFile.NombreOriginal,
		savedFile.NombreStorage,
		savedFile.RutaStorage,
		savedFile.MimeType,
		savedFile.Extension,
		savedFile.TamanoBytes,
		savedFile.HashSHA256,
		&usuarioID,
	)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error registrando archivo")
		return
	}

	item, err := h.evidenciaRepo.CreateByUnidadID(
		c.Request.Context(),
		unidadID,
		puntoID,
		archivo.ID,
		tipoEvidenciaID,
		titulo,
		descripcion,
		visibleUnidad,
		visibleDES,
		esVigente,
		&usuarioID,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPliegoPuntoNotFound) {
			response.Error(c, http.StatusNotFound, "punto no encontrado")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error registrando evidencia")
		return
	}

	response.Created(c, gin.H{
		"item": item,
	})
}

func parseBoolForm(value string) bool {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "false", "0", "no":
		return false
	default:
		return true
	}
}
