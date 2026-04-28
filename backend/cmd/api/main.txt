package main

import (
	"log"

	"pliegos-des/backend/internal/app"

	"github.com/gin-gonic/gin"
)

func main() {
	gin.SetMode(gin.ReleaseMode)

	application, err := app.New()
	if err != nil {
		log.Fatalf("error inicializando aplicación: %v", err)
	}
	defer application.Close()

	log.Printf("API escuchando en :%s", application.Config.AppPort)
	if err := application.Router.Run(":" + application.Config.AppPort); err != nil {
		log.Fatalf("error levantando servidor: %v", err)
	}
}