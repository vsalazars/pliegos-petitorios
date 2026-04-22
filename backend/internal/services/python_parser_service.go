package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

type PythonParserService struct {
	baseURL    string
	httpClient *http.Client
}

type ParsePDFRequest struct {
	ArchivoPath  string `json:"archivo_path"`
	Idioma       string `json:"idioma"`
	DetectPoints bool   `json:"detect_points"`
}

type ParsePDFResponse struct {
	OK        bool                  `json:"ok"`
	Message   string                `json:"message"`
	ErrorCode string                `json:"error_code,omitempty"`
	Details   []string              `json:"details,omitempty"`
	Data      *ParsePDFResponseData `json:"data,omitempty"`
}

type ParsePDFResponseData struct {
	TextoOCRBruto          string                 `json:"texto_ocr_bruto"`
	TextoRevisionSugerida  *string                `json:"texto_revision_sugerida"`
	OCRProcesado           bool                   `json:"ocr_procesado"`
	OCRFechaProcesado      string                 `json:"ocr_fecha_procesado"`
	PuntosDetectados       []PuntoDetectadoPython `json:"puntos_detectados"`
	WarningsGlobales       []string               `json:"warnings_globales"`
}

type PuntoDetectadoPython struct {
	NumeroPunto       int      `json:"numero_punto"`
	TextoOriginalOCR  string   `json:"texto_original_ocr"`
	TextoFinalSugerido string  `json:"texto_final_sugerido"`
	OrigenCaptura     string   `json:"origen_captura"`
	Confidence        float64  `json:"confidence"`
	Warnings          []string `json:"warnings"`
}

func NewPythonParserService(baseURL string) *PythonParserService {
	baseURL = strings.TrimSpace(baseURL)
	baseURL = strings.TrimRight(baseURL, "/")

	return &PythonParserService{
		baseURL: baseURL,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

func (s *PythonParserService) ParsePDF(
	ctx context.Context,
	archivoPath string,
	idioma string,
	detectPoints bool,
) (*ParsePDFResponse, error) {
	if strings.TrimSpace(s.baseURL) == "" {
		return nil, fmt.Errorf("python parser baseURL no configurada")
	}

	reqBody := ParsePDFRequest{
		ArchivoPath:  strings.TrimSpace(archivoPath),
		Idioma:       strings.TrimSpace(idioma),
		DetectPoints: detectPoints,
	}

	payload, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("serializar request a python parser: %w", err)
	}

	url := s.baseURL + "/parse-pdf"

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(payload))
	if err != nil {
		return nil, fmt.Errorf("crear request a python parser: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("llamar python parser: %w", err)
	}
	defer resp.Body.Close()

	var parsed ParsePDFResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, fmt.Errorf("decodificar respuesta de python parser: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		if parsed.Message != "" {
			return nil, fmt.Errorf("python parser respondió %d: %s", resp.StatusCode, parsed.Message)
		}
		return nil, fmt.Errorf("python parser respondió %d", resp.StatusCode)
	}

	if !parsed.OK {
		if parsed.Message != "" {
			return &parsed, fmt.Errorf("python parser reportó error: %s", parsed.Message)
		}
		return &parsed, fmt.Errorf("python parser reportó error sin mensaje")
	}

	if parsed.Data == nil {
		return nil, fmt.Errorf("python parser no devolvió data")
	}

	return &parsed, nil
}