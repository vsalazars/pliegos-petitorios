package middleware

import (
	"net/http"

	"pliegos-des/backend/internal/services"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

func GetCurrentUserClaims(c *gin.Context) (*services.UserClaims, bool) {
	rawClaims, exists := c.Get(CurrentUserClaimsKey)
	if !exists {
		response.Error(c, http.StatusUnauthorized, "sesión no válida")
		return nil, false
	}

	claims, ok := rawClaims.(*services.UserClaims)
	if !ok {
		response.Error(c, http.StatusUnauthorized, "claims inválidos")
		return nil, false
	}

	return claims, true
}