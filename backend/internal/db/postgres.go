package db

import (
	"context"
	"fmt"
	"time"

	"pliegos-des/backend/internal/config"

	"github.com/jackc/pgx/v5/pgxpool"
)

func buildDSN(cfg config.Config) string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%s/%s?sslmode=%s",
		cfg.DBUser,
		cfg.DBPass,
		cfg.DBHost,
		cfg.DBPort,
		cfg.DBName,
		cfg.DBSSL,
	)
}

func NewPostgresPool(cfg config.Config) (*pgxpool.Pool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, buildDSN(cfg))
	if err != nil {
		return nil, fmt.Errorf("crear pool postgres: %w", err)
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping postgres: %w", err)
	}

	return pool, nil
}