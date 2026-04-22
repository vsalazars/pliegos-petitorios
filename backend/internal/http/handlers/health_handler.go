package handlers

import (
	"context"
	"time"

	"pliegos-des/backend/internal/config"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type HealthHandler struct {
	cfg  config.Config
	pool *pgxpool.Pool
}

func NewHealthHandler(cfg config.Config, pool *pgxpool.Pool) *HealthHandler {
	return &HealthHandler{
		cfg:  cfg,
		pool: pool,
	}
}

func (h *HealthHandler) GetHealth(c *gin.Context) {
	dbCtx, cancel := context.WithTimeout(c.Request.Context(), 2*time.Second)
	defer cancel()

	dbStatus := "up"
	if err := h.pool.Ping(dbCtx); err != nil {
		dbStatus = "down"
	}

	response.OK(c, gin.H{
		"status": "ok",
		"app":    "pliegos-des-backend",
		"env":    h.cfg.AppEnv,
		"db":     dbStatus,
	})
}