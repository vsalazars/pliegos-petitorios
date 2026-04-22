package handlers

import (
	"net/http"

	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type CatalogoHandler struct {
	prioridadRepo      *repository.PrioridadRepository
	estadoPuntoRepo    *repository.EstadoPuntoRepository
	categoriaPuntoRepo *repository.CategoriaPuntoRepository
	estadoPliegoRepo   *repository.EstadoPliegoRepository
	tipoEvidenciaRepo  *repository.TipoEvidenciaRepository
	motivoRechazoRepo  *repository.MotivoRechazoRepository
}

func NewCatalogoHandler(
	prioridadRepo *repository.PrioridadRepository,
	estadoPuntoRepo *repository.EstadoPuntoRepository,
	categoriaPuntoRepo *repository.CategoriaPuntoRepository,
	estadoPliegoRepo *repository.EstadoPliegoRepository,
	tipoEvidenciaRepo *repository.TipoEvidenciaRepository,
	motivoRechazoRepo *repository.MotivoRechazoRepository,
) *CatalogoHandler {
	return &CatalogoHandler{
		prioridadRepo:      prioridadRepo,
		estadoPuntoRepo:    estadoPuntoRepo,
		categoriaPuntoRepo: categoriaPuntoRepo,
		estadoPliegoRepo:   estadoPliegoRepo,
		tipoEvidenciaRepo:  tipoEvidenciaRepo,
		motivoRechazoRepo:  motivoRechazoRepo,
	}
}

func (h *CatalogoHandler) ListPrioridades(c *gin.Context) {
	items, err := h.prioridadRepo.ListActivas(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando prioridades")
		return
	}

	response.OK(c, gin.H{"items": items, "total": len(items)})
}

func (h *CatalogoHandler) ListEstadosPunto(c *gin.Context) {
	items, err := h.estadoPuntoRepo.ListActivos(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando estados de punto")
		return
	}

	response.OK(c, gin.H{"items": items, "total": len(items)})
}

func (h *CatalogoHandler) ListCategoriasPunto(c *gin.Context) {
	items, err := h.categoriaPuntoRepo.ListActivas(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando categorías de punto")
		return
	}

	response.OK(c, gin.H{"items": items, "total": len(items)})
}

func (h *CatalogoHandler) ListEstadosPliego(c *gin.Context) {
	items, err := h.estadoPliegoRepo.ListActivos(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando estados de pliego")
		return
	}

	response.OK(c, gin.H{"items": items, "total": len(items)})
}

func (h *CatalogoHandler) ListTiposEvidencia(c *gin.Context) {
	items, err := h.tipoEvidenciaRepo.ListActivos(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando tipos de evidencia")
		return
	}

	response.OK(c, gin.H{"items": items, "total": len(items)})
}

func (h *CatalogoHandler) ListMotivosRechazo(c *gin.Context) {
	items, err := h.motivoRechazoRepo.ListActivos(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando motivos de rechazo")
		return
	}

	response.OK(c, gin.H{"items": items, "total": len(items)})
}
