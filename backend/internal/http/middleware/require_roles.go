package middleware

import (
	"net/http"

	"pliegos-des/backend/internal/services"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

func RequireRoles(allowedRoles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(allowedRoles))
	for _, role := range allowedRoles {
		allowed[role] = struct{}{}
	}

	return func(c *gin.Context) {
		rawClaims, exists := c.Get(CurrentUserClaimsKey)
		if !exists {
			response.Error(c, http.StatusUnauthorized, "sesión no válida")
			c.Abort()
			return
		}

		claims, ok := rawClaims.(*services.UserClaims)
		if !ok {
			response.Error(c, http.StatusUnauthorized, "claims inválidos")
			c.Abort()
			return
		}

		if _, found := allowed[claims.RolClave]; !found {
			response.Error(c, http.StatusForbidden, "sin permisos para esta operación")
			c.Abort()
			return
		}

		c.Next()
	}
}