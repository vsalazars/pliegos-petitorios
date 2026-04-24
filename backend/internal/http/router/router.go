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
	userRepo := repository.NewUserRepository(pool)
	unidadRepo := repository.NewUnidadRepository(pool)
	rolRepo := repository.NewRolRepository(pool)
	pliegoRepo := repository.NewPliegoRepository(pool)
	pliegoPuntoRepo := repository.NewPliegoPuntoRepository(pool)
	puntoSeguimientoRepo := repository.NewPuntoSeguimientoRepository(pool)
	puntoValidacionRepo := repository.NewPuntoValidacionRepository(pool)
	archivoRepo := repository.NewArchivoRepository(pool)
	puntoEvidenciaRepo := repository.NewPuntoEvidenciaRepository(pool)
	prioridadRepo := repository.NewPrioridadRepository(pool)
	adminHandler := handlers.NewAdminHandler(unidadRepo, pliegoRepo, pliegoPuntoRepo, puntoValidacionRepo, prioridadRepo)
	estadoPuntoRepo := repository.NewEstadoPuntoRepository(pool)
	categoriaPuntoRepo := repository.NewCategoriaPuntoRepository(pool)
	estadoPliegoRepo := repository.NewEstadoPliegoRepository(pool)
	tipoEvidenciaRepo := repository.NewTipoEvidenciaRepository(pool)
	motivoRechazoRepo := repository.NewMotivoRechazoRepository(pool)

	authService := services.NewAuthService(cfg, userRepo)
	jwtService := services.NewJWTService(cfg)

	authHandler := handlers.NewAuthHandler(authService, jwtService)
	unidadHandler := handlers.NewUnidadHandler(unidadRepo)
	userHandler := handlers.NewUserHandler(userRepo, authService)
	rolHandler := handlers.NewRolHandler(rolRepo)
	catalogoHandler := handlers.NewCatalogoHandler(
		prioridadRepo,
		estadoPuntoRepo,
		categoriaPuntoRepo,
		estadoPliegoRepo,
		tipoEvidenciaRepo,
		motivoRechazoRepo,
	)

	pythonParserService := services.NewPythonParserService(cfg.PythonParserURL)
	fileStorageService := services.NewFileStorageService(cfg.UploadDir)

	pliegoHandler := handlers.NewPliegoHandler(pliegoRepo, pliegoPuntoRepo, pythonParserService)
	pliegoPuntoHandler := handlers.NewPliegoPuntoHandler(pliegoPuntoRepo)
	puntoSeguimientoHandler := handlers.NewPuntoSeguimientoHandler(puntoSeguimientoRepo)
	puntoValidacionHandler := handlers.NewPuntoValidacionHandler(puntoValidacionRepo, pliegoPuntoRepo)
	puntoEvidenciaHandler := handlers.NewPuntoEvidenciaHandler(puntoEvidenciaRepo, archivoRepo, fileStorageService)

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
		admin.GET("/puntos", pliegoPuntoHandler.ListAll)
		admin.GET("/pliegos/:id/puntos", pliegoPuntoHandler.ListByPliegoID)
		admin.GET("/puntos/:punto_id/seguimientos", puntoSeguimientoHandler.ListByPuntoIDAdmin)
		admin.GET("/puntos/:punto_id/evidencias", puntoEvidenciaHandler.ListByPuntoIDAdmin)
		admin.GET("/puntos/:punto_id/validaciones", puntoValidacionHandler.ListByPuntoIDAdmin)
		admin.POST("/puntos/:punto_id/validaciones", puntoValidacionHandler.CreateAdmin)
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

		// CATALOGOS
		unidad.GET("/catalogos/prioridades", catalogoHandler.ListPrioridades)
		unidad.GET("/catalogos/estados-punto", catalogoHandler.ListEstadosPunto)
		unidad.GET("/catalogos/categorias-punto", catalogoHandler.ListCategoriasPunto)
		unidad.GET("/catalogos/estados-pliego", catalogoHandler.ListEstadosPliego)
		unidad.GET("/catalogos/tipos-evidencia", catalogoHandler.ListTiposEvidencia)
		unidad.GET("/catalogos/motivos-rechazo", catalogoHandler.ListMotivosRechazo)

		// PUNTOS DEL PLIEGO
		unidad.GET("/pliegos/:id/puntos", pliegoPuntoHandler.ListByPliegoID)
		unidad.POST("/pliegos/:id/puntos", pliegoPuntoHandler.Create)
		unidad.PUT("/pliegos/:id/puntos/:punto_id", pliegoPuntoHandler.UpdateTextoFinal)
		unidad.DELETE("/pliegos/:id/puntos/:punto_id", pliegoPuntoHandler.Delete)
		unidad.GET("/pliegos/:id/puntos/:punto_id/seguimientos", puntoSeguimientoHandler.ListByPuntoID)
		unidad.POST("/pliegos/:id/puntos/:punto_id/seguimientos", puntoSeguimientoHandler.CreateComentario)
		unidad.GET("/pliegos/:id/puntos/:punto_id/validaciones", puntoValidacionHandler.ListByPuntoID)
		unidad.GET("/pliegos/:id/puntos/:punto_id/validaciones/vigente", puntoValidacionHandler.GetVigenteByPuntoID)
		unidad.POST("/pliegos/:id/puntos/:punto_id/responder-validacion", puntoValidacionHandler.ResponderValidacion)
		unidad.POST("/pliegos/:id/puntos/:punto_id/enviar-validacion", puntoValidacionHandler.EnviarAValidacion)
		unidad.GET("/pliegos/:id/puntos/:punto_id/evidencias", puntoEvidenciaHandler.ListByPuntoID)
		unidad.POST("/pliegos/:id/puntos/:punto_id/evidencias", puntoEvidenciaHandler.Upload)
	}

	return r
}
