package router

import (
	"pliegos-des/backend/internal/config"
	"pliegos-des/backend/internal/http/handlers"
	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/jackc/pgx/v5/pgxpool"
)

func New(cfg config.Config, pool *pgxpool.Pool) *gin.Engine {
	r := gin.New()

	_ = r.SetTrustedProxies([]string{"127.0.0.1", "::1"})

	r.Use(gin.Recovery())

	healthHandler := handlers.NewHealthHandler(cfg, pool)
	adminHandler := handlers.NewAdminHandler()

	userRepo := repository.NewUserRepository(pool)
	unidadRepo := repository.NewUnidadRepository(pool)
	rolRepo := repository.NewRolRepository(pool)
	pliegoRepo := repository.NewPliegoRepository(pool)
	pliegoPuntoRepo := repository.NewPliegoPuntoRepository(pool)

	authService := services.NewAuthService(cfg, userRepo)
	jwtService := services.NewJWTService(cfg)

	authHandler := handlers.NewAuthHandler(authService, jwtService)
	unidadHandler := handlers.NewUnidadHandler(unidadRepo)
	userHandler := handlers.NewUserHandler(userRepo, authService)
	rolHandler := handlers.NewRolHandler(rolRepo)

	pythonParserService := services.NewPythonParserService(cfg.PythonParserURL)

	pliegoHandler := handlers.NewPliegoHandler(pliegoRepo, pliegoPuntoRepo, pythonParserService)
	pliegoPuntoHandler := handlers.NewPliegoPuntoHandler(pliegoPuntoRepo)

	r.GET("/utils/salud", healthHandler.GetHealth)

	auth := r.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.GET("/me", middleware.AuthJWT(jwtService), authHandler.Me)
	}

	// =========================
	// DES / SUPERVISIÓN
	// =========================
	admin := r.Group("/admin")
	admin.Use(middleware.AuthJWT(jwtService))
	admin.Use(middleware.RequireRoles("SUPERADMIN_DES", "ADMIN_DES", "REVISOR_DES", "CONSULTA_DES"))
	{
		admin.GET("/dashboard", adminHandler.Dashboard)

		// UNIDADES
		admin.GET("/unidades", unidadHandler.List)
		admin.GET("/unidades/:id", unidadHandler.GetByID)
		admin.POST("/unidades", unidadHandler.Create)
		admin.PUT("/unidades/:id", unidadHandler.Update)
		admin.PATCH("/unidades/:id/activo", unidadHandler.SetActivo)

		// USUARIOS
		admin.GET("/usuarios", userHandler.List)
		admin.GET("/usuarios/:id", userHandler.GetByID)
		admin.POST("/usuarios", userHandler.Create)
		admin.PUT("/usuarios/:id", userHandler.Update)
		admin.PATCH("/usuarios/:id/activo", userHandler.SetActivo)

		// ROLES
		admin.GET("/roles", rolHandler.List)

		// PLIEGOS - consulta / supervisión
		admin.GET("/pliegos", pliegoHandler.List)
		admin.GET("/pliegos/:id", pliegoHandler.GetByID)

		// PUNTOS DEL PLIEGO - consulta / supervisión
		admin.GET("/pliegos/:id/puntos", pliegoPuntoHandler.ListByPliegoID)
	}

	// =========================
	// UNIDAD / CAPTURA
	// =========================
	unidad := r.Group("/unidad")
	unidad.Use(middleware.AuthJWT(jwtService))
	unidad.Use(middleware.RequireRoles("ADMIN_UNIDAD", "CAPTURISTA_UNIDAD", "CONSULTA_UNIDAD"))
	{
		// PLIEGOS
		unidad.GET("/pliegos", pliegoHandler.List)
		unidad.GET("/pliegos/:id", pliegoHandler.GetByID)
		unidad.POST("/pliegos", pliegoHandler.Create)
		unidad.POST("/pliegos/desde-pdf", pliegoHandler.CreateDesdePDF)
		unidad.PUT("/pliegos/:id/revision-ocr", pliegoHandler.UpdateRevisionOCR)
		unidad.PUT("/pliegos/:id/puntos/:punto_id/completo", pliegoPuntoHandler.UpdateCompleto)

		// PUNTOS DEL PLIEGO
		unidad.GET("/pliegos/:id/puntos", pliegoPuntoHandler.ListByPliegoID)
		unidad.POST("/pliegos/:id/puntos", pliegoPuntoHandler.Create)
		unidad.PUT("/pliegos/:id/puntos/:punto_id", pliegoPuntoHandler.UpdateTextoFinal)
	}

	return r
}