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
	validacionRepo  *repository.PuntoValidacionRepository
	prioridadRepo   *repository.PrioridadRepository
}

type dashboardConteoCatalogo struct {
	ID     int64  `json:"id"`
	Clave  string `json:"clave"`
	Nombre string `json:"nombre"`
	Total  int    `json:"total"`
}

type dashboardConteoUnidad struct {
	UnidadID                   int64  `json:"unidad_id"`
	Clave                      string `json:"clave"`
	Nombre                     string `json:"nombre"`
	Activo                     bool   `json:"activo"`
	TotalPliegos               int    `json:"total_pliegos"`
	TotalPuntos                int    `json:"total_puntos"`
	PuntosPendientesOperativos int    `json:"puntos_pendientes_operativos"`
	PuntosDetectados           int    `json:"puntos_detectados"`
	PuntosEnProceso            int    `json:"puntos_en_proceso"`
	PuntosRequierenValidacion  int    `json:"puntos_requieren_validacion"`
	PuntosValidados            int    `json:"puntos_validados"`
	PuntosRechazados           int    `json:"puntos_rechazados"`
	PuntosConObservacionDES    int    `json:"puntos_con_observacion_des"`
	DiasPromedioRegistroPunto  int    `json:"dias_promedio_desde_registro_punto"`
	MaxDiasRegistroPunto       int    `json:"max_dias_desde_registro_punto"`
	MaxDiasRecepcionPliego     int    `json:"max_dias_desde_recepcion_pliego"`
	PuntosVencidos7Dias        int    `json:"puntos_vencidos_7_dias"`
	PuntosVencidos15Dias       int    `json:"puntos_vencidos_15_dias"`
	PuntosVencidos30Dias       int    `json:"puntos_vencidos_30_dias"`
	SemaforoNormal             int    `json:"semaforo_normal_0_7"`
	SemaforoAtencion           int    `json:"semaforo_atencion_8_15"`
	SemaforoRiesgo             int    `json:"semaforo_riesgo_16_30"`
	SemaforoCritico            int    `json:"semaforo_critico_mas_30"`
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
	FechaRespuestaUnidad     *string `json:"fecha_respuesta_unidad,omitempty"`
	FechaValidacionDES       *string `json:"fecha_validacion_des,omitempty"`
	DiasDesdeRegistroPunto   int     `json:"dias_desde_registro_punto"`
	DiasDesdeRecepcionPliego int     `json:"dias_desde_recepcion_pliego"`
	DiasDesdeEnvioValidacion *int    `json:"dias_desde_envio_validacion,omitempty"`
	DiasDesdeRespuestaUnidad *int    `json:"dias_desde_respuesta_unidad,omitempty"`
	DiasDesdeValidacionDES   *int    `json:"dias_desde_validacion_des,omitempty"`
}

type dashboardValidacionReciente struct {
	ID                  int64   `json:"id"`
	PuntoID             int64   `json:"punto_id"`
	PliegoID            int64   `json:"pliego_id"`
	UnidadID            int64   `json:"unidad_id"`
	UnidadClave         string  `json:"unidad_clave"`
	UnidadNombre        string  `json:"unidad_nombre"`
	FolioPliego         string  `json:"folio_pliego"`
	TituloPliego        string  `json:"titulo_pliego"`
	NumeroPunto         int     `json:"numero_punto"`
	Resultado           string  `json:"resultado"`
	Comentario          *string `json:"comentario,omitempty"`
	Username            *string `json:"username,omitempty"`
	NombreUsuario       *string `json:"nombre_usuario,omitempty"`
	MotivoRechazoClave  *string `json:"motivo_rechazo_clave,omitempty"`
	MotivoRechazoNombre *string `json:"motivo_rechazo_nombre,omitempty"`
	EsVigente           bool    `json:"es_vigente"`
	Fecha               string  `json:"fecha"`
	DiasDesde           int     `json:"dias_desde"`
}

type dashboardTopUnidadPendiente struct {
	UnidadID                   int64  `json:"unidad_id"`
	Clave                      string `json:"clave"`
	Nombre                     string `json:"nombre"`
	PuntosPendientesOperativos int    `json:"puntos_pendientes_operativos"`
	PuntosRequierenValidacion  int    `json:"puntos_requieren_validacion"`
	PuntosConObservacionDES    int    `json:"puntos_con_observacion_des"`
	PuntosEnProceso            int    `json:"puntos_en_proceso"`
	PuntosVencidos7Dias        int    `json:"puntos_vencidos_7_dias"`
	PuntosVencidos15Dias       int    `json:"puntos_vencidos_15_dias"`
	PuntosVencidos30Dias       int    `json:"puntos_vencidos_30_dias"`
	MaxDiasRegistroPunto       int    `json:"max_dias_desde_registro_punto"`
}

func NewAdminHandler(
	unidadRepo *repository.UnidadRepository,
	pliegoRepo *repository.PliegoRepository,
	pliegoPuntoRepo *repository.PliegoPuntoRepository,
	validacionRepo *repository.PuntoValidacionRepository,
	prioridadRepo *repository.PrioridadRepository,
) *AdminHandler {
	return &AdminHandler{
		unidadRepo:      unidadRepo,
		pliegoRepo:      pliegoRepo,
		pliegoPuntoRepo: pliegoPuntoRepo,
		validacionRepo:  validacionRepo,
		prioridadRepo:   prioridadRepo,
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

	prioridades, err := h.prioridadRepo.ListActivas(c.Request.Context())
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo prioridades para dashboard")
		return
	}

	puntos, err := h.pliegoPuntoRepo.ListAll(c.Request.Context(), repository.ListPuntosFilters{})
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo puntos para dashboard")
		return
	}

	validacionesRecientesRaw, err := h.validacionRepo.ListRecentForDashboard(c.Request.Context(), "aprobado", 5)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo validaciones recientes para dashboard")
		return
	}

	rechazosRecientesRaw, err := h.validacionRepo.ListRecentForDashboard(c.Request.Context(), "rechazado", 5)
	if err != nil {
		response.Error(c, http.StatusInternalServerError, "error obteniendo rechazos recientes para dashboard")
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
		"puntos_pendientes_operativos":    0,
	}

	type acumuladoUnidad struct {
		SumaDiasRegistroPunto int
	}

	now := time.Now()
	prioridadSLAMap := make(map[string]int, len(prioridades))
	pliegoUnidadMap := make(map[int64]int64, len(pliegos))
	pliegoMap := make(map[int64]domain.PliegoWithEstado, len(pliegos))
	porEstadoPliegoMap := make(map[string]*dashboardConteoCatalogo)
	porEstadoPuntoMap := make(map[string]*dashboardConteoCatalogo)
	porPrioridadMap := make(map[string]*dashboardConteoCatalogo)
	porUnidadMap := make(map[int64]*dashboardConteoUnidad, len(unidades))
	acumuladosUnidad := make(map[int64]*acumuladoUnidad, len(unidades))
	alertasPuntosMasAntiguos := make([]dashboardAlertaPunto, 0)
	alertasValidacionesPendientes := make([]dashboardAlertaPunto, 0)
	validacionesSinAtender := make([]dashboardAlertaPunto, 0)
	respuestasUnidadSinReaccionDES := make([]dashboardAlertaPunto, 0)
	casosCriticos := make([]dashboardAlertaPunto, 0)
	slaGlobal := gin.H{
		"puntos_vencidos_7_dias":  0,
		"puntos_vencidos_15_dias": 0,
		"puntos_vencidos_30_dias": 0,
		"semaforo_normal_0_7":     0,
		"semaforo_atencion_8_15":  0,
		"semaforo_riesgo_16_30":   0,
		"semaforo_critico_mas_30": 0,
	}
	relojesGlobal := gin.H{
		"validaciones_sin_atender_total":                 0,
		"validaciones_sin_atender_mas_7_dias":            0,
		"validaciones_sin_atender_mas_15_dias":           0,
		"respuestas_unidad_sin_reaccion_des_total":       0,
		"respuestas_unidad_sin_reaccion_des_mas_7_dias":  0,
		"respuestas_unidad_sin_reaccion_des_mas_15_dias": 0,
	}
	casosCriticosResumen := gin.H{
		"total":                 0,
		"pendientes_validacion": 0,
		"con_observacion_des":   0,
		"en_proceso":            0,
		"vencidos_sla":          0,
	}

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

	for _, prioridad := range prioridades {
		prioridadSLAMap[prioridad.Clave] = prioridad.DiasSLA
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

		pendienteOperativo := isPuntoPendienteOperativo(punto.EstadoPuntoClave)
		if pendienteOperativo {
			resumen["puntos_pendientes_operativos"] = resumen["puntos_pendientes_operativos"].(int) + 1
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
			if pendienteOperativo {
				unidadItem.PuntosPendientesOperativos++
			}
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
			if pendienteOperativo {
				switch ageBucket(diasRegistroPunto) {
				case "normal":
					unidadItem.SemaforoNormal++
					slaGlobal["semaforo_normal_0_7"] = slaGlobal["semaforo_normal_0_7"].(int) + 1
				case "atencion":
					unidadItem.SemaforoAtencion++
					slaGlobal["semaforo_atencion_8_15"] = slaGlobal["semaforo_atencion_8_15"].(int) + 1
				case "riesgo":
					unidadItem.SemaforoRiesgo++
					slaGlobal["semaforo_riesgo_16_30"] = slaGlobal["semaforo_riesgo_16_30"].(int) + 1
				case "critico":
					unidadItem.SemaforoCritico++
					slaGlobal["semaforo_critico_mas_30"] = slaGlobal["semaforo_critico_mas_30"].(int) + 1
				}

				if diasRegistroPunto > 7 {
					unidadItem.PuntosVencidos7Dias++
					slaGlobal["puntos_vencidos_7_dias"] = slaGlobal["puntos_vencidos_7_dias"].(int) + 1
				}
				if diasRegistroPunto > 15 {
					unidadItem.PuntosVencidos15Dias++
					slaGlobal["puntos_vencidos_15_dias"] = slaGlobal["puntos_vencidos_15_dias"].(int) + 1
				}
				if diasRegistroPunto > 30 {
					unidadItem.PuntosVencidos30Dias++
					slaGlobal["puntos_vencidos_30_dias"] = slaGlobal["puntos_vencidos_30_dias"].(int) + 1
				}
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
		if isCasoCritico(punto, pendienteOperativo) {
			casosCriticos = append(casosCriticos, alerta)
			casosCriticosResumen["total"] = casosCriticosResumen["total"].(int) + 1
			if punto.RequiereValidacion {
				casosCriticosResumen["pendientes_validacion"] = casosCriticosResumen["pendientes_validacion"].(int) + 1
			}
			switch punto.EstadoPuntoClave {
			case "requiere_informacion":
				casosCriticosResumen["con_observacion_des"] = casosCriticosResumen["con_observacion_des"].(int) + 1
			case "en_proceso":
				casosCriticosResumen["en_proceso"] = casosCriticosResumen["en_proceso"].(int) + 1
			}
			if isSLAExpiredForCriticalCase(punto, alerta, prioridadSLAMap) {
				casosCriticosResumen["vencidos_sla"] = casosCriticosResumen["vencidos_sla"].(int) + 1
			}
		}
		if shouldCountValidacionSinAtender(punto) && alerta.DiasDesdeEnvioValidacion != nil {
			validacionesSinAtender = append(validacionesSinAtender, alerta)
			relojesGlobal["validaciones_sin_atender_total"] = relojesGlobal["validaciones_sin_atender_total"].(int) + 1
			if *alerta.DiasDesdeEnvioValidacion > 7 {
				relojesGlobal["validaciones_sin_atender_mas_7_dias"] = relojesGlobal["validaciones_sin_atender_mas_7_dias"].(int) + 1
			}
			if *alerta.DiasDesdeEnvioValidacion > 15 {
				relojesGlobal["validaciones_sin_atender_mas_15_dias"] = relojesGlobal["validaciones_sin_atender_mas_15_dias"].(int) + 1
			}
		}
		if shouldCountRespuestaUnidadSinReaccionDES(punto) && alerta.DiasDesdeRespuestaUnidad != nil {
			respuestasUnidadSinReaccionDES = append(respuestasUnidadSinReaccionDES, alerta)
			relojesGlobal["respuestas_unidad_sin_reaccion_des_total"] = relojesGlobal["respuestas_unidad_sin_reaccion_des_total"].(int) + 1
			if *alerta.DiasDesdeRespuestaUnidad > 7 {
				relojesGlobal["respuestas_unidad_sin_reaccion_des_mas_7_dias"] = relojesGlobal["respuestas_unidad_sin_reaccion_des_mas_7_dias"].(int) + 1
			}
			if *alerta.DiasDesdeRespuestaUnidad > 15 {
				relojesGlobal["respuestas_unidad_sin_reaccion_des_mas_15_dias"] = relojesGlobal["respuestas_unidad_sin_reaccion_des_mas_15_dias"].(int) + 1
			}
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

	topUnidadesPendientes := buildTopUnidadesPendientes(porUnidad)

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

	sort.Slice(validacionesSinAtender, func(i, j int) bool {
		left := 0
		if validacionesSinAtender[i].DiasDesdeEnvioValidacion != nil {
			left = *validacionesSinAtender[i].DiasDesdeEnvioValidacion
		}
		right := 0
		if validacionesSinAtender[j].DiasDesdeEnvioValidacion != nil {
			right = *validacionesSinAtender[j].DiasDesdeEnvioValidacion
		}
		if left == right {
			return validacionesSinAtender[i].PuntoID > validacionesSinAtender[j].PuntoID
		}
		return left > right
	})
	if len(validacionesSinAtender) > 5 {
		validacionesSinAtender = validacionesSinAtender[:5]
	}

	sort.Slice(respuestasUnidadSinReaccionDES, func(i, j int) bool {
		left := 0
		if respuestasUnidadSinReaccionDES[i].DiasDesdeRespuestaUnidad != nil {
			left = *respuestasUnidadSinReaccionDES[i].DiasDesdeRespuestaUnidad
		}
		right := 0
		if respuestasUnidadSinReaccionDES[j].DiasDesdeRespuestaUnidad != nil {
			right = *respuestasUnidadSinReaccionDES[j].DiasDesdeRespuestaUnidad
		}
		if left == right {
			return respuestasUnidadSinReaccionDES[i].PuntoID > respuestasUnidadSinReaccionDES[j].PuntoID
		}
		return left > right
	})
	if len(respuestasUnidadSinReaccionDES) > 5 {
		respuestasUnidadSinReaccionDES = respuestasUnidadSinReaccionDES[:5]
	}

	sort.Slice(casosCriticos, func(i, j int) bool {
		if casosCriticos[i].DiasDesdeRegistroPunto == casosCriticos[j].DiasDesdeRegistroPunto {
			if casosCriticos[i].RequiereValidacion == casosCriticos[j].RequiereValidacion {
				return casosCriticos[i].PuntoID > casosCriticos[j].PuntoID
			}
			return casosCriticos[i].RequiereValidacion
		}
		return casosCriticos[i].DiasDesdeRegistroPunto > casosCriticos[j].DiasDesdeRegistroPunto
	})
	if len(casosCriticos) > 5 {
		casosCriticos = casosCriticos[:5]
	}

	validacionesRecientes := buildDashboardValidacionesRecientes(validacionesRecientesRaw, now)
	rechazosRecientes := buildDashboardValidacionesRecientes(rechazosRecientesRaw, now)

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
		"recientes": gin.H{
			"validaciones": validacionesRecientes,
			"rechazos":     rechazosRecientes,
		},
		"atencion_inmediata": gin.H{
			"pendientes_validacion":                  resumen["puntos_requieren_validacion"],
			"con_observacion_des":                    resumen["puntos_con_observacion_des"],
			"puntos_pendientes_operativos":           resumen["puntos_pendientes_operativos"],
			"top_unidades_con_mas_puntos_pendientes": topUnidadesPendientes,
			"sla":                                    slaGlobal,
			"relojes":                                relojesGlobal,
			"validaciones_sin_atender":               validacionesSinAtender,
			"respuestas_unidad_sin_reaccion_des":     respuestasUnidadSinReaccionDES,
			"casos_criticos_resumen":                 casosCriticosResumen,
			"casos_criticos":                         casosCriticos,
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
	var fechaRespuestaUnidad *string
	var diasRespuestaUnidad *int
	var fechaValidacionDES *string
	var diasValidacionDES *int

	if punto.FechaEnvioValidacion != nil {
		fecha := punto.FechaEnvioValidacion.Format(time.RFC3339)
		fechaEnvioValidacion = &fecha
		dias := daysSince(*punto.FechaEnvioValidacion, now)
		diasEnvioValidacion = &dias
	}
	if punto.FechaRespuestaUnidad != nil {
		fecha := punto.FechaRespuestaUnidad.Format(time.RFC3339)
		fechaRespuestaUnidad = &fecha
		dias := daysSince(*punto.FechaRespuestaUnidad, now)
		diasRespuestaUnidad = &dias
	}
	if punto.FechaValidacionDES != nil {
		fecha := punto.FechaValidacionDES.Format(time.RFC3339)
		fechaValidacionDES = &fecha
		dias := daysSince(*punto.FechaValidacionDES, now)
		diasValidacionDES = &dias
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
		FechaRespuestaUnidad:     fechaRespuestaUnidad,
		FechaValidacionDES:       fechaValidacionDES,
		DiasDesdeRegistroPunto:   diasRegistroPunto,
		DiasDesdeRecepcionPliego: diasRecepcionPliego,
		DiasDesdeEnvioValidacion: diasEnvioValidacion,
		DiasDesdeRespuestaUnidad: diasRespuestaUnidad,
		DiasDesdeValidacionDES:   diasValidacionDES,
	}

	if unidad != nil {
		alerta.UnidadID = unidad.UnidadID
		alerta.UnidadClave = unidad.Clave
		alerta.UnidadNombre = unidad.Nombre
	}

	return alerta
}

func buildDashboardValidacionesRecientes(
	items []domain.PuntoValidacionDashboardReciente,
	now time.Time,
) []dashboardValidacionReciente {
	result := make([]dashboardValidacionReciente, 0, len(items))
	for _, item := range items {
		result = append(result, dashboardValidacionReciente{
			ID:                  item.ID,
			PuntoID:             item.PuntoID,
			PliegoID:            item.PliegoID,
			UnidadID:            item.UnidadID,
			UnidadClave:         item.UnidadClave,
			UnidadNombre:        item.UnidadNombre,
			FolioPliego:         item.FolioPliego,
			TituloPliego:        item.TituloPliego,
			NumeroPunto:         item.NumeroPunto,
			Resultado:           item.Resultado,
			Comentario:          item.Comentario,
			Username:            item.Username,
			NombreUsuario:       item.NombreUsuario,
			MotivoRechazoClave:  item.MotivoRechazoClave,
			MotivoRechazoNombre: item.MotivoRechazoNombre,
			EsVigente:           item.EsVigente,
			Fecha:               item.CreatedAt.Format(time.RFC3339),
			DiasDesde:           daysSince(item.CreatedAt, now),
		})
	}

	return result
}

func isPuntoPendienteOperativo(estado string) bool {
	switch estado {
	case "detectado", "en_proceso", "requiere_informacion":
		return true
	default:
		return false
	}
}

func ageBucket(days int) string {
	switch {
	case days <= 7:
		return "normal"
	case days <= 15:
		return "atencion"
	case days <= 30:
		return "riesgo"
	default:
		return "critico"
	}
}

func buildTopUnidadesPendientes(items []dashboardConteoUnidad) []dashboardTopUnidadPendiente {
	result := make([]dashboardTopUnidadPendiente, 0, len(items))
	for _, item := range items {
		if item.PuntosPendientesOperativos == 0 && item.PuntosRequierenValidacion == 0 && item.PuntosConObservacionDES == 0 {
			continue
		}

		result = append(result, dashboardTopUnidadPendiente{
			UnidadID:                   item.UnidadID,
			Clave:                      item.Clave,
			Nombre:                     item.Nombre,
			PuntosPendientesOperativos: item.PuntosPendientesOperativos,
			PuntosRequierenValidacion:  item.PuntosRequierenValidacion,
			PuntosConObservacionDES:    item.PuntosConObservacionDES,
			PuntosEnProceso:            item.PuntosEnProceso,
			PuntosVencidos7Dias:        item.PuntosVencidos7Dias,
			PuntosVencidos15Dias:       item.PuntosVencidos15Dias,
			PuntosVencidos30Dias:       item.PuntosVencidos30Dias,
			MaxDiasRegistroPunto:       item.MaxDiasRegistroPunto,
		})
	}

	sort.Slice(result, func(i, j int) bool {
		if result[i].PuntosPendientesOperativos == result[j].PuntosPendientesOperativos {
			if result[i].PuntosRequierenValidacion == result[j].PuntosRequierenValidacion {
				return result[i].Nombre < result[j].Nombre
			}
			return result[i].PuntosRequierenValidacion > result[j].PuntosRequierenValidacion
		}
		return result[i].PuntosPendientesOperativos > result[j].PuntosPendientesOperativos
	})

	if len(result) > 5 {
		return result[:5]
	}

	return result
}

func shouldCountValidacionSinAtender(punto domain.PliegoPuntoWithCatalogos) bool {
	return punto.RequiereValidacion && punto.FechaEnvioValidacion != nil
}

func shouldCountRespuestaUnidadSinReaccionDES(punto domain.PliegoPuntoWithCatalogos) bool {
	if punto.FechaRespuestaUnidad == nil {
		return false
	}
	if !punto.RequiereValidacion && punto.EstadoPuntoClave != "detectado" && punto.EstadoPuntoClave != "requiere_informacion" {
		return false
	}
	if punto.FechaValidacionDES == nil {
		return true
	}
	return punto.FechaValidacionDES.Before(*punto.FechaRespuestaUnidad)
}

func isCasoCritico(punto domain.PliegoPuntoWithCatalogos, pendienteOperativo bool) bool {
	if !isPrioridadCritica(punto.PrioridadClave) {
		return false
	}
	return pendienteOperativo || punto.RequiereValidacion
}

func isPrioridadCritica(clave string) bool {
	switch clave {
	case "alta", "urgente":
		return true
	default:
		return false
	}
}

func isSLAExpiredForCriticalCase(
	punto domain.PliegoPuntoWithCatalogos,
	alerta dashboardAlertaPunto,
	prioridadSLAMap map[string]int,
) bool {
	diasSLA, exists := prioridadSLAMap[punto.PrioridadClave]
	if !exists || diasSLA <= 0 {
		return false
	}
	return alerta.DiasDesdeRegistroPunto > diasSLA
}
