package config

import "os"

type Config struct {
	AppEnv          string
	AppPort         string
	DBHost          string
	DBPort          string
	DBName          string
	DBUser          string
	DBPass          string
	DBSSL           string
	AuthMaxAttempts string
	AuthLockMinutes string
	JWTSecret       string
	JTTExpiresHours string

	PythonParserURL string
	UploadDir       string
}

func getEnv(key, fallback string) string {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	return v
}

func Load() Config {
	return Config{
		AppEnv:          getEnv("APP_ENV", "development"),
		AppPort:         getEnv("APP_PORT", "8080"),
		DBHost:          getEnv("DB_HOST", "127.0.0.1"),
		DBPort:          getEnv("DB_PORT", "5432"),
		DBName:          getEnv("DB_NAME", "pliegos_des"),
		DBUser:          getEnv("DB_USER", "postgres"),
		DBPass:          getEnv("DB_PASSWORD", ""),
		DBSSL:           getEnv("DB_SSLMODE", "disable"),
		AuthMaxAttempts: getEnv("AUTH_MAX_ATTEMPTS", "5"),
		AuthLockMinutes: getEnv("AUTH_LOCK_MINUTES", "15"),
		JWTSecret:       getEnv("JWT_SECRET", "cambia-esto-en-desarrollo"),
		JTTExpiresHours: getEnv("JWT_EXPIRES_HOURS", "12"),
		PythonParserURL: getEnv("PYTHON_PARSER_URL", "http://localhost:5000"),
		UploadDir:       getEnv("UPLOAD_DIR", "/tmp/pliegos-des/uploads"),
	}
}
