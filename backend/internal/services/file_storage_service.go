package services

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type SavedFile struct {
	NombreOriginal string
	NombreStorage  string
	RutaStorage    string
	MimeType       string
	Extension      *string
	TamanoBytes    int64
	HashSHA256     *string
}

type FileStorageService struct {
	baseDir string
}

func NewFileStorageService(baseDir string) *FileStorageService {
	baseDir = strings.TrimSpace(baseDir)
	if baseDir == "" {
		baseDir = "/tmp/pliegos-des/uploads"
	}
	return &FileStorageService{baseDir: baseDir}
}

func (s *FileStorageService) SaveMultipartFile(fileHeader *multipart.FileHeader) (*SavedFile, error) {
	src, err := fileHeader.Open()
	if err != nil {
		return nil, fmt.Errorf("abrir archivo multipart: %w", err)
	}
	defer src.Close()

	if err := os.MkdirAll(s.baseDir, 0o755); err != nil {
		return nil, fmt.Errorf("crear directorio de uploads: %w", err)
	}

	extValue := strings.ToLower(strings.TrimSpace(filepath.Ext(fileHeader.Filename)))
	var extPtr *string
	if extValue != "" {
		trimmed := strings.TrimPrefix(extValue, ".")
		extPtr = &trimmed
	}

	storageName := fmt.Sprintf("%d%s", time.Now().UnixNano(), extValue)
	dstPath := filepath.Join(s.baseDir, storageName)

	dst, err := os.Create(dstPath)
	if err != nil {
		return nil, fmt.Errorf("crear archivo destino: %w", err)
	}
	defer dst.Close()

	hasher := sha256.New()
	size, err := io.Copy(io.MultiWriter(dst, hasher), src)
	if err != nil {
		return nil, fmt.Errorf("guardar archivo: %w", err)
	}

	hashValue := hex.EncodeToString(hasher.Sum(nil))
	hashPtr := &hashValue

	mimeType := strings.TrimSpace(fileHeader.Header.Get("Content-Type"))
	if mimeType == "" {
		mimeType = "application/octet-stream"
	}

	return &SavedFile{
		NombreOriginal: fileHeader.Filename,
		NombreStorage:  storageName,
		RutaStorage:    dstPath,
		MimeType:       mimeType,
		Extension:      extPtr,
		TamanoBytes:    size,
		HashSHA256:     hashPtr,
	}, nil
}
