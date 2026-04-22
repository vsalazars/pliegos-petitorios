BEGIN;

-- =========================================================
-- EXTENSIONES
-- =========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- LIMPIEZA SEGURA DE FUNCIONES/TRIGGERS AUXILIARES
-- =========================================================
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS audit_if_modified() CASCADE;
DROP FUNCTION IF EXISTS registrar_evento_auditoria(VARCHAR, BIGINT, VARCHAR, BIGINT, TEXT, JSONB, JSONB, INET, TEXT) CASCADE;
DROP FUNCTION IF EXISTS desactivar_validaciones_vigentes_previas() CASCADE;
DROP FUNCTION IF EXISTS cancelar_tokens_activos_previos() CASCADE;
DROP FUNCTION IF EXISTS validar_usuario_ambito() CASCADE;

-- =========================================================
-- FUNCIONES GENERALES
-- =========================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- CATÁLOGOS
-- =========================================================
CREATE TABLE IF NOT EXISTS roles (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  ambito          VARCHAR(20) NOT NULL CHECK (ambito IN ('DES', 'UNIDAD')),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias_punto (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  descripcion     TEXT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prioridades (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  nivel_orden     INTEGER NOT NULL CHECK (nivel_orden > 0),
  dias_sla        INTEGER NOT NULL DEFAULT 0 CHECK (dias_sla >= 0),
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estados_pliego (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  color_hex       VARCHAR(7),
  orden           INTEGER NOT NULL DEFAULT 1,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_estados_pliego_color_hex
    CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE IF NOT EXISTS estados_punto (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  color_hex       VARCHAR(7),
  orden           INTEGER NOT NULL DEFAULT 1,
  es_terminal     BOOLEAN NOT NULL DEFAULT FALSE,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_estados_punto_color_hex
    CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE TABLE IF NOT EXISTS tipos_evidencia (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS motivos_rechazo (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(150) NOT NULL,
  descripcion     TEXT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permisos (
  id              BIGSERIAL PRIMARY KEY,
  clave           VARCHAR(100) NOT NULL UNIQUE,
  nombre          VARCHAR(150) NOT NULL,
  modulo          VARCHAR(100) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rol_permisos (
  rol_id          BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permiso_id      BIGINT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (rol_id, permiso_id)
);

-- =========================================================
-- NÚCLEO ORGANIZACIONAL
-- =========================================================
CREATE TABLE IF NOT EXISTS unidades_academicas (
  id                  BIGSERIAL PRIMARY KEY,
  clave               VARCHAR(50) NOT NULL UNIQUE,
  nombre              VARCHAR(255) NOT NULL,
  correo_oficial      VARCHAR(255),
  telefono            VARCHAR(30),
  titular_nombre      VARCHAR(255),
  activo              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id                          BIGSERIAL PRIMARY KEY,
  unidad_id                   BIGINT REFERENCES unidades_academicas(id) ON DELETE RESTRICT,
  rol_id                      BIGINT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  nombre                      VARCHAR(100) NOT NULL,
  apellido_paterno            VARCHAR(100),
  apellido_materno            VARCHAR(100),
  correo                      VARCHAR(255) NOT NULL UNIQUE,
  username                    VARCHAR(100) NOT NULL UNIQUE,
  password_hash               TEXT NOT NULL,
  activo                      BOOLEAN NOT NULL DEFAULT TRUE,
  debe_cambiar_password       BOOLEAN NOT NULL DEFAULT TRUE,
  intentos_fallidos           INTEGER NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
  bloqueado_hasta             TIMESTAMPTZ,
  ultimo_acceso_at            TIMESTAMPTZ,
  ultimo_cambio_password_at   TIMESTAMPTZ,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ARCHIVOS
-- =========================================================
CREATE TABLE IF NOT EXISTS archivos (
  id                    BIGSERIAL PRIMARY KEY,
  nombre_original       VARCHAR(255) NOT NULL,
  nombre_storage        VARCHAR(255) NOT NULL,
  ruta_storage          TEXT NOT NULL,
  mime_type             VARCHAR(150) NOT NULL,
  extension             VARCHAR(20),
  tamano_bytes          BIGINT NOT NULL CHECK (tamano_bytes >= 0),
  hash_sha256           VARCHAR(64),
  subido_por_usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_archivos_hash_sha256 UNIQUE (hash_sha256)
);

-- =========================================================
-- PLIEGOS
-- =========================================================
CREATE TABLE IF NOT EXISTS pliegos (
  id                          BIGSERIAL PRIMARY KEY,
  unidad_id                   BIGINT NOT NULL REFERENCES unidades_academicas(id) ON DELETE RESTRICT,
  folio                       VARCHAR(100) NOT NULL UNIQUE,
  titulo                      VARCHAR(255) NOT NULL,
  descripcion                 TEXT,
  periodo                     VARCHAR(100),
  anio                        INTEGER CHECK (anio IS NULL OR anio >= 2000),
  fecha_recepcion             DATE NOT NULL,
  fecha_registro              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado_pliego_id            BIGINT NOT NULL REFERENCES estados_pliego(id) ON DELETE RESTRICT,
  archivo_original_id         BIGINT REFERENCES archivos(id) ON DELETE SET NULL,
  texto_ocr_bruto             TEXT,
  texto_revision_final        TEXT,
  ocr_procesado               BOOLEAN NOT NULL DEFAULT FALSE,
  ocr_fecha_procesado         TIMESTAMPTZ,
  registrado_por_usuario_id   BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  observaciones               TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- PUNTOS DEL PLIEGO
-- =========================================================
CREATE TABLE IF NOT EXISTS pliego_puntos (
  id                          BIGSERIAL PRIMARY KEY,
  pliego_id                   BIGINT NOT NULL REFERENCES pliegos(id) ON DELETE CASCADE,
  numero_punto                INTEGER NOT NULL CHECK (numero_punto > 0),
  texto_original_ocr          TEXT,
  texto_final                 TEXT NOT NULL,
  categoria_id                BIGINT REFERENCES categorias_punto(id) ON DELETE RESTRICT,
  prioridad_id                BIGINT NOT NULL REFERENCES prioridades(id) ON DELETE RESTRICT,
  estado_punto_id             BIGINT NOT NULL REFERENCES estados_punto(id) ON DELETE RESTRICT,
  responsable_usuario_id      BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  fecha_registro              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_compromiso            DATE,
  fecha_envio_validacion      TIMESTAMPTZ,
  fecha_respuesta_unidad      TIMESTAMPTZ,
  fecha_validacion_des        TIMESTAMPTZ,
  fecha_cierre                TIMESTAMPTZ,
  origen_captura              VARCHAR(20) NOT NULL CHECK (origen_captura IN ('ocr', 'manual')),
  requiere_validacion         BOOLEAN NOT NULL DEFAULT TRUE,
  observaciones               TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pliego_puntos_numero UNIQUE (pliego_id, numero_punto),
  CONSTRAINT chk_fechas_punto
    CHECK (
      fecha_compromiso IS NULL
      OR fecha_compromiso >= DATE(fecha_registro)
    )
);

-- =========================================================
-- EVIDENCIAS
-- =========================================================
CREATE TABLE IF NOT EXISTS punto_evidencias (
  id                    BIGSERIAL PRIMARY KEY,
  punto_id              BIGINT NOT NULL REFERENCES pliego_puntos(id) ON DELETE CASCADE,
  archivo_id            BIGINT NOT NULL REFERENCES archivos(id) ON DELETE RESTRICT,
  tipo_evidencia_id     BIGINT NOT NULL REFERENCES tipos_evidencia(id) ON DELETE RESTRICT,
  titulo                VARCHAR(255),
  descripcion           TEXT,
  visible_unidad        BOOLEAN NOT NULL DEFAULT TRUE,
  visible_des           BOOLEAN NOT NULL DEFAULT TRUE,
  es_vigente            BOOLEAN NOT NULL DEFAULT TRUE,
  subido_por_usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- SEGUIMIENTO
-- =========================================================
CREATE TABLE IF NOT EXISTS punto_seguimientos (
  id                    BIGSERIAL PRIMARY KEY,
  punto_id              BIGINT NOT NULL REFERENCES pliego_puntos(id) ON DELETE CASCADE,
  usuario_id            BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo_movimiento       VARCHAR(50) NOT NULL CHECK (
                            tipo_movimiento IN (
                              'comentario',
                              'cambio_estado',
                              'carga_evidencia',
                              'asignacion',
                              'observacion',
                              'envio_validacion',
                              'validacion',
                              'rechazo'
                            )
                          ),
  comentario            TEXT,
  estado_anterior_id    BIGINT REFERENCES estados_punto(id) ON DELETE SET NULL,
  estado_nuevo_id       BIGINT REFERENCES estados_punto(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- VALIDACIONES DES
-- =========================================================
CREATE TABLE IF NOT EXISTS punto_validaciones (
  id                      BIGSERIAL PRIMARY KEY,
  punto_id                BIGINT NOT NULL REFERENCES pliego_puntos(id) ON DELETE CASCADE,
  usuario_validador_id    BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  resultado               VARCHAR(30) NOT NULL CHECK (
                              resultado IN ('aprobado', 'rechazado', 'requiere_informacion')
                           ),
  motivo_rechazo_id       BIGINT REFERENCES motivos_rechazo(id) ON DELETE RESTRICT,
  comentario              TEXT,
  es_vigente              BOOLEAN NOT NULL DEFAULT TRUE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_motivo_rechazo_requerido
    CHECK (
      (resultado = 'rechazado' AND motivo_rechazo_id IS NOT NULL)
      OR (resultado <> 'rechazado')
    )
);

-- =========================================================
-- AUDITORÍA
-- =========================================================
CREATE TABLE IF NOT EXISTS auditoria_eventos (
  id                    BIGSERIAL PRIMARY KEY,
  tabla_nombre          VARCHAR(100) NOT NULL,
  registro_id           BIGINT,
  accion                VARCHAR(50) NOT NULL CHECK (
                            accion IN (
                              'insert',
                              'update',
                              'delete',
                              'login',
                              'logout',
                              'reset_password',
                              'validacion',
                              'unlock_user',
                              'failed_login'
                            )
                          ),
  usuario_id            BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  descripcion           TEXT,
  valor_anterior_json   JSONB,
  valor_nuevo_json      JSONB,
  ip                    INET,
  user_agent            TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- SESIONES
-- =========================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id                    BIGSERIAL PRIMARY KEY,
  usuario_id            BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_jti             UUID NOT NULL DEFAULT gen_random_uuid(),
  refresh_token_hash    TEXT,
  ip                    INET,
  user_agent            TEXT,
  iniciado_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_at             TIMESTAMPTZ NOT NULL,
  cerrado_at            TIMESTAMPTZ,
  revocada              BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_revocacion     VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_sessions_token_jti UNIQUE (token_jti),
  CONSTRAINT chk_user_sessions_expira_at CHECK (expira_at > iniciado_at)
);

-- =========================================================
-- TOKENS DE RECUPERACIÓN DE CONTRASEÑA
-- recuperación con token provisional
-- =========================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id                          BIGSERIAL PRIMARY KEY,
  usuario_id                  BIGINT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash                  TEXT NOT NULL,
  token_provisional           VARCHAR(50) NOT NULL,
  solicitado_por_usuario_id   BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  ip_solicitud                INET,
  user_agent_solicitud        TEXT,
  expira_at                   TIMESTAMPTZ NOT NULL,
  usado_at                    TIMESTAMPTZ,
  cancelado_at                TIMESTAMPTZ,
  intentos_verificacion       INTEGER NOT NULL DEFAULT 0 CHECK (intentos_verificacion >= 0),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_password_reset_tokens_token_provisional UNIQUE (token_provisional),
  CONSTRAINT chk_password_reset_tokens_expira_at CHECK (expira_at > created_at)
);

-- =========================================================
-- INTENTOS DE LOGIN
-- =========================================================
CREATE TABLE IF NOT EXISTS login_intentos (
  id                    BIGSERIAL PRIMARY KEY,
  usuario_id            BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
  username_intentado    VARCHAR(100),
  correo_intentado      VARCHAR(255),
  ip                    INET,
  user_agent            TEXT,
  exitoso               BOOLEAN NOT NULL DEFAULT FALSE,
  motivo                VARCHAR(255),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================
-- ÍNDICES
-- =========================================================
CREATE INDEX IF NOT EXISTS idx_usuarios_unidad_id
  ON usuarios(unidad_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id
  ON usuarios(rol_id);

CREATE INDEX IF NOT EXISTS idx_pliegos_unidad_id
  ON pliegos(unidad_id);

CREATE INDEX IF NOT EXISTS idx_pliegos_estado_pliego_id
  ON pliegos(estado_pliego_id);

CREATE INDEX IF NOT EXISTS idx_pliegos_fecha_recepcion
  ON pliegos(fecha_recepcion);

CREATE INDEX IF NOT EXISTS idx_pliego_puntos_pliego_id
  ON pliego_puntos(pliego_id);

CREATE INDEX IF NOT EXISTS idx_pliego_puntos_estado_punto_id
  ON pliego_puntos(estado_punto_id);

CREATE INDEX IF NOT EXISTS idx_pliego_puntos_categoria_id
  ON pliego_puntos(categoria_id);

CREATE INDEX IF NOT EXISTS idx_pliego_puntos_prioridad_id
  ON pliego_puntos(prioridad_id);

CREATE INDEX IF NOT EXISTS idx_pliego_puntos_fecha_compromiso
  ON pliego_puntos(fecha_compromiso);

CREATE INDEX IF NOT EXISTS idx_punto_evidencias_punto_id
  ON punto_evidencias(punto_id);

CREATE INDEX IF NOT EXISTS idx_punto_validaciones_punto_id
  ON punto_validaciones(punto_id);

CREATE INDEX IF NOT EXISTS idx_punto_validaciones_es_vigente
  ON punto_validaciones(es_vigente);

CREATE INDEX IF NOT EXISTS idx_punto_seguimientos_punto_id
  ON punto_seguimientos(punto_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_tabla_registro
  ON auditoria_eventos(tabla_nombre, registro_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_eventos_usuario_id
  ON auditoria_eventos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_usuario_id
  ON user_sessions(usuario_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expira_at
  ON user_sessions(expira_at);

CREATE INDEX IF NOT EXISTS idx_user_sessions_revocada
  ON user_sessions(revocada);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_usuario_id
  ON password_reset_tokens(usuario_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expira_at
  ON password_reset_tokens(expira_at);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_usado_at
  ON password_reset_tokens(usado_at);

CREATE INDEX IF NOT EXISTS idx_login_intentos_usuario_id
  ON login_intentos(usuario_id);

CREATE INDEX IF NOT EXISTS idx_login_intentos_created_at
  ON login_intentos(created_at);

-- =========================================================
-- RESTRICCIONES PARCIALES IMPORTANTES
-- =========================================================

-- Solo una validación vigente por punto
CREATE UNIQUE INDEX IF NOT EXISTS uq_punto_validaciones_una_vigente
  ON punto_validaciones(punto_id)
  WHERE es_vigente = TRUE;

-- Solo un token activo por usuario
CREATE UNIQUE INDEX IF NOT EXISTS uq_password_reset_tokens_uno_activo_por_usuario
  ON password_reset_tokens(usuario_id)
  WHERE usado_at IS NULL AND cancelado_at IS NULL;

-- =========================================================
-- FUNCIONES DE REGLAS DE NEGOCIO
-- =========================================================

-- Validar coherencia entre rol y unidad
CREATE OR REPLACE FUNCTION validar_usuario_ambito()
RETURNS TRIGGER AS $$
DECLARE
  v_ambito VARCHAR(20);
BEGIN
  SELECT ambito INTO v_ambito
  FROM roles
  WHERE id = NEW.rol_id;

  IF v_ambito IS NULL THEN
    RAISE EXCEPTION 'Rol inexistente o sin ámbito válido';
  END IF;

  IF v_ambito = 'DES' AND NEW.unidad_id IS NOT NULL THEN
    RAISE EXCEPTION 'Los usuarios con rol DES no deben tener unidad_id';
  END IF;

  IF v_ambito = 'UNIDAD' AND NEW.unidad_id IS NULL THEN
    RAISE EXCEPTION 'Los usuarios con rol UNIDAD deben tener unidad_id';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Desactivar validaciones vigentes anteriores
CREATE OR REPLACE FUNCTION desactivar_validaciones_vigentes_previas()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.es_vigente = TRUE THEN
    UPDATE punto_validaciones
       SET es_vigente = FALSE
     WHERE punto_id = NEW.punto_id
       AND id <> COALESCE(NEW.id, 0)
       AND es_vigente = TRUE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cancelar tokens activos previos del mismo usuario
CREATE OR REPLACE FUNCTION cancelar_tokens_activos_previos()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.usado_at IS NULL AND NEW.cancelado_at IS NULL THEN
    UPDATE password_reset_tokens
       SET cancelado_at = NOW()
     WHERE usuario_id = NEW.usuario_id
       AND id <> COALESCE(NEW.id, 0)
       AND usado_at IS NULL
       AND cancelado_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auditoría general
CREATE OR REPLACE FUNCTION audit_if_modified()
RETURNS TRIGGER AS $$
DECLARE
  v_usuario_id BIGINT;
BEGIN
  BEGIN
    v_usuario_id := NULLIF(current_setting('app.user_id', true), '')::BIGINT;
  EXCEPTION WHEN OTHERS THEN
    v_usuario_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO auditoria_eventos (
      tabla_nombre,
      registro_id,
      accion,
      usuario_id,
      descripcion,
      valor_anterior_json,
      valor_nuevo_json,
      created_at
    )
    VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'insert',
      v_usuario_id,
      'Inserción de registro',
      NULL,
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO auditoria_eventos (
      tabla_nombre,
      registro_id,
      accion,
      usuario_id,
      descripcion,
      valor_anterior_json,
      valor_nuevo_json,
      created_at
    )
    VALUES (
      TG_TABLE_NAME,
      NEW.id,
      'update',
      v_usuario_id,
      'Actualización de registro',
      to_jsonb(OLD),
      to_jsonb(NEW),
      NOW()
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO auditoria_eventos (
      tabla_nombre,
      registro_id,
      accion,
      usuario_id,
      descripcion,
      valor_anterior_json,
      valor_nuevo_json,
      created_at
    )
    VALUES (
      TG_TABLE_NAME,
      OLD.id,
      'delete',
      v_usuario_id,
      'Eliminación de registro',
      to_jsonb(OLD),
      NULL,
      NOW()
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Función manual para eventos especiales
CREATE OR REPLACE FUNCTION registrar_evento_auditoria(
  p_tabla_nombre        VARCHAR,
  p_registro_id         BIGINT,
  p_accion              VARCHAR,
  p_usuario_id          BIGINT,
  p_descripcion         TEXT,
  p_valor_anterior_json JSONB DEFAULT NULL,
  p_valor_nuevo_json    JSONB DEFAULT NULL,
  p_ip                  INET DEFAULT NULL,
  p_user_agent          TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO auditoria_eventos (
    tabla_nombre,
    registro_id,
    accion,
    usuario_id,
    descripcion,
    valor_anterior_json,
    valor_nuevo_json,
    ip,
    user_agent,
    created_at
  )
  VALUES (
    p_tabla_nombre,
    p_registro_id,
    p_accion,
    p_usuario_id,
    p_descripcion,
    p_valor_anterior_json,
    p_valor_nuevo_json,
    p_ip,
    p_user_agent,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- TRIGGERS updated_at
-- =========================================================
DROP TRIGGER IF EXISTS trg_roles_updated_at ON roles;
CREATE TRIGGER trg_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_categorias_punto_updated_at ON categorias_punto;
CREATE TRIGGER trg_categorias_punto_updated_at
BEFORE UPDATE ON categorias_punto
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_prioridades_updated_at ON prioridades;
CREATE TRIGGER trg_prioridades_updated_at
BEFORE UPDATE ON prioridades
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_estados_pliego_updated_at ON estados_pliego;
CREATE TRIGGER trg_estados_pliego_updated_at
BEFORE UPDATE ON estados_pliego
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_estados_punto_updated_at ON estados_punto;
CREATE TRIGGER trg_estados_punto_updated_at
BEFORE UPDATE ON estados_punto
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_tipos_evidencia_updated_at ON tipos_evidencia;
CREATE TRIGGER trg_tipos_evidencia_updated_at
BEFORE UPDATE ON tipos_evidencia
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_motivos_rechazo_updated_at ON motivos_rechazo;
CREATE TRIGGER trg_motivos_rechazo_updated_at
BEFORE UPDATE ON motivos_rechazo
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_permisos_updated_at ON permisos;
CREATE TRIGGER trg_permisos_updated_at
BEFORE UPDATE ON permisos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_unidades_academicas_updated_at ON unidades_academicas;
CREATE TRIGGER trg_unidades_academicas_updated_at
BEFORE UPDATE ON unidades_academicas
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_usuarios_updated_at ON usuarios;
CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pliegos_updated_at ON pliegos;
CREATE TRIGGER trg_pliegos_updated_at
BEFORE UPDATE ON pliegos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pliego_puntos_updated_at ON pliego_puntos;
CREATE TRIGGER trg_pliego_puntos_updated_at
BEFORE UPDATE ON pliego_puntos
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_user_sessions_updated_at ON user_sessions;
CREATE TRIGGER trg_user_sessions_updated_at
BEFORE UPDATE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_password_reset_tokens_updated_at ON password_reset_tokens;
CREATE TRIGGER trg_password_reset_tokens_updated_at
BEFORE UPDATE ON password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================================
-- TRIGGERS DE REGLAS DE NEGOCIO
-- =========================================================
DROP TRIGGER IF EXISTS trg_validar_usuario_ambito ON usuarios;
CREATE TRIGGER trg_validar_usuario_ambito
BEFORE INSERT OR UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION validar_usuario_ambito();

DROP TRIGGER IF EXISTS trg_desactivar_validaciones_vigentes_previas ON punto_validaciones;
CREATE TRIGGER trg_desactivar_validaciones_vigentes_previas
BEFORE INSERT OR UPDATE ON punto_validaciones
FOR EACH ROW
EXECUTE FUNCTION desactivar_validaciones_vigentes_previas();

DROP TRIGGER IF EXISTS trg_cancelar_tokens_activos_previos ON password_reset_tokens;
CREATE TRIGGER trg_cancelar_tokens_activos_previos
BEFORE INSERT OR UPDATE ON password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION cancelar_tokens_activos_previos();

-- =========================================================
-- TRIGGERS DE AUDITORÍA
-- =========================================================

-- Catálogos
DROP TRIGGER IF EXISTS trg_audit_roles ON roles;
CREATE TRIGGER trg_audit_roles
AFTER INSERT OR UPDATE OR DELETE ON roles
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_categorias_punto ON categorias_punto;
CREATE TRIGGER trg_audit_categorias_punto
AFTER INSERT OR UPDATE OR DELETE ON categorias_punto
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_prioridades ON prioridades;
CREATE TRIGGER trg_audit_prioridades
AFTER INSERT OR UPDATE OR DELETE ON prioridades
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_estados_pliego ON estados_pliego;
CREATE TRIGGER trg_audit_estados_pliego
AFTER INSERT OR UPDATE OR DELETE ON estados_pliego
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_estados_punto ON estados_punto;
CREATE TRIGGER trg_audit_estados_punto
AFTER INSERT OR UPDATE OR DELETE ON estados_punto
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_tipos_evidencia ON tipos_evidencia;
CREATE TRIGGER trg_audit_tipos_evidencia
AFTER INSERT OR UPDATE OR DELETE ON tipos_evidencia
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_motivos_rechazo ON motivos_rechazo;
CREATE TRIGGER trg_audit_motivos_rechazo
AFTER INSERT OR UPDATE OR DELETE ON motivos_rechazo
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_permisos ON permisos;
CREATE TRIGGER trg_audit_permisos
AFTER INSERT OR UPDATE OR DELETE ON permisos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_rol_permisos ON rol_permisos;
CREATE TRIGGER trg_audit_rol_permisos
AFTER INSERT OR UPDATE OR DELETE ON rol_permisos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

-- Núcleo y negocio
DROP TRIGGER IF EXISTS trg_audit_unidades_academicas ON unidades_academicas;
CREATE TRIGGER trg_audit_unidades_academicas
AFTER INSERT OR UPDATE OR DELETE ON unidades_academicas
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_usuarios ON usuarios;
CREATE TRIGGER trg_audit_usuarios
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_archivos ON archivos;
CREATE TRIGGER trg_audit_archivos
AFTER INSERT OR UPDATE OR DELETE ON archivos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_pliegos ON pliegos;
CREATE TRIGGER trg_audit_pliegos
AFTER INSERT OR UPDATE OR DELETE ON pliegos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_pliego_puntos ON pliego_puntos;
CREATE TRIGGER trg_audit_pliego_puntos
AFTER INSERT OR UPDATE OR DELETE ON pliego_puntos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_punto_evidencias ON punto_evidencias;
CREATE TRIGGER trg_audit_punto_evidencias
AFTER INSERT OR UPDATE OR DELETE ON punto_evidencias
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_punto_seguimientos ON punto_seguimientos;
CREATE TRIGGER trg_audit_punto_seguimientos
AFTER INSERT OR UPDATE OR DELETE ON punto_seguimientos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_punto_validaciones ON punto_validaciones;
CREATE TRIGGER trg_audit_punto_validaciones
AFTER INSERT OR UPDATE OR DELETE ON punto_validaciones
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_user_sessions ON user_sessions;
CREATE TRIGGER trg_audit_user_sessions
AFTER INSERT OR UPDATE OR DELETE ON user_sessions
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_password_reset_tokens ON password_reset_tokens;
CREATE TRIGGER trg_audit_password_reset_tokens
AFTER INSERT OR UPDATE OR DELETE ON password_reset_tokens
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

DROP TRIGGER IF EXISTS trg_audit_login_intentos ON login_intentos;
CREATE TRIGGER trg_audit_login_intentos
AFTER INSERT OR UPDATE OR DELETE ON login_intentos
FOR EACH ROW
EXECUTE FUNCTION audit_if_modified();

-- =========================================================
-- SEMILLAS BÁSICAS
-- =========================================================

-- Roles
INSERT INTO roles (clave, nombre, ambito)
VALUES
  ('SUPERADMIN_DES', 'Superadministrador DES', 'DES'),
  ('ADMIN_DES', 'Administrador DES', 'DES'),
  ('REVISOR_DES', 'Revisor DES', 'DES'),
  ('CONSULTA_DES', 'Consulta DES', 'DES'),
  ('ADMIN_UNIDAD', 'Administrador Unidad', 'UNIDAD'),
  ('CAPTURISTA_UNIDAD', 'Capturista Unidad', 'UNIDAD'),
  ('CONSULTA_UNIDAD', 'Consulta Unidad', 'UNIDAD')
ON CONFLICT (clave) DO NOTHING;

-- Categorías
INSERT INTO categorias_punto (clave, nombre, descripcion)
VALUES
  ('financiero', 'Financiero', 'Demandas relacionadas con presupuesto, recursos y apoyos'),
  ('infraestructura', 'Infraestructura', 'Espacios físicos, mantenimiento, mobiliario y obra'),
  ('academico', 'Académico', 'Planes, programas, docentes, evaluación y procesos académicos'),
  ('administrativo', 'Administrativo', 'Procesos, trámites, gestión interna y operación'),
  ('seguridad', 'Seguridad', 'Condiciones de seguridad y protección'),
  ('servicios', 'Servicios', 'Servicios escolares, conectividad, limpieza, transporte, etc.'),
  ('normativo', 'Normativo', 'Reglamentos, lineamientos y disposiciones internas'),
  ('bienestar', 'Bienestar', 'Salud, apoyo psicosocial, inclusión y comunidad'),
  ('otro', 'Otro', 'Clasificación no contemplada')
ON CONFLICT (clave) DO NOTHING;

-- Prioridades
INSERT INTO prioridades (clave, nombre, nivel_orden, dias_sla)
VALUES
  ('baja', 'Baja', 1, 30),
  ('media', 'Media', 2, 20),
  ('alta', 'Alta', 3, 10),
  ('urgente', 'Urgente', 4, 5)
ON CONFLICT (clave) DO NOTHING;

-- Estados pliego
INSERT INTO estados_pliego (clave, nombre, color_hex, orden)
VALUES
  ('recibido', 'Recibido', '#9CA3AF', 1),
  ('en_revision', 'En revisión', '#3B82F6', 2),
  ('en_seguimiento', 'En seguimiento', '#F59E0B', 3),
  ('parcialmente_atendido', 'Parcialmente atendido', '#F97316', 4),
  ('atendido', 'Atendido', '#10B981', 5),
  ('cerrado', 'Cerrado', '#374151', 6)
ON CONFLICT (clave) DO NOTHING;

-- Estados punto
INSERT INTO estados_punto (clave, nombre, color_hex, orden, es_terminal)
VALUES
  ('detectado', 'Detectado', '#9CA3AF', 1, FALSE),
  ('validado', 'Validado', '#3B82F6', 2, FALSE),
  ('en_proceso', 'En proceso', '#F59E0B', 3, FALSE),
  ('con_propuesta_solucion', 'Con propuesta de solución', '#8B5CF6', 4, FALSE),
  ('enviado_validacion', 'Enviado a validación', '#2563EB', 5, FALSE),
  ('requiere_informacion', 'Requiere información', '#F97316', 6, FALSE),
  ('rechazado', 'Rechazado', '#DC2626', 7, FALSE),
  ('resuelto', 'Resuelto', '#10B981', 8, TRUE),
  ('cerrado', 'Cerrado', '#374151', 9, TRUE),
  ('no_procedente', 'No procedente', '#111827', 10, TRUE)
ON CONFLICT (clave) DO NOTHING;

-- Tipos de evidencia
INSERT INTO tipos_evidencia (clave, nombre)
VALUES
  ('oficio', 'Oficio'),
  ('minuta', 'Minuta'),
  ('fotografia', 'Fotografía'),
  ('pdf', 'PDF'),
  ('respuesta_institucional', 'Respuesta institucional'),
  ('acta', 'Acta'),
  ('documento_tecnico', 'Documento técnico'),
  ('otro', 'Otro')
ON CONFLICT (clave) DO NOTHING;

-- Motivos de rechazo
INSERT INTO motivos_rechazo (clave, nombre, descripcion)
VALUES
  ('evidencia_insuficiente', 'Evidencia insuficiente', 'La evidencia presentada no acredita suficientemente el cumplimiento'),
  ('documento_incompleto', 'Documento incompleto', 'El documento carece de información relevante o partes necesarias'),
  ('no_corresponde_al_punto', 'No corresponde al punto', 'La evidencia no guarda relación directa con el punto atendido'),
  ('falta_firma', 'Falta firma', 'El documento requiere firma o formalidad faltante'),
  ('solucion_parcial', 'Solución parcial', 'La solución presentada no cubre completamente la demanda'),
  ('otro', 'Otro', 'Otro motivo no catalogado')
ON CONFLICT (clave) DO NOTHING;

-- Permisos base sugeridos
INSERT INTO permisos (clave, nombre, modulo)
VALUES
  ('unidades.crear', 'Crear unidades académicas', 'unidades'),
  ('unidades.editar', 'Editar unidades académicas', 'unidades'),
  ('unidades.ver', 'Ver unidades académicas', 'unidades'),

  ('usuarios.crear', 'Crear usuarios', 'usuarios'),
  ('usuarios.editar', 'Editar usuarios', 'usuarios'),
  ('usuarios.ver', 'Ver usuarios', 'usuarios'),
  ('usuarios.reset_password', 'Resetear contraseña', 'usuarios'),
  ('usuarios.bloquear', 'Bloquear o desbloquear usuarios', 'usuarios'),

  ('pliegos.crear', 'Crear pliegos', 'pliegos'),
  ('pliegos.editar', 'Editar pliegos', 'pliegos'),
  ('pliegos.ver', 'Ver pliegos', 'pliegos'),

  ('puntos.crear', 'Crear puntos', 'puntos'),
  ('puntos.editar', 'Editar puntos', 'puntos'),
  ('puntos.ver', 'Ver puntos', 'puntos'),
  ('puntos.validar', 'Validar puntos', 'puntos'),
  ('puntos.rechazar', 'Rechazar puntos', 'puntos'),

  ('evidencias.subir', 'Subir evidencias', 'evidencias'),
  ('evidencias.ver', 'Ver evidencias', 'evidencias'),

  ('seguimientos.crear', 'Crear seguimientos', 'seguimientos'),
  ('seguimientos.ver', 'Ver seguimientos', 'seguimientos'),

  ('reportes.ver_global', 'Ver reportes globales', 'reportes'),
  ('reportes.ver_unidad', 'Ver reportes por unidad', 'reportes')
ON CONFLICT (clave) DO NOTHING;

COMMIT;