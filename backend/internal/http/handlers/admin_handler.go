package handlers

import (
	"net/http"
	"sort"
	"time"

	"pliegos-des/backend/internal/domain"
	"pliegos-des/backend/internal/http/middleware"
	"pliegos-des/backend/internal/repository"
	"pliegos-des/backend/pkg/response"

	"github.com/gin-gonic/gin"
)

type AdminHandler struct {
	unidadRepo      *repository.UnidadRepository
	pliegoRepo      *repository.PliegoRepository
	pliegoPuntoRepo *repository.PliegoPuntoRepository
}

type dashboardConteoCatalogo struct {
	ID     int64  `json:"id"`
	Clave  string `json:"clave"`
	Nombre string `json:"nombre"`
	Total  int    `json:"total"`
}

type dashboardConteoUnidad struct {
	UnidadID                  int64  `json:"unidad_id"`
	Clave                     string `json:"clave"`
	Nombre                    string `json:"nombre"`
	Activo                    bool   `json:"activo"`
	TotalPliegos              int    `json:"total_pliegos"`
	TotalPuntos               int    `json:"total_puntos"`
	PuntosDetectados          int    `json:"puntos_detectados"`
	PuntosEnProceso           int    `json:"puntos_en_proceso"`
	PuntosRequierenValidacion int    `json:"puntos_requieren_validacion"`
	PuntosValidados           int    `json:"puntos_validados"`
	PuntosRechazados          int    `json:"puntos_rechazados"`
	PuntosConObservacionDES   int    `json:"puntos_con_observacion_des"`
	DiasPromedioRegistroPunto int    `json:"dias_promedio_desde_registro_punto"`
	MaxDiasRegistroPunto      int    `json:"max_dias_desde_registro_punto"`
	MaxDiasRecepcionPliego    int    `json:"max_dias_desde_recepcion_pliego"`
	PuntosVencidos15Dias      int    `json:"puntos_vencidos_15_dias"`
	PuntosVencidos30Dias      int    `json:"puntos_vencidos_30_dias"`
}

type dashboardAlertaPunto struct {
	PuntoID                  int64   `json:"punto_id"`
	PliegoID                 int64   `json:"pliego_id"`
	UnidadID                 int64   `json:"unidad_id"`
	UnidadClave              string  `json:"unidad_clave"`
	UnidadNombre             string  `json:"unidad_nombre"`
	FolioPliego              string  `json:"folio_pliego"`
	TituloPliego             string  `json:"titulo_pliego"`
	NumeroPunto              int     `json:"numero_punto"`
	EstadoPuntoClave         string  `json:"estado_punto_clave"`
	EstadoPuntoNombre        string  `json:"estado_punto_nombre"`
	PrioridadClave           string  `json:"prioridad_clave"`
	PrioridadNombre          string  `json:"prioridad_nombre"`
	RequiereValidacion       bool    `json:"requiere_validacion"`
	FechaRegistroPunto       string  `json:"fecha_registro_punto"`
	FechaRecepcionPliego     string  `json:"fecha_recepcion_pliego"`
	FechaEnvioValidacion     *string `json:"fecha_envio_validacion,omitempty"`
	DiasDesdeRegistroPunto   int     `json:"dias_desde_registro_punto"`
	DiasDesdeRecepcionPliego int     `json:"dias_desde_recepcion_pliego"`
	DiasDesdeEnvioValidacion *int    `json:"dias_desde_envio_validacion,omitempty"`
}

func NewAdminHandler(
	unidadRepo *repository.UnidadRepository,
	pliegoRepo *repository.PliegoRepository,
	pliegoPuntoRepo *repository.PliegoPuntoRepository,
) *AdminHandler {
	return &AdminHandler{
		unidadRepo:      unidadRepo,
		pliegoRepo:      pliegoRepo,
		pliegoPuntoRepo: pliegoPuntoRepo,
	}
}

func (h *AdminHandler) Dashboard(c *gin.Context) {
	claims, ok := middleware.GetCurrentUserClaims(c)
	if !ok {
		return
	}

	unidades, err := h.unidadRepo.List(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo unidades para dashboard")
		return
	}

	pliegos, err := h.pliegoRepo.List(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo pliegos para dashboard")
		return
	}

	puntos, err := h.pliegoPuntoRepo.ListAll(c.Request.Context(), repository.ListPuntosFilters{})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo puntos para dashboard")
		return
	}

	resumen := gin.H{
		"total_unidades":                  len(unidades),
		"unidades_activas":                0,
		"total_pliegos":                   len(pliegos),
		"pliegos_pendientes_revision_ocr": 0,
		"pliegos_cerrados":                0,
		"total_puntos":                    len(puntos),
		"puntos_requieren_validacion":     0,
		"puntos_validados":                0,
		"puntos_rechazados":               0,
		"puntos_con_observacion_des":      0,
		"puntos_en_proceso":               0,
	}

	type acumuladoUnidad struct {
		SumaDiasRegistroPunto int
	}

	now := time.Now()
	pliegoUnidadMap := make(map[int64]int64, len(pliegos))
	pliegoMap := make(map[int64]domain.PliegoWithEstado, len(pliegos))
	porEstadoPliegoMap := make(map[string]*dashboardConteoCatalogo)
	porEstadoPuntoMap := make(map[string]*dashboardConteoCatalogo)
	porPrioridadMap := make(map[string]*dashboardConteoCatalogo)
	porUnidadMap := make(map[int64]*dashboardConteoUnidad, len(unidades))
	acumuladosUnidad := make(map[int64]*acumuladoUnidad, len(unidades))
	alertasPuntosMasAntiguos := make([]dashboardAlertaPunto, 0)
	alertasValidacionesPendientes := make([]dashboardAlertaPunto, 0)

	for _, unidad := range unidades {
		if unidad.Activo {
			resumen["unidades_activas"] = resumen["unidades_activas"].(int) + 1
		}

		porUnidadMap[unidad.ID] = &dashboardConteoUnidad{
			UnidadID: unidad.ID,
			Clave:    unidad.Clave,
			Nombre:   unidad.Nombre,
			Activo:   unidad.Activo,
		}
		acumuladosUnidad[unidad.ID] = &acumuladoUnidad{}
	}

	for _, pliego := range pliegos {
		pliegoUnidadMap[pliego.ID] = pliego.UnidadID
		pliegoMap[pliego.ID] = pliego

		if pliego.EstadoPliegoClave == "pendiente_revision_ocr" {
			resumen["pliegos_pendientes_revision_ocr"] = resumen["pliegos_pendientes_revision_ocr"].(int) + 1
		}
		if pliego.EstadoPliegoClave == "cerrado" {
			resumen["pliegos_cerrados"] = resumen["pliegos_cerrados"].(int) + 1
		}

		key := pliego.EstadoPliegoClave
		if _, exists := porEstadoPliegoMap[key]; !exists {
			porEstadoPliegoMap[key] = &dashboardConteoCatalogo{
				ID:     pliego.EstadoPliegoID,
				Clave:  pliego.EstadoPliegoClave,
				Nombre: pliego.EstadoPliegoNombre,
				Total:  0,
			}
		}
		porEstadoPliegoMap[key].Total++

		if unidadItem, exists := porUnidadMap[pliego.UnidadID]; exists {
			unidadItem.TotalPliegos++
		}
	}

	for _, punto := range puntos {
		pliego, pliegoExists := pliegoMap[punto.PliegoID]
		if !pliegoExists {
			continue
		}

		diasRegistroPunto := daysSince(punto.FechaRegistro, now)
		diasRecepcionPliego := daysSince(pliego.FechaRecepcion, now)

		if punto.RequiereValidacion {
			resumen["puntos_requieren_validacion"] = resumen["puntos_requieren_validacion"].(int) + 1
		}

		switch punto.EstadoPuntoClave {
		case "validado":
			resumen["puntos_validados"] = resumen["puntos_validados"].(int) + 1
		case "rechazado":
			resumen["puntos_rechazados"] = resumen["puntos_rechazados"].(int) + 1
		case "requiere_informacion":
			resumen["puntos_con_observacion_des"] = resumen["puntos_con_observacion_des"].(int) + 1
		case "en_proceso":
			resumen["puntos_en_proceso"] = resumen["puntos_en_proceso"].(int) + 1
		}

		estadoKey := punto.EstadoPuntoClave
		if _, exists := porEstadoPuntoMap[estadoKey]; !exists {
			porEstadoPuntoMap[estadoKey] = &dashboardConteoCatalogo{
				ID:     punto.EstadoPuntoID,
				Clave:  punto.EstadoPuntoClave,
				Nombre: punto.EstadoPuntoNombre,
				Total:  0,
			}
		}
		porEstadoPuntoMap[estadoKey].Total++

		prioridadKey := punto.PrioridadClave
		if _, exists := porPrioridadMap[prioridadKey]; !exists {
			porPrioridadMap[prioridadKey] = &dashboardConteoCatalogo{
				ID:     punto.PrioridadID,
				Clave:  punto.PrioridadClave,
				Nombre: punto.PrioridadNombre,
				Total:  0,
			}
		}
		porPrioridadMap[prioridadKey].Total++

		unidadID := pliegoUnidadMap[punto.PliegoID]
		if unidadItem, exists := porUnidadMap[unidadID]; exists {
			unidadItem.TotalPuntos++
			if punto.EstadoPuntoClave == "detectado" {
				unidadItem.PuntosDetectados++
			}
			if punto.RequiereValidacion {
				unidadItem.PuntosRequierenValidacion++
			}
			switch punto.EstadoPuntoClave {
			case "en_proceso":
				unidadItem.PuntosEnProceso++
			case "validado":
				unidadItem.PuntosValidados++
			case "rechazado":
				unidadItem.PuntosRechazados++
			case "requiere_informacion":
				unidadItem.PuntosConObservacionDES++
			}

			if diasRegistroPunto > unidadItem.MaxDiasRegistroPunto {
				unidadItem.MaxDiasRegistroPunto = diasRegistroPunto
			}
			if diasRecepcionPliego > unidadItem.MaxDiasRecepcionPliego {
				unidadItem.MaxDiasRecepcionPliego = diasRecepcionPliego
			}
			if diasRegistroPunto > 15 {
				unidadItem.PuntosVencidos15Dias++
			}
			if diasRegistroPunto > 30 {
				unidadItem.PuntosVencidos30Dias++
			}
		}

		if acumulado, exists := acumuladosUnidad[unidadID]; exists {
			acumulado.SumaDiasRegistroPunto += diasRegistroPunto
		}

		alerta := buildAlertaPunto(
			punto,
			pliego,
			porUnidadMap[unidadID],
			diasRegistroPunto,
			diasRecepcionPliego,
			now,
		)
		alertasPuntosMasAntiguos = append(alertasPuntosMasAntiguos, alerta)
		if punto.RequiereValidacion {
			alertasValidacionesPendientes = append(alertasValidacionesPendientes, alerta)
		}
	}

	for unidadID, item := range porUnidadMap {
		if item.TotalPuntos == 0 {
			continue
		}
		if acumulado, exists := acumuladosUnidad[unidadID]; exists {
			item.DiasPromedioRegistroPunto = acumulado.SumaDiasRegistroPunto / item.TotalPuntos
		}
	}

	porEstadoPliego := make([]dashboardConteoCatalogo, 0, len(porEstadoPliegoMap))
	for _, item := range porEstadoPliegoMap {
		porEstadoPliego = append(porEstadoPliego, *item)
	}
	sort.Slice(porEstadoPliego, func(i, j int) bool {
		if porEstadoPliego[i].Total == porEstadoPliego[j].Total {
			return porEstadoPliego[i].Nombre < porEstadoPliego[j].Nombre
		}
		return porEstadoPliego[i].Total > porEstadoPliego[j].Total
	})

	porEstadoPunto := make([]dashboardConteoCatalogo, 0, len(porEstadoPuntoMap))
	for _, item := range porEstadoPuntoMap {
		porEstadoPunto = append(porEstadoPunto, *item)
	}
	sort.Slice(porEstadoPunto, func(i, j int) bool {
		if porEstadoPunto[i].Total == porEstadoPunto[j].Total {
			return porEstadoPunto[i].Nombre < porEstadoPunto[j].Nombre
		}
		return porEstadoPunto[i].Total > porEstadoPunto[j].Total
	})

	porPrioridad := make([]dashboardConteoCatalogo, 0, len(porPrioridadMap))
	for _, item := range porPrioridadMap {
		porPrioridad = append(porPrioridad, *item)
	}
	sort.Slice(porPrioridad, func(i, j int) bool {
		if porPrioridad[i].Total == porPrioridad[j].Total {
			return porPrioridad[i].Nombre < porPrioridad[j].Nombre
		}
		return porPrioridad[i].Total > porPrioridad[j].Total
	})

	porUnidad := make([]dashboardConteoUnidad, 0, len(porUnidadMap))
	for _, item := range porUnidadMap {
		porUnidad = append(porUnidad, *item)
	}
	sort.Slice(porUnidad, func(i, j int) bool {
		if porUnidad[i].TotalPuntos == porUnidad[j].TotalPuntos {
			return porUnidad[i].Nombre < porUnidad[j].Nombre
		}
		return porUnidad[i].TotalPuntos > porUnidad[j].TotalPuntos
	})

	sort.Slice(alertasPuntosMasAntiguos, func(i, j int) bool {
		if alertasPuntosMasAntiguos[i].DiasDesdeRegistroPunto == alertasPuntosMasAntiguos[j].DiasDesdeRegistroPunto {
			return alertasPuntosMasAntiguos[i].PuntoID > alertasPuntosMasAntiguos[j].PuntoID
		}
		return alertasPuntosMasAntiguos[i].DiasDesdeRegistroPunto > alertasPuntosMasAntiguos[j].DiasDesdeRegistroPunto
	})
	if len(alertasPuntosMasAntiguos) > 5 {
		alertasPuntosMasAntiguos = alertasPuntosMasAntiguos[:5]
	}

	sort.Slice(alertasValidacionesPendientes, func(i, j int) bool {
		left := alertasValidacionesPendientes[i].DiasDesdeRegistroPunto
		if alertasValidacionesPendientes[i].DiasDesdeEnvioValidacion != nil {
			left = *alertasValidacionesPendientes[i].DiasDesdeEnvioValidacion
		}
		right := alertasValidacionesPendientes[j].DiasDesdeRegistroPunto
		if alertasValidacionesPendientes[j].DiasDesdeEnvioValidacion != nil {
			right = *alertasValidacionesPendientes[j].DiasDesdeEnvioValidacion
		}
		if left == right {
			return alertasValidacionesPendientes[i].PuntoID > alertasValidacionesPendientes[j].PuntoID
		}
		return left > right
	})
	if len(alertasValidacionesPendientes) > 5 {
		alertasValidacionesPendientes = alertasValidacionesPendientes[:5]
	}

	response.OK(c, gin.H{
		"message": "acceso autorizado a módulo DES",
		"user": gin.H{
			"id":        claims.UserID,
			"unidad_id": claims.UnidadID,
			"rol_id":    claims.RolID,
			"rol_clave": claims.RolClave,
			"ambito":    claims.Ambito,
			"correo":    claims.Correo,
			"username":  claims.Username,
		},
		"resumen":           resumen,
		"por_estado_pliego": porEstadoPliego,
		"por_estado_punto":  porEstadoPunto,
		"por_prioridad":     porPrioridad,
		"por_unidad":        porUnidad,
		"alertas": gin.H{
			"puntos_mas_antiguos":              alertasPuntosMasAntiguos,
			"validaciones_pendientes_antiguas": alertasValidacionesPendientes,
		},
	})
}

func daysSince(from time.Time, now time.Time) int {
	if from.IsZero() {
		return 0
	}
	duration := now.Sub(from)
	if duration < 0 {
		return 0
	}
	return int(duration.Hours() / 24)
}

func buildAlertaPunto(
	punto domain.PliegoPuntoWithCatalogos,
	pliego domain.PliegoWithEstado,
	unidad *dashboardConteoUnidad,
	diasRegistroPunto int,
	diasRecepcionPliego int,
	now time.Time,
) dashboardAlertaPunto {
	var fechaEnvioValidacion *string
	var diasEnvioValidacion *int

	if punto.FechaEnvioValidacion != nil {
		fecha := punto.FechaEnvioValidacion.Format(time.RFC3339)
		fechaEnvioValidacion = &fecha
		dias := daysSince(*punto.FechaEnvioValidacion, now)
		diasEnvioValidacion = &dias
	}

	alerta := dashboardAlertaPunto{
		PuntoID:                  punto.ID,
		PliegoID:                 punto.PliegoID,
		UnidadID:                 pliego.UnidadID,
		FolioPliego:              pliego.Folio,
		TituloPliego:             pliego.Titulo,
		NumeroPunto:              punto.NumeroPunto,
		EstadoPuntoClave:         punto.EstadoPuntoClave,
		EstadoPuntoNombre:        punto.EstadoPuntoNombre,
		PrioridadClave:           punto.PrioridadClave,
		PrioridadNombre:          punto.PrioridadNombre,
		RequiereValidacion:       punto.RequiereValidacion,
		FechaRegistroPunto:       punto.FechaRegistro.Format(time.RFC3339),
		FechaRecepcionPliego:     pliego.FechaRecepcion.Format(time.RFC3339),
		FechaEnvioValidacion:     fechaEnvioValidacion,
		DiasDesdeRegistroPunto:   diasRegistroPunto,
		DiasDesdeRecepcionPliego: diasRecepcionPliego,
		DiasDesdeEnvioValidacion: diasEnvioValidacion,
	}

	if unidad != nil {
		alerta.UnidadID = unidad.UnidadID
		alerta.UnidadClave = unidad.Clave
		alerta.UnidadNombre = unidad.Nombre
	}

	return alerta
}
