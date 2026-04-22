package middleware

import (
	"net/http"
	"strings"

	"pliegos-des/backend/internal/services"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

const CurrentUserClaimsKey = "current_user_claims"

func AuthJWT(jwtService *services.JWTService) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, http.StatusUnauthorized, "token requerido")
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.Error(c, http.StatusUnauthorized, "formato de token inválido")
			c.Abort()
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			response.Error(c, http.StatusUnauthorized, "token requerido")
			c.Abort()
			return
		}

		claims, err := jwtService.ParseToken(tokenString)
		if err != nil {
			response.Error(c, http.StatusUnauthorized, "token inválido o expirado")
			c.Abort()
			return
		}

		c.Set(CurrentUserClaimsKey, claims)
		c.Next()
	}
}