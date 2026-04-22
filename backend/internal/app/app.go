package app

import (
	"fmt"

	"pliegos-des/backend/internal/config"
	"pliegos-des/backend/internal/db"
	"pliegos-des/backend/internal/http/router"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	Config config.Config
	DB     *pgxpool.Pool
	Router *gin.Engine
}

func New() (*App, error) {
	cfg := config.Load()

	pool, err := db.NewPostgresPool(cfg)
	if err != nil {
		return nil, fmt.Errorf("inicializar postgres: %w", err)
	}

	r := router.New(cfg, pool)

	return &App{
		Config: cfg,
		DB:     pool,
		Router: r,
	}, nil
}

func (a *App) Close() {
	if a.DB != nil {
		a.DB.Close()
	}
}