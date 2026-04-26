package handlers

import (
	"errors"
	"net/http"
	"os"
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
	archivo, reusedExistingFile, err := h.archivoRepo.Create(
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
		response.Error(c, http.StatusInternalServerError, "error registrando archivo en la base de datos")
		return
	}
	if reusedExistingFile && savedFile.RutaStorage != "" {
		_ = os.Remove(savedFile.RutaStorage)
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
		"message": func() string {
			if reusedExistingFile {
				return "El archivo ya existía y se reutilizó correctamente."
			}
			return "Evidencia registrada correctamente."
		}(),
	})
}

func (h *PuntoEvidenciaHandler) DownloadAdmin(c *gin.Context) {
	evidenciaIDValue := strings.TrimSpace(c.Param("evidencia_id"))
	evidenciaID, err := strconv.ParseInt(evidenciaIDValue, 10, 64)
	if err != nil || evidenciaID <= 0 {
		response.Error(c, http.StatusBadRequest, "evidencia_id inválido")
		return
	}

	item, err := h.evidenciaRepo.GetByID(c.Request.Context(), evidenciaID)
	if err != nil {
		response.Error(c, http.StatusNotFound, "evidencia no encontrada")
		return
	}

	if item.Archivo.RutaStorage == "" {
		response.Error(c, http.StatusNotFound, "archivo no disponible")
		return
	}

	if _, err := os.Stat(item.Archivo.RutaStorage); err != nil {
		response.Error(c, http.StatusNotFound, "archivo no encontrado en storage")
		return
	}

	if item.Archivo.MimeType != "" {
		c.Header("Content-Type", item.Archivo.MimeType)
	}

	c.FileAttachment(item.Archivo.RutaStorage, item.Archivo.NombreOriginal)
}

func (h *PuntoEvidenciaHandler) UpdateByUnidadID(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	evidenciaIDValue := strings.TrimSpace(c.Param("evidencia_id"))
	evidenciaID, err := strconv.ParseInt(evidenciaIDValue, 10, 64)
	if err != nil || evidenciaID <= 0 {
		response.Error(c, http.StatusBadRequest, "evidencia_id inválido")
		return
	}

	var body struct {
		TipoEvidenciaID int64   `json:"tipo_evidencia_id"`
		Titulo          *string `json:"titulo"`
		Descripcion     *string `json:"descripcion"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		response.Error(c, http.StatusBadRequest, "payload inválido")
		return
	}

	if body.TipoEvidenciaID <= 0 {
		response.Error(c, http.StatusBadRequest, "tipo_evidencia_id inválido")
		return
	}

	var titulo *string
	if body.Titulo != nil {
		value := strings.TrimSpace(*body.Titulo)
		if value != "" {
			titulo = &value
		}
	}

	var descripcion *string
	if body.Descripcion != nil {
		value := strings.TrimSpace(*body.Descripcion)
		if value != "" {
			descripcion = &value
		}
	}

	item, err := h.evidenciaRepo.UpdateByUnidadID(
		c.Request.Context(),
		unidadID,
		evidenciaID,
		body.TipoEvidenciaID,
		titulo,
		descripcion,
	)
	if err != nil {
		if errors.Is(err, repository.ErrPuntoEvidenciaNotFound) {
			response.Error(c, http.StatusNotFound, "evidencia no encontrada")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error actualizando evidencia")
		return
	}

	response.OK(c, gin.H{
		"item":    item,
		"message": "Evidencia actualizada correctamente.",
	})
}

func (h *PuntoEvidenciaHandler) DeleteByUnidadID(c *gin.Context) {
	unidadID, ok := currentUnidadIDFromClaims(c)
	if !ok {
		return
	}

	evidenciaIDValue := strings.TrimSpace(c.Param("evidencia_id"))
	evidenciaID, err := strconv.ParseInt(evidenciaIDValue, 10, 64)
	if err != nil || evidenciaID <= 0 {
		response.Error(c, http.StatusBadRequest, "evidencia_id inválido")
		return
	}

	if err := h.evidenciaRepo.DeleteByUnidadID(c.Request.Context(), unidadID, evidenciaID); err != nil {
		if errors.Is(err, repository.ErrPuntoEvidenciaNotFound) {
			response.Error(c, http.StatusNotFound, "evidencia no encontrada")
			return
		}
		response.Error(c, http.StatusInternalServerError, "error eliminando evidencia")
		return
	}

	response.OK(c, gin.H{
		"message": "Evidencia eliminada correctamente.",
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
