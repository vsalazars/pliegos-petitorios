package handlers

import (
	"net/http"

	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type RolHandler struct {
	rolRepo *repository.RolRepository
}

func NewRolHandler(rolRepo *repository.RolRepository) *RolHandler {
	return &RolHandler{
		rolRepo: rolRepo,
	}
}

func (h *RolHandler) List(c *gin.Context) {
	items, err := h.rolRepo.List(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error listando roles")
		return
	}

	response.OK(c, gin.H{
		"items": items,
		"total": len(items),
	})
}