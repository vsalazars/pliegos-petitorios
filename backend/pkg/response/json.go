package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func JSON(c *gin.Context, status int, data any) {
	c.JSON(status, data)
}

func OK(c *gin.Context, data any) {
	c.JSON(http.StatusOK, data)
}

func Created(c *gin.Context, data any) {
	c.JSON(http.StatusCreated, data)
}

func Error(c *gin.Context, status int, message string) {
	c.JSON(status, gin.H{
		"error": message,
	})
}