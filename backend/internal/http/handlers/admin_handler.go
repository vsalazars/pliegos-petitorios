package handlers

import (
	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct{}

func NewAdminHandler() *AdminHandler {
	return &AdminHandler{}
}

func (h *AdminHandler) Dashboard(c *gin.Context) {
	claims, ok := middleware.GetCurrentUserClaims(c)
	if !ok {
		return
	}

	response.OK(c, gin.H{
		"message": "acceso autorizado a módulo DES",
		"user": gin.H{
			"id":         claims.UserID,
			"unidad_id":  claims.UnidadID,
			"rol_id":     claims.RolID,
			"rol_clave":  claims.RolClave,
			"ambito":     claims.Ambito,
			"correo":     claims.Correo,
			"username":   claims.Username,
		},
	})
}