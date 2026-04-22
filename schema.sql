--
-- PostgreSQL database dump
--

\restrict uqbZydhe4KqdbAGoPcvlfMPvoP7y0YhddibF5bRIUPXKxUfs4a2QYyaO14NzP0L

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY "public"."usuarios" DROP CONSTRAINT IF EXISTS "usuarios_unidad_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."usuarios" DROP CONSTRAINT IF EXISTS "usuarios_rol_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."rol_permisos" DROP CONSTRAINT IF EXISTS "rol_permisos_rol_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."rol_permisos" DROP CONSTRAINT IF EXISTS "rol_permisos_permiso_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_validaciones" DROP CONSTRAINT IF EXISTS "punto_validaciones_usuario_validador_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_validaciones" DROP CONSTRAINT IF EXISTS "punto_validaciones_punto_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_validaciones" DROP CONSTRAINT IF EXISTS "punto_validaciones_motivo_rechazo_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_seguimientos" DROP CONSTRAINT IF EXISTS "punto_seguimientos_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_seguimientos" DROP CONSTRAINT IF EXISTS "punto_seguimientos_punto_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_seguimientos" DROP CONSTRAINT IF EXISTS "punto_seguimientos_estado_nuevo_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_seguimientos" DROP CONSTRAINT IF EXISTS "punto_seguimientos_estado_anterior_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_evidencias" DROP CONSTRAINT IF EXISTS "punto_evidencias_tipo_evidencia_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_evidencias" DROP CONSTRAINT IF EXISTS "punto_evidencias_subido_por_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_evidencias" DROP CONSTRAINT IF EXISTS "punto_evidencias_punto_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_evidencias" DROP CONSTRAINT IF EXISTS "punto_evidencias_archivo_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliegos" DROP CONSTRAINT IF EXISTS "pliegos_unidad_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliegos" DROP CONSTRAINT IF EXISTS "pliegos_registrado_por_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliegos" DROP CONSTRAINT IF EXISTS "pliegos_estado_pliego_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliegos" DROP CONSTRAINT IF EXISTS "pliegos_archivo_original_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "pliego_puntos_responsable_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "pliego_puntos_prioridad_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "pliego_puntos_pliego_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "pliego_puntos_estado_punto_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "pliego_puntos_categoria_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_solicitado_por_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."login_intentos" DROP CONSTRAINT IF EXISTS "login_intentos_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."auditoria_eventos" DROP CONSTRAINT IF EXISTS "auditoria_eventos_usuario_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."archivos" DROP CONSTRAINT IF EXISTS "archivos_subido_por_usuario_id_fkey";
DROP TRIGGER IF EXISTS "trg_validar_usuario_ambito" ON "public"."usuarios";
DROP TRIGGER IF EXISTS "trg_usuarios_updated_at" ON "public"."usuarios";
DROP TRIGGER IF EXISTS "trg_user_sessions_updated_at" ON "public"."user_sessions";
DROP TRIGGER IF EXISTS "trg_unidades_academicas_updated_at" ON "public"."unidades_academicas";
DROP TRIGGER IF EXISTS "trg_tipos_evidencia_updated_at" ON "public"."tipos_evidencia";
DROP TRIGGER IF EXISTS "trg_roles_updated_at" ON "public"."roles";
DROP TRIGGER IF EXISTS "trg_prioridades_updated_at" ON "public"."prioridades";
DROP TRIGGER IF EXISTS "trg_pliegos_updated_at" ON "public"."pliegos";
DROP TRIGGER IF EXISTS "trg_pliego_puntos_updated_at" ON "public"."pliego_puntos";
DROP TRIGGER IF EXISTS "trg_permisos_updated_at" ON "public"."permisos";
DROP TRIGGER IF EXISTS "trg_password_reset_tokens_updated_at" ON "public"."password_reset_tokens";
DROP TRIGGER IF EXISTS "trg_motivos_rechazo_updated_at" ON "public"."motivos_rechazo";
DROP TRIGGER IF EXISTS "trg_estados_punto_updated_at" ON "public"."estados_punto";
DROP TRIGGER IF EXISTS "trg_estados_pliego_updated_at" ON "public"."estados_pliego";
DROP TRIGGER IF EXISTS "trg_desactivar_validaciones_vigentes_previas" ON "public"."punto_validaciones";
DROP TRIGGER IF EXISTS "trg_categorias_punto_updated_at" ON "public"."categorias_punto";
DROP TRIGGER IF EXISTS "trg_cancelar_tokens_activos_previos" ON "public"."password_reset_tokens";
DROP TRIGGER IF EXISTS "trg_audit_usuarios" ON "public"."usuarios";
DROP TRIGGER IF EXISTS "trg_audit_user_sessions" ON "public"."user_sessions";
DROP TRIGGER IF EXISTS "trg_audit_unidades_academicas" ON "public"."unidades_academicas";
DROP TRIGGER IF EXISTS "trg_audit_tipos_evidencia" ON "public"."tipos_evidencia";
DROP TRIGGER IF EXISTS "trg_audit_roles" ON "public"."roles";
DROP TRIGGER IF EXISTS "trg_audit_rol_permisos" ON "public"."rol_permisos";
DROP TRIGGER IF EXISTS "trg_audit_punto_validaciones" ON "public"."punto_validaciones";
DROP TRIGGER IF EXISTS "trg_audit_punto_seguimientos" ON "public"."punto_seguimientos";
DROP TRIGGER IF EXISTS "trg_audit_punto_evidencias" ON "public"."punto_evidencias";
DROP TRIGGER IF EXISTS "trg_audit_prioridades" ON "public"."prioridades";
DROP TRIGGER IF EXISTS "trg_audit_pliegos" ON "public"."pliegos";
DROP TRIGGER IF EXISTS "trg_audit_pliego_puntos" ON "public"."pliego_puntos";
DROP TRIGGER IF EXISTS "trg_audit_permisos" ON "public"."permisos";
DROP TRIGGER IF EXISTS "trg_audit_password_reset_tokens" ON "public"."password_reset_tokens";
DROP TRIGGER IF EXISTS "trg_audit_motivos_rechazo" ON "public"."motivos_rechazo";
DROP TRIGGER IF EXISTS "trg_audit_login_intentos" ON "public"."login_intentos";
DROP TRIGGER IF EXISTS "trg_audit_estados_punto" ON "public"."estados_punto";
DROP TRIGGER IF EXISTS "trg_audit_estados_pliego" ON "public"."estados_pliego";
DROP TRIGGER IF EXISTS "trg_audit_categorias_punto" ON "public"."categorias_punto";
DROP TRIGGER IF EXISTS "trg_audit_archivos" ON "public"."archivos";
DROP INDEX IF EXISTS "public"."uq_unidades_academicas_clave_upper";
DROP INDEX IF EXISTS "public"."uq_punto_validaciones_una_vigente";
DROP INDEX IF EXISTS "public"."uq_password_reset_tokens_uno_activo_por_usuario";
DROP INDEX IF EXISTS "public"."idx_usuarios_unidad_id";
DROP INDEX IF EXISTS "public"."idx_usuarios_rol_id";
DROP INDEX IF EXISTS "public"."idx_user_sessions_usuario_id";
DROP INDEX IF EXISTS "public"."idx_user_sessions_revocada";
DROP INDEX IF EXISTS "public"."idx_user_sessions_expira_at";
DROP INDEX IF EXISTS "public"."idx_punto_validaciones_punto_id";
DROP INDEX IF EXISTS "public"."idx_punto_validaciones_es_vigente";
DROP INDEX IF EXISTS "public"."idx_punto_seguimientos_punto_id";
DROP INDEX IF EXISTS "public"."idx_punto_evidencias_punto_id";
DROP INDEX IF EXISTS "public"."idx_pliegos_unidad_id";
DROP INDEX IF EXISTS "public"."idx_pliegos_fecha_recepcion";
DROP INDEX IF EXISTS "public"."idx_pliegos_estado_pliego_id";
DROP INDEX IF EXISTS "public"."idx_pliego_puntos_prioridad_id";
DROP INDEX IF EXISTS "public"."idx_pliego_puntos_pliego_id";
DROP INDEX IF EXISTS "public"."idx_pliego_puntos_fecha_compromiso";
DROP INDEX IF EXISTS "public"."idx_pliego_puntos_estado_punto_id";
DROP INDEX IF EXISTS "public"."idx_pliego_puntos_categoria_id";
DROP INDEX IF EXISTS "public"."idx_password_reset_tokens_usuario_id";
DROP INDEX IF EXISTS "public"."idx_password_reset_tokens_usado_at";
DROP INDEX IF EXISTS "public"."idx_password_reset_tokens_expira_at";
DROP INDEX IF EXISTS "public"."idx_login_intentos_usuario_id";
DROP INDEX IF EXISTS "public"."idx_login_intentos_created_at";
DROP INDEX IF EXISTS "public"."idx_auditoria_eventos_usuario_id";
DROP INDEX IF EXISTS "public"."idx_auditoria_eventos_tabla_registro";
ALTER TABLE IF EXISTS ONLY "public"."usuarios" DROP CONSTRAINT IF EXISTS "usuarios_username_key";
ALTER TABLE IF EXISTS ONLY "public"."usuarios" DROP CONSTRAINT IF EXISTS "usuarios_pkey";
ALTER TABLE IF EXISTS ONLY "public"."usuarios" DROP CONSTRAINT IF EXISTS "usuarios_correo_key";
ALTER TABLE IF EXISTS ONLY "public"."user_sessions" DROP CONSTRAINT IF EXISTS "user_sessions_pkey";
ALTER TABLE IF EXISTS ONLY "public"."user_sessions" DROP CONSTRAINT IF EXISTS "uq_user_sessions_token_jti";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "uq_pliego_puntos_numero";
ALTER TABLE IF EXISTS ONLY "public"."password_reset_tokens" DROP CONSTRAINT IF EXISTS "uq_password_reset_tokens_token_provisional";
ALTER TABLE IF EXISTS ONLY "public"."archivos" DROP CONSTRAINT IF EXISTS "uq_archivos_hash_sha256";
ALTER TABLE IF EXISTS ONLY "public"."unidades_academicas" DROP CONSTRAINT IF EXISTS "unidades_academicas_pkey";
ALTER TABLE IF EXISTS ONLY "public"."unidades_academicas" DROP CONSTRAINT IF EXISTS "unidades_academicas_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."tipos_evidencia" DROP CONSTRAINT IF EXISTS "tipos_evidencia_pkey";
ALTER TABLE IF EXISTS ONLY "public"."tipos_evidencia" DROP CONSTRAINT IF EXISTS "tipos_evidencia_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."roles" DROP CONSTRAINT IF EXISTS "roles_pkey";
ALTER TABLE IF EXISTS ONLY "public"."roles" DROP CONSTRAINT IF EXISTS "roles_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."rol_permisos" DROP CONSTRAINT IF EXISTS "rol_permisos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_validaciones" DROP CONSTRAINT IF EXISTS "punto_validaciones_pkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_seguimientos" DROP CONSTRAINT IF EXISTS "punto_seguimientos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."punto_evidencias" DROP CONSTRAINT IF EXISTS "punto_evidencias_pkey";
ALTER TABLE IF EXISTS ONLY "public"."prioridades" DROP CONSTRAINT IF EXISTS "prioridades_pkey";
ALTER TABLE IF EXISTS ONLY "public"."prioridades" DROP CONSTRAINT IF EXISTS "prioridades_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."pliegos" DROP CONSTRAINT IF EXISTS "pliegos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."pliegos" DROP CONSTRAINT IF EXISTS "pliegos_folio_key";
ALTER TABLE IF EXISTS ONLY "public"."pliego_puntos" DROP CONSTRAINT IF EXISTS "pliego_puntos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."permisos" DROP CONSTRAINT IF EXISTS "permisos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."permisos" DROP CONSTRAINT IF EXISTS "permisos_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."password_reset_tokens" DROP CONSTRAINT IF EXISTS "password_reset_tokens_pkey";
ALTER TABLE IF EXISTS ONLY "public"."motivos_rechazo" DROP CONSTRAINT IF EXISTS "motivos_rechazo_pkey";
ALTER TABLE IF EXISTS ONLY "public"."motivos_rechazo" DROP CONSTRAINT IF EXISTS "motivos_rechazo_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."login_intentos" DROP CONSTRAINT IF EXISTS "login_intentos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."estados_punto" DROP CONSTRAINT IF EXISTS "estados_punto_pkey";
ALTER TABLE IF EXISTS ONLY "public"."estados_punto" DROP CONSTRAINT IF EXISTS "estados_punto_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."estados_pliego" DROP CONSTRAINT IF EXISTS "estados_pliego_pkey";
ALTER TABLE IF EXISTS ONLY "public"."estados_pliego" DROP CONSTRAINT IF EXISTS "estados_pliego_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."categorias_punto" DROP CONSTRAINT IF EXISTS "categorias_punto_pkey";
ALTER TABLE IF EXISTS ONLY "public"."categorias_punto" DROP CONSTRAINT IF EXISTS "categorias_punto_clave_key";
ALTER TABLE IF EXISTS ONLY "public"."auditoria_eventos" DROP CONSTRAINT IF EXISTS "auditoria_eventos_pkey";
ALTER TABLE IF EXISTS ONLY "public"."archivos" DROP CONSTRAINT IF EXISTS "archivos_pkey";
ALTER TABLE IF EXISTS "public"."usuarios" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."user_sessions" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."unidades_academicas" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."tipos_evidencia" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."roles" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."punto_validaciones" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."punto_seguimientos" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."punto_evidencias" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."prioridades" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."pliegos" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."pliego_puntos" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."permisos" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."password_reset_tokens" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."motivos_rechazo" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."login_intentos" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."estados_punto" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."estados_pliego" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."categorias_punto" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."auditoria_eventos" ALTER COLUMN "id" DROP DEFAULT;
ALTER TABLE IF EXISTS "public"."archivos" ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE IF EXISTS "public"."usuarios_id_seq";
DROP TABLE IF EXISTS "public"."usuarios";
DROP SEQUENCE IF EXISTS "public"."user_sessions_id_seq";
DROP TABLE IF EXISTS "public"."user_sessions";
DROP SEQUENCE IF EXISTS "public"."unidades_academicas_id_seq";
DROP TABLE IF EXISTS "public"."unidades_academicas";
DROP SEQUENCE IF EXISTS "public"."tipos_evidencia_id_seq";
DROP TABLE IF EXISTS "public"."tipos_evidencia";
DROP SEQUENCE IF EXISTS "public"."roles_id_seq";
DROP TABLE IF EXISTS "public"."roles";
DROP TABLE IF EXISTS "public"."rol_permisos";
DROP SEQUENCE IF EXISTS "public"."punto_validaciones_id_seq";
DROP TABLE IF EXISTS "public"."punto_validaciones";
DROP SEQUENCE IF EXISTS "public"."punto_seguimientos_id_seq";
DROP TABLE IF EXISTS "public"."punto_seguimientos";
DROP SEQUENCE IF EXISTS "public"."punto_evidencias_id_seq";
DROP TABLE IF EXISTS "public"."punto_evidencias";
DROP SEQUENCE IF EXISTS "public"."prioridades_id_seq";
DROP TABLE IF EXISTS "public"."prioridades";
DROP SEQUENCE IF EXISTS "public"."pliegos_id_seq";
DROP TABLE IF EXISTS "public"."pliegos";
DROP SEQUENCE IF EXISTS "public"."pliego_puntos_id_seq";
DROP TABLE IF EXISTS "public"."pliego_puntos";
DROP SEQUENCE IF EXISTS "public"."permisos_id_seq";
DROP TABLE IF EXISTS "public"."permisos";
DROP SEQUENCE IF EXISTS "public"."password_reset_tokens_id_seq";
DROP TABLE IF EXISTS "public"."password_reset_tokens";
DROP SEQUENCE IF EXISTS "public"."motivos_rechazo_id_seq";
DROP TABLE IF EXISTS "public"."motivos_rechazo";
DROP SEQUENCE IF EXISTS "public"."login_intentos_id_seq";
DROP TABLE IF EXISTS "public"."login_intentos";
DROP SEQUENCE IF EXISTS "public"."estados_punto_id_seq";
DROP TABLE IF EXISTS "public"."estados_punto";
DROP SEQUENCE IF EXISTS "public"."estados_pliego_id_seq";
DROP TABLE IF EXISTS "public"."estados_pliego";
DROP SEQUENCE IF EXISTS "public"."categorias_punto_id_seq";
DROP TABLE IF EXISTS "public"."categorias_punto";
DROP SEQUENCE IF EXISTS "public"."auditoria_eventos_id_seq";
DROP TABLE IF EXISTS "public"."auditoria_eventos";
DROP SEQUENCE IF EXISTS "public"."archivos_id_seq";
DROP TABLE IF EXISTS "public"."archivos";
DROP FUNCTION IF EXISTS "public"."validar_usuario_ambito"();
DROP FUNCTION IF EXISTS "public"."set_updated_at"();
DROP FUNCTION IF EXISTS "public"."registrar_evento_auditoria"("p_tabla_nombre" character varying, "p_registro_id" bigint, "p_accion" character varying, "p_usuario_id" bigint, "p_descripcion" "text", "p_valor_anterior_json" "jsonb", "p_valor_nuevo_json" "jsonb", "p_ip" "inet", "p_user_agent" "text");
DROP FUNCTION IF EXISTS "public"."desactivar_validaciones_vigentes_previas"();
DROP FUNCTION IF EXISTS "public"."cancelar_tokens_activos_previos"();
DROP FUNCTION IF EXISTS "public"."audit_if_modified"();
DROP EXTENSION IF EXISTS "pgcrypto";
--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "public";


--
-- Name: audit_if_modified(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."audit_if_modified"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


--
-- Name: cancelar_tokens_activos_previos(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."cancelar_tokens_activos_previos"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


--
-- Name: desactivar_validaciones_vigentes_previas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."desactivar_validaciones_vigentes_previas"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


--
-- Name: registrar_evento_auditoria(character varying, bigint, character varying, bigint, "text", "jsonb", "jsonb", "inet", "text"); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."registrar_evento_auditoria"("p_tabla_nombre" character varying, "p_registro_id" bigint, "p_accion" character varying, "p_usuario_id" bigint, "p_descripcion" "text", "p_valor_anterior_json" "jsonb" DEFAULT NULL::"jsonb", "p_valor_nuevo_json" "jsonb" DEFAULT NULL::"jsonb", "p_ip" "inet" DEFAULT NULL::"inet", "p_user_agent" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


--
-- Name: validar_usuario_ambito(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION "public"."validar_usuario_ambito"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: archivos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."archivos" (
    "id" bigint NOT NULL,
    "nombre_original" character varying(255) NOT NULL,
    "nombre_storage" character varying(255) NOT NULL,
    "ruta_storage" "text" NOT NULL,
    "mime_type" character varying(150) NOT NULL,
    "extension" character varying(20),
    "tamano_bytes" bigint NOT NULL,
    "hash_sha256" character varying(64),
    "subido_por_usuario_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "archivos_tamano_bytes_check" CHECK (("tamano_bytes" >= 0))
);


--
-- Name: archivos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."archivos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: archivos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."archivos_id_seq" OWNED BY "public"."archivos"."id";


--
-- Name: auditoria_eventos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."auditoria_eventos" (
    "id" bigint NOT NULL,
    "tabla_nombre" character varying(100) NOT NULL,
    "registro_id" bigint,
    "accion" character varying(50) NOT NULL,
    "usuario_id" bigint,
    "descripcion" "text",
    "valor_anterior_json" "jsonb",
    "valor_nuevo_json" "jsonb",
    "ip" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "auditoria_eventos_accion_check" CHECK ((("accion")::"text" = ANY ((ARRAY['insert'::character varying, 'update'::character varying, 'delete'::character varying, 'login'::character varying, 'logout'::character varying, 'reset_password'::character varying, 'validacion'::character varying, 'unlock_user'::character varying, 'failed_login'::character varying])::"text"[])))
);


--
-- Name: auditoria_eventos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."auditoria_eventos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auditoria_eventos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."auditoria_eventos_id_seq" OWNED BY "public"."auditoria_eventos"."id";


--
-- Name: categorias_punto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."categorias_punto" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "descripcion" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: categorias_punto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."categorias_punto_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_punto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."categorias_punto_id_seq" OWNED BY "public"."categorias_punto"."id";


--
-- Name: estados_pliego; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."estados_pliego" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "color_hex" character varying(7),
    "orden" integer DEFAULT 1 NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_estados_pliego_color_hex" CHECK ((("color_hex" IS NULL) OR (("color_hex")::"text" ~ '^#[0-9A-Fa-f]{6}$'::"text")))
);


--
-- Name: estados_pliego_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."estados_pliego_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estados_pliego_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."estados_pliego_id_seq" OWNED BY "public"."estados_pliego"."id";


--
-- Name: estados_punto; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."estados_punto" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "color_hex" character varying(7),
    "orden" integer DEFAULT 1 NOT NULL,
    "es_terminal" boolean DEFAULT false NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_estados_punto_color_hex" CHECK ((("color_hex" IS NULL) OR (("color_hex")::"text" ~ '^#[0-9A-Fa-f]{6}$'::"text")))
);


--
-- Name: estados_punto_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."estados_punto_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estados_punto_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."estados_punto_id_seq" OWNED BY "public"."estados_punto"."id";


--
-- Name: login_intentos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."login_intentos" (
    "id" bigint NOT NULL,
    "usuario_id" bigint,
    "username_intentado" character varying(100),
    "correo_intentado" character varying(255),
    "ip" "inet",
    "user_agent" "text",
    "exitoso" boolean DEFAULT false NOT NULL,
    "motivo" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: login_intentos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."login_intentos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: login_intentos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."login_intentos_id_seq" OWNED BY "public"."login_intentos"."id";


--
-- Name: motivos_rechazo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."motivos_rechazo" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(150) NOT NULL,
    "descripcion" "text",
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: motivos_rechazo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."motivos_rechazo_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: motivos_rechazo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."motivos_rechazo_id_seq" OWNED BY "public"."motivos_rechazo"."id";


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."password_reset_tokens" (
    "id" bigint NOT NULL,
    "usuario_id" bigint NOT NULL,
    "token_hash" "text" NOT NULL,
    "token_provisional" character varying(50) NOT NULL,
    "solicitado_por_usuario_id" bigint,
    "ip_solicitud" "inet",
    "user_agent_solicitud" "text",
    "expira_at" timestamp with time zone NOT NULL,
    "usado_at" timestamp with time zone,
    "cancelado_at" timestamp with time zone,
    "intentos_verificacion" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_password_reset_tokens_expira_at" CHECK (("expira_at" > "created_at")),
    CONSTRAINT "password_reset_tokens_intentos_verificacion_check" CHECK (("intentos_verificacion" >= 0))
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."password_reset_tokens_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."password_reset_tokens_id_seq" OWNED BY "public"."password_reset_tokens"."id";


--
-- Name: permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."permisos" (
    "id" bigint NOT NULL,
    "clave" character varying(100) NOT NULL,
    "nombre" character varying(150) NOT NULL,
    "modulo" character varying(100) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: permisos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."permisos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: permisos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."permisos_id_seq" OWNED BY "public"."permisos"."id";


--
-- Name: pliego_puntos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."pliego_puntos" (
    "id" bigint NOT NULL,
    "pliego_id" bigint NOT NULL,
    "numero_punto" integer NOT NULL,
    "texto_original_ocr" "text",
    "texto_final" "text" NOT NULL,
    "categoria_id" bigint,
    "prioridad_id" bigint NOT NULL,
    "estado_punto_id" bigint NOT NULL,
    "responsable_usuario_id" bigint,
    "fecha_registro" timestamp with time zone DEFAULT "now"() NOT NULL,
    "fecha_compromiso" "date",
    "fecha_envio_validacion" timestamp with time zone,
    "fecha_respuesta_unidad" timestamp with time zone,
    "fecha_validacion_des" timestamp with time zone,
    "fecha_cierre" timestamp with time zone,
    "origen_captura" character varying(20) NOT NULL,
    "requiere_validacion" boolean DEFAULT true NOT NULL,
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_fechas_punto" CHECK ((("fecha_compromiso" IS NULL) OR ("fecha_compromiso" >= "date"("fecha_registro")))),
    CONSTRAINT "pliego_puntos_numero_punto_check" CHECK (("numero_punto" > 0)),
    CONSTRAINT "pliego_puntos_origen_captura_check" CHECK ((("origen_captura")::"text" = ANY ((ARRAY['ocr'::character varying, 'manual'::character varying])::"text"[])))
);


--
-- Name: pliego_puntos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."pliego_puntos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pliego_puntos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."pliego_puntos_id_seq" OWNED BY "public"."pliego_puntos"."id";


--
-- Name: pliegos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."pliegos" (
    "id" bigint NOT NULL,
    "unidad_id" bigint NOT NULL,
    "folio" character varying(100) NOT NULL,
    "titulo" character varying(255) NOT NULL,
    "descripcion" "text",
    "periodo" character varying(100),
    "anio" integer,
    "fecha_recepcion" "date" NOT NULL,
    "fecha_registro" timestamp with time zone DEFAULT "now"() NOT NULL,
    "estado_pliego_id" bigint NOT NULL,
    "archivo_original_id" bigint,
    "texto_ocr_bruto" "text",
    "texto_revision_final" "text",
    "ocr_procesado" boolean DEFAULT false NOT NULL,
    "ocr_fecha_procesado" timestamp with time zone,
    "registrado_por_usuario_id" bigint,
    "observaciones" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "pliegos_anio_check" CHECK ((("anio" IS NULL) OR ("anio" >= 2000)))
);


--
-- Name: pliegos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."pliegos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pliegos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."pliegos_id_seq" OWNED BY "public"."pliegos"."id";


--
-- Name: prioridades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."prioridades" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "nivel_orden" integer NOT NULL,
    "dias_sla" integer DEFAULT 0 NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "prioridades_dias_sla_check" CHECK (("dias_sla" >= 0)),
    CONSTRAINT "prioridades_nivel_orden_check" CHECK (("nivel_orden" > 0))
);


--
-- Name: prioridades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."prioridades_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: prioridades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."prioridades_id_seq" OWNED BY "public"."prioridades"."id";


--
-- Name: punto_evidencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."punto_evidencias" (
    "id" bigint NOT NULL,
    "punto_id" bigint NOT NULL,
    "archivo_id" bigint NOT NULL,
    "tipo_evidencia_id" bigint NOT NULL,
    "titulo" character varying(255),
    "descripcion" "text",
    "visible_unidad" boolean DEFAULT true NOT NULL,
    "visible_des" boolean DEFAULT true NOT NULL,
    "es_vigente" boolean DEFAULT true NOT NULL,
    "subido_por_usuario_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: punto_evidencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."punto_evidencias_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: punto_evidencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."punto_evidencias_id_seq" OWNED BY "public"."punto_evidencias"."id";


--
-- Name: punto_seguimientos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."punto_seguimientos" (
    "id" bigint NOT NULL,
    "punto_id" bigint NOT NULL,
    "usuario_id" bigint,
    "tipo_movimiento" character varying(50) NOT NULL,
    "comentario" "text",
    "estado_anterior_id" bigint,
    "estado_nuevo_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "punto_seguimientos_tipo_movimiento_check" CHECK ((("tipo_movimiento")::"text" = ANY ((ARRAY['comentario'::character varying, 'cambio_estado'::character varying, 'carga_evidencia'::character varying, 'asignacion'::character varying, 'observacion'::character varying, 'envio_validacion'::character varying, 'validacion'::character varying, 'rechazo'::character varying])::"text"[])))
);


--
-- Name: punto_seguimientos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."punto_seguimientos_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: punto_seguimientos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."punto_seguimientos_id_seq" OWNED BY "public"."punto_seguimientos"."id";


--
-- Name: punto_validaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."punto_validaciones" (
    "id" bigint NOT NULL,
    "punto_id" bigint NOT NULL,
    "usuario_validador_id" bigint,
    "resultado" character varying(30) NOT NULL,
    "motivo_rechazo_id" bigint,
    "comentario" "text",
    "es_vigente" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_motivo_rechazo_requerido" CHECK ((((("resultado")::"text" = 'rechazado'::"text") AND ("motivo_rechazo_id" IS NOT NULL)) OR (("resultado")::"text" <> 'rechazado'::"text"))),
    CONSTRAINT "punto_validaciones_resultado_check" CHECK ((("resultado")::"text" = ANY ((ARRAY['aprobado'::character varying, 'rechazado'::character varying, 'requiere_informacion'::character varying])::"text"[])))
);


--
-- Name: punto_validaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."punto_validaciones_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: punto_validaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."punto_validaciones_id_seq" OWNED BY "public"."punto_validaciones"."id";


--
-- Name: rol_permisos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."rol_permisos" (
    "rol_id" bigint NOT NULL,
    "permiso_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."roles" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "ambito" character varying(20) NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "roles_ambito_check" CHECK ((("ambito")::"text" = ANY ((ARRAY['DES'::character varying, 'UNIDAD'::character varying])::"text"[])))
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."roles_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."roles_id_seq" OWNED BY "public"."roles"."id";


--
-- Name: tipos_evidencia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."tipos_evidencia" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: tipos_evidencia_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."tipos_evidencia_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipos_evidencia_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."tipos_evidencia_id_seq" OWNED BY "public"."tipos_evidencia"."id";


--
-- Name: unidades_academicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."unidades_academicas" (
    "id" bigint NOT NULL,
    "clave" character varying(50) NOT NULL,
    "nombre" character varying(255) NOT NULL,
    "correo_oficial" character varying(255),
    "telefono" character varying(30),
    "titular_nombre" character varying(255),
    "activo" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


--
-- Name: unidades_academicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."unidades_academicas_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: unidades_academicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."unidades_academicas_id_seq" OWNED BY "public"."unidades_academicas"."id";


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."user_sessions" (
    "id" bigint NOT NULL,
    "usuario_id" bigint NOT NULL,
    "token_jti" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "refresh_token_hash" "text",
    "ip" "inet",
    "user_agent" "text",
    "iniciado_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expira_at" timestamp with time zone NOT NULL,
    "cerrado_at" timestamp with time zone,
    "revocada" boolean DEFAULT false NOT NULL,
    "motivo_revocacion" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "chk_user_sessions_expira_at" CHECK (("expira_at" > "iniciado_at"))
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."user_sessions_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."user_sessions_id_seq" OWNED BY "public"."user_sessions"."id";


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."usuarios" (
    "id" bigint NOT NULL,
    "unidad_id" bigint,
    "rol_id" bigint NOT NULL,
    "nombre" character varying(100) NOT NULL,
    "apellido_paterno" character varying(100),
    "apellido_materno" character varying(100),
    "correo" character varying(255) NOT NULL,
    "username" character varying(100) NOT NULL,
    "password_hash" "text" NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "debe_cambiar_password" boolean DEFAULT true NOT NULL,
    "intentos_fallidos" integer DEFAULT 0 NOT NULL,
    "bloqueado_hasta" timestamp with time zone,
    "ultimo_acceso_at" timestamp with time zone,
    "ultimo_cambio_password_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usuarios_intentos_fallidos_check" CHECK (("intentos_fallidos" >= 0))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE "public"."usuarios_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE "public"."usuarios_id_seq" OWNED BY "public"."usuarios"."id";


--
-- Name: archivos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."archivos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."archivos_id_seq"'::"regclass");


--
-- Name: auditoria_eventos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."auditoria_eventos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."auditoria_eventos_id_seq"'::"regclass");


--
-- Name: categorias_punto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."categorias_punto" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."categorias_punto_id_seq"'::"regclass");


--
-- Name: estados_pliego id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."estados_pliego" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."estados_pliego_id_seq"'::"regclass");


--
-- Name: estados_punto id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."estados_punto" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."estados_punto_id_seq"'::"regclass");


--
-- Name: login_intentos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."login_intentos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."login_intentos_id_seq"'::"regclass");


--
-- Name: motivos_rechazo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."motivos_rechazo" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."motivos_rechazo_id_seq"'::"regclass");


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."password_reset_tokens" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."password_reset_tokens_id_seq"'::"regclass");


--
-- Name: permisos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."permisos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."permisos_id_seq"'::"regclass");


--
-- Name: pliego_puntos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pliego_puntos_id_seq"'::"regclass");


--
-- Name: pliegos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."pliegos_id_seq"'::"regclass");


--
-- Name: prioridades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."prioridades" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."prioridades_id_seq"'::"regclass");


--
-- Name: punto_evidencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_evidencias" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."punto_evidencias_id_seq"'::"regclass");


--
-- Name: punto_seguimientos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_seguimientos" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."punto_seguimientos_id_seq"'::"regclass");


--
-- Name: punto_validaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_validaciones" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."punto_validaciones_id_seq"'::"regclass");


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."roles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."roles_id_seq"'::"regclass");


--
-- Name: tipos_evidencia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."tipos_evidencia" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tipos_evidencia_id_seq"'::"regclass");


--
-- Name: unidades_academicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."unidades_academicas" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."unidades_academicas_id_seq"'::"regclass");


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_sessions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."user_sessions_id_seq"'::"regclass");


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."usuarios" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."usuarios_id_seq"'::"regclass");


--
-- Name: archivos archivos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."archivos"
    ADD CONSTRAINT "archivos_pkey" PRIMARY KEY ("id");


--
-- Name: auditoria_eventos auditoria_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."auditoria_eventos"
    ADD CONSTRAINT "auditoria_eventos_pkey" PRIMARY KEY ("id");


--
-- Name: categorias_punto categorias_punto_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."categorias_punto"
    ADD CONSTRAINT "categorias_punto_clave_key" UNIQUE ("clave");


--
-- Name: categorias_punto categorias_punto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."categorias_punto"
    ADD CONSTRAINT "categorias_punto_pkey" PRIMARY KEY ("id");


--
-- Name: estados_pliego estados_pliego_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."estados_pliego"
    ADD CONSTRAINT "estados_pliego_clave_key" UNIQUE ("clave");


--
-- Name: estados_pliego estados_pliego_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."estados_pliego"
    ADD CONSTRAINT "estados_pliego_pkey" PRIMARY KEY ("id");


--
-- Name: estados_punto estados_punto_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."estados_punto"
    ADD CONSTRAINT "estados_punto_clave_key" UNIQUE ("clave");


--
-- Name: estados_punto estados_punto_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."estados_punto"
    ADD CONSTRAINT "estados_punto_pkey" PRIMARY KEY ("id");


--
-- Name: login_intentos login_intentos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."login_intentos"
    ADD CONSTRAINT "login_intentos_pkey" PRIMARY KEY ("id");


--
-- Name: motivos_rechazo motivos_rechazo_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."motivos_rechazo"
    ADD CONSTRAINT "motivos_rechazo_clave_key" UNIQUE ("clave");


--
-- Name: motivos_rechazo motivos_rechazo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."motivos_rechazo"
    ADD CONSTRAINT "motivos_rechazo_pkey" PRIMARY KEY ("id");


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: permisos permisos_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."permisos"
    ADD CONSTRAINT "permisos_clave_key" UNIQUE ("clave");


--
-- Name: permisos permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."permisos"
    ADD CONSTRAINT "permisos_pkey" PRIMARY KEY ("id");


--
-- Name: pliego_puntos pliego_puntos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "pliego_puntos_pkey" PRIMARY KEY ("id");


--
-- Name: pliegos pliegos_folio_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos"
    ADD CONSTRAINT "pliegos_folio_key" UNIQUE ("folio");


--
-- Name: pliegos pliegos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos"
    ADD CONSTRAINT "pliegos_pkey" PRIMARY KEY ("id");


--
-- Name: prioridades prioridades_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."prioridades"
    ADD CONSTRAINT "prioridades_clave_key" UNIQUE ("clave");


--
-- Name: prioridades prioridades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."prioridades"
    ADD CONSTRAINT "prioridades_pkey" PRIMARY KEY ("id");


--
-- Name: punto_evidencias punto_evidencias_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_evidencias"
    ADD CONSTRAINT "punto_evidencias_pkey" PRIMARY KEY ("id");


--
-- Name: punto_seguimientos punto_seguimientos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_seguimientos"
    ADD CONSTRAINT "punto_seguimientos_pkey" PRIMARY KEY ("id");


--
-- Name: punto_validaciones punto_validaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_validaciones"
    ADD CONSTRAINT "punto_validaciones_pkey" PRIMARY KEY ("id");


--
-- Name: rol_permisos rol_permisos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."rol_permisos"
    ADD CONSTRAINT "rol_permisos_pkey" PRIMARY KEY ("rol_id", "permiso_id");


--
-- Name: roles roles_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_clave_key" UNIQUE ("clave");


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");


--
-- Name: tipos_evidencia tipos_evidencia_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."tipos_evidencia"
    ADD CONSTRAINT "tipos_evidencia_clave_key" UNIQUE ("clave");


--
-- Name: tipos_evidencia tipos_evidencia_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."tipos_evidencia"
    ADD CONSTRAINT "tipos_evidencia_pkey" PRIMARY KEY ("id");


--
-- Name: unidades_academicas unidades_academicas_clave_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."unidades_academicas"
    ADD CONSTRAINT "unidades_academicas_clave_key" UNIQUE ("clave");


--
-- Name: unidades_academicas unidades_academicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."unidades_academicas"
    ADD CONSTRAINT "unidades_academicas_pkey" PRIMARY KEY ("id");


--
-- Name: archivos uq_archivos_hash_sha256; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."archivos"
    ADD CONSTRAINT "uq_archivos_hash_sha256" UNIQUE ("hash_sha256");


--
-- Name: password_reset_tokens uq_password_reset_tokens_token_provisional; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "uq_password_reset_tokens_token_provisional" UNIQUE ("token_provisional");


--
-- Name: pliego_puntos uq_pliego_puntos_numero; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "uq_pliego_puntos_numero" UNIQUE ("pliego_id", "numero_punto");


--
-- Name: user_sessions uq_user_sessions_token_jti; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "uq_user_sessions_token_jti" UNIQUE ("token_jti");


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_correo_key" UNIQUE ("correo");


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id");


--
-- Name: usuarios usuarios_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_username_key" UNIQUE ("username");


--
-- Name: idx_auditoria_eventos_tabla_registro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_auditoria_eventos_tabla_registro" ON "public"."auditoria_eventos" USING "btree" ("tabla_nombre", "registro_id");


--
-- Name: idx_auditoria_eventos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_auditoria_eventos_usuario_id" ON "public"."auditoria_eventos" USING "btree" ("usuario_id");


--
-- Name: idx_login_intentos_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_login_intentos_created_at" ON "public"."login_intentos" USING "btree" ("created_at");


--
-- Name: idx_login_intentos_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_login_intentos_usuario_id" ON "public"."login_intentos" USING "btree" ("usuario_id");


--
-- Name: idx_password_reset_tokens_expira_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_password_reset_tokens_expira_at" ON "public"."password_reset_tokens" USING "btree" ("expira_at");


--
-- Name: idx_password_reset_tokens_usado_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_password_reset_tokens_usado_at" ON "public"."password_reset_tokens" USING "btree" ("usado_at");


--
-- Name: idx_password_reset_tokens_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_password_reset_tokens_usuario_id" ON "public"."password_reset_tokens" USING "btree" ("usuario_id");


--
-- Name: idx_pliego_puntos_categoria_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliego_puntos_categoria_id" ON "public"."pliego_puntos" USING "btree" ("categoria_id");


--
-- Name: idx_pliego_puntos_estado_punto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliego_puntos_estado_punto_id" ON "public"."pliego_puntos" USING "btree" ("estado_punto_id");


--
-- Name: idx_pliego_puntos_fecha_compromiso; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliego_puntos_fecha_compromiso" ON "public"."pliego_puntos" USING "btree" ("fecha_compromiso");


--
-- Name: idx_pliego_puntos_pliego_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliego_puntos_pliego_id" ON "public"."pliego_puntos" USING "btree" ("pliego_id");


--
-- Name: idx_pliego_puntos_prioridad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliego_puntos_prioridad_id" ON "public"."pliego_puntos" USING "btree" ("prioridad_id");


--
-- Name: idx_pliegos_estado_pliego_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliegos_estado_pliego_id" ON "public"."pliegos" USING "btree" ("estado_pliego_id");


--
-- Name: idx_pliegos_fecha_recepcion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliegos_fecha_recepcion" ON "public"."pliegos" USING "btree" ("fecha_recepcion");


--
-- Name: idx_pliegos_unidad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_pliegos_unidad_id" ON "public"."pliegos" USING "btree" ("unidad_id");


--
-- Name: idx_punto_evidencias_punto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_punto_evidencias_punto_id" ON "public"."punto_evidencias" USING "btree" ("punto_id");


--
-- Name: idx_punto_seguimientos_punto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_punto_seguimientos_punto_id" ON "public"."punto_seguimientos" USING "btree" ("punto_id");


--
-- Name: idx_punto_validaciones_es_vigente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_punto_validaciones_es_vigente" ON "public"."punto_validaciones" USING "btree" ("es_vigente");


--
-- Name: idx_punto_validaciones_punto_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_punto_validaciones_punto_id" ON "public"."punto_validaciones" USING "btree" ("punto_id");


--
-- Name: idx_user_sessions_expira_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_user_sessions_expira_at" ON "public"."user_sessions" USING "btree" ("expira_at");


--
-- Name: idx_user_sessions_revocada; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_user_sessions_revocada" ON "public"."user_sessions" USING "btree" ("revocada");


--
-- Name: idx_user_sessions_usuario_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_user_sessions_usuario_id" ON "public"."user_sessions" USING "btree" ("usuario_id");


--
-- Name: idx_usuarios_rol_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_usuarios_rol_id" ON "public"."usuarios" USING "btree" ("rol_id");


--
-- Name: idx_usuarios_unidad_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "idx_usuarios_unidad_id" ON "public"."usuarios" USING "btree" ("unidad_id");


--
-- Name: uq_password_reset_tokens_uno_activo_por_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "uq_password_reset_tokens_uno_activo_por_usuario" ON "public"."password_reset_tokens" USING "btree" ("usuario_id") WHERE (("usado_at" IS NULL) AND ("cancelado_at" IS NULL));


--
-- Name: uq_punto_validaciones_una_vigente; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "uq_punto_validaciones_una_vigente" ON "public"."punto_validaciones" USING "btree" ("punto_id") WHERE ("es_vigente" = true);


--
-- Name: uq_unidades_academicas_clave_upper; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "uq_unidades_academicas_clave_upper" ON "public"."unidades_academicas" USING "btree" ("upper"(("clave")::"text"));


--
-- Name: archivos trg_audit_archivos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_archivos" AFTER INSERT OR DELETE OR UPDATE ON "public"."archivos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: categorias_punto trg_audit_categorias_punto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_categorias_punto" AFTER INSERT OR DELETE OR UPDATE ON "public"."categorias_punto" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: estados_pliego trg_audit_estados_pliego; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_estados_pliego" AFTER INSERT OR DELETE OR UPDATE ON "public"."estados_pliego" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: estados_punto trg_audit_estados_punto; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_estados_punto" AFTER INSERT OR DELETE OR UPDATE ON "public"."estados_punto" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: login_intentos trg_audit_login_intentos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_login_intentos" AFTER INSERT OR DELETE OR UPDATE ON "public"."login_intentos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: motivos_rechazo trg_audit_motivos_rechazo; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_motivos_rechazo" AFTER INSERT OR DELETE OR UPDATE ON "public"."motivos_rechazo" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: password_reset_tokens trg_audit_password_reset_tokens; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_password_reset_tokens" AFTER INSERT OR DELETE OR UPDATE ON "public"."password_reset_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: permisos trg_audit_permisos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_permisos" AFTER INSERT OR DELETE OR UPDATE ON "public"."permisos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: pliego_puntos trg_audit_pliego_puntos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_pliego_puntos" AFTER INSERT OR DELETE OR UPDATE ON "public"."pliego_puntos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: pliegos trg_audit_pliegos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_pliegos" AFTER INSERT OR DELETE OR UPDATE ON "public"."pliegos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: prioridades trg_audit_prioridades; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_prioridades" AFTER INSERT OR DELETE OR UPDATE ON "public"."prioridades" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: punto_evidencias trg_audit_punto_evidencias; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_punto_evidencias" AFTER INSERT OR DELETE OR UPDATE ON "public"."punto_evidencias" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: punto_seguimientos trg_audit_punto_seguimientos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_punto_seguimientos" AFTER INSERT OR DELETE OR UPDATE ON "public"."punto_seguimientos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: punto_validaciones trg_audit_punto_validaciones; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_punto_validaciones" AFTER INSERT OR DELETE OR UPDATE ON "public"."punto_validaciones" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: rol_permisos trg_audit_rol_permisos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_rol_permisos" AFTER INSERT OR DELETE OR UPDATE ON "public"."rol_permisos" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: roles trg_audit_roles; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_roles" AFTER INSERT OR DELETE OR UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: tipos_evidencia trg_audit_tipos_evidencia; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_tipos_evidencia" AFTER INSERT OR DELETE OR UPDATE ON "public"."tipos_evidencia" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: unidades_academicas trg_audit_unidades_academicas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_unidades_academicas" AFTER INSERT OR DELETE OR UPDATE ON "public"."unidades_academicas" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: user_sessions trg_audit_user_sessions; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_user_sessions" AFTER INSERT OR DELETE OR UPDATE ON "public"."user_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: usuarios trg_audit_usuarios; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_audit_usuarios" AFTER INSERT OR DELETE OR UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."audit_if_modified"();


--
-- Name: password_reset_tokens trg_cancelar_tokens_activos_previos; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_cancelar_tokens_activos_previos" BEFORE INSERT OR UPDATE ON "public"."password_reset_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."cancelar_tokens_activos_previos"();


--
-- Name: categorias_punto trg_categorias_punto_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_categorias_punto_updated_at" BEFORE UPDATE ON "public"."categorias_punto" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: punto_validaciones trg_desactivar_validaciones_vigentes_previas; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_desactivar_validaciones_vigentes_previas" BEFORE INSERT OR UPDATE ON "public"."punto_validaciones" FOR EACH ROW EXECUTE FUNCTION "public"."desactivar_validaciones_vigentes_previas"();


--
-- Name: estados_pliego trg_estados_pliego_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_estados_pliego_updated_at" BEFORE UPDATE ON "public"."estados_pliego" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: estados_punto trg_estados_punto_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_estados_punto_updated_at" BEFORE UPDATE ON "public"."estados_punto" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: motivos_rechazo trg_motivos_rechazo_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_motivos_rechazo_updated_at" BEFORE UPDATE ON "public"."motivos_rechazo" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: password_reset_tokens trg_password_reset_tokens_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_password_reset_tokens_updated_at" BEFORE UPDATE ON "public"."password_reset_tokens" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: permisos trg_permisos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_permisos_updated_at" BEFORE UPDATE ON "public"."permisos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: pliego_puntos trg_pliego_puntos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_pliego_puntos_updated_at" BEFORE UPDATE ON "public"."pliego_puntos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: pliegos trg_pliegos_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_pliegos_updated_at" BEFORE UPDATE ON "public"."pliegos" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: prioridades trg_prioridades_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_prioridades_updated_at" BEFORE UPDATE ON "public"."prioridades" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: roles trg_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_roles_updated_at" BEFORE UPDATE ON "public"."roles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: tipos_evidencia trg_tipos_evidencia_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_tipos_evidencia_updated_at" BEFORE UPDATE ON "public"."tipos_evidencia" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: unidades_academicas trg_unidades_academicas_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_unidades_academicas_updated_at" BEFORE UPDATE ON "public"."unidades_academicas" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: user_sessions trg_user_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_user_sessions_updated_at" BEFORE UPDATE ON "public"."user_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: usuarios trg_usuarios_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_usuarios_updated_at" BEFORE UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


--
-- Name: usuarios trg_validar_usuario_ambito; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER "trg_validar_usuario_ambito" BEFORE INSERT OR UPDATE ON "public"."usuarios" FOR EACH ROW EXECUTE FUNCTION "public"."validar_usuario_ambito"();


--
-- Name: archivos archivos_subido_por_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."archivos"
    ADD CONSTRAINT "archivos_subido_por_usuario_id_fkey" FOREIGN KEY ("subido_por_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: auditoria_eventos auditoria_eventos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."auditoria_eventos"
    ADD CONSTRAINT "auditoria_eventos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: login_intentos login_intentos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."login_intentos"
    ADD CONSTRAINT "login_intentos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_solicitado_por_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_solicitado_por_usuario_id_fkey" FOREIGN KEY ("solicitado_por_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: password_reset_tokens password_reset_tokens_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."password_reset_tokens"
    ADD CONSTRAINT "password_reset_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE;


--
-- Name: pliego_puntos pliego_puntos_categoria_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "pliego_puntos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias_punto"("id") ON DELETE RESTRICT;


--
-- Name: pliego_puntos pliego_puntos_estado_punto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "pliego_puntos_estado_punto_id_fkey" FOREIGN KEY ("estado_punto_id") REFERENCES "public"."estados_punto"("id") ON DELETE RESTRICT;


--
-- Name: pliego_puntos pliego_puntos_pliego_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "pliego_puntos_pliego_id_fkey" FOREIGN KEY ("pliego_id") REFERENCES "public"."pliegos"("id") ON DELETE CASCADE;


--
-- Name: pliego_puntos pliego_puntos_prioridad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "pliego_puntos_prioridad_id_fkey" FOREIGN KEY ("prioridad_id") REFERENCES "public"."prioridades"("id") ON DELETE RESTRICT;


--
-- Name: pliego_puntos pliego_puntos_responsable_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliego_puntos"
    ADD CONSTRAINT "pliego_puntos_responsable_usuario_id_fkey" FOREIGN KEY ("responsable_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: pliegos pliegos_archivo_original_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos"
    ADD CONSTRAINT "pliegos_archivo_original_id_fkey" FOREIGN KEY ("archivo_original_id") REFERENCES "public"."archivos"("id") ON DELETE SET NULL;


--
-- Name: pliegos pliegos_estado_pliego_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos"
    ADD CONSTRAINT "pliegos_estado_pliego_id_fkey" FOREIGN KEY ("estado_pliego_id") REFERENCES "public"."estados_pliego"("id") ON DELETE RESTRICT;


--
-- Name: pliegos pliegos_registrado_por_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos"
    ADD CONSTRAINT "pliegos_registrado_por_usuario_id_fkey" FOREIGN KEY ("registrado_por_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: pliegos pliegos_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."pliegos"
    ADD CONSTRAINT "pliegos_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "public"."unidades_academicas"("id") ON DELETE RESTRICT;


--
-- Name: punto_evidencias punto_evidencias_archivo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_evidencias"
    ADD CONSTRAINT "punto_evidencias_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "public"."archivos"("id") ON DELETE RESTRICT;


--
-- Name: punto_evidencias punto_evidencias_punto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_evidencias"
    ADD CONSTRAINT "punto_evidencias_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "public"."pliego_puntos"("id") ON DELETE CASCADE;


--
-- Name: punto_evidencias punto_evidencias_subido_por_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_evidencias"
    ADD CONSTRAINT "punto_evidencias_subido_por_usuario_id_fkey" FOREIGN KEY ("subido_por_usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: punto_evidencias punto_evidencias_tipo_evidencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_evidencias"
    ADD CONSTRAINT "punto_evidencias_tipo_evidencia_id_fkey" FOREIGN KEY ("tipo_evidencia_id") REFERENCES "public"."tipos_evidencia"("id") ON DELETE RESTRICT;


--
-- Name: punto_seguimientos punto_seguimientos_estado_anterior_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_seguimientos"
    ADD CONSTRAINT "punto_seguimientos_estado_anterior_id_fkey" FOREIGN KEY ("estado_anterior_id") REFERENCES "public"."estados_punto"("id") ON DELETE SET NULL;


--
-- Name: punto_seguimientos punto_seguimientos_estado_nuevo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_seguimientos"
    ADD CONSTRAINT "punto_seguimientos_estado_nuevo_id_fkey" FOREIGN KEY ("estado_nuevo_id") REFERENCES "public"."estados_punto"("id") ON DELETE SET NULL;


--
-- Name: punto_seguimientos punto_seguimientos_punto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_seguimientos"
    ADD CONSTRAINT "punto_seguimientos_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "public"."pliego_puntos"("id") ON DELETE CASCADE;


--
-- Name: punto_seguimientos punto_seguimientos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_seguimientos"
    ADD CONSTRAINT "punto_seguimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: punto_validaciones punto_validaciones_motivo_rechazo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_validaciones"
    ADD CONSTRAINT "punto_validaciones_motivo_rechazo_id_fkey" FOREIGN KEY ("motivo_rechazo_id") REFERENCES "public"."motivos_rechazo"("id") ON DELETE RESTRICT;


--
-- Name: punto_validaciones punto_validaciones_punto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_validaciones"
    ADD CONSTRAINT "punto_validaciones_punto_id_fkey" FOREIGN KEY ("punto_id") REFERENCES "public"."pliego_puntos"("id") ON DELETE CASCADE;


--
-- Name: punto_validaciones punto_validaciones_usuario_validador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."punto_validaciones"
    ADD CONSTRAINT "punto_validaciones_usuario_validador_id_fkey" FOREIGN KEY ("usuario_validador_id") REFERENCES "public"."usuarios"("id") ON DELETE SET NULL;


--
-- Name: rol_permisos rol_permisos_permiso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."rol_permisos"
    ADD CONSTRAINT "rol_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "public"."permisos"("id") ON DELETE CASCADE;


--
-- Name: rol_permisos rol_permisos_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."rol_permisos"
    ADD CONSTRAINT "rol_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE CASCADE;


--
-- Name: usuarios usuarios_rol_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "public"."roles"("id") ON DELETE RESTRICT;


--
-- Name: usuarios usuarios_unidad_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_unidad_id_fkey" FOREIGN KEY ("unidad_id") REFERENCES "public"."unidades_academicas"("id") ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict uqbZydhe4KqdbAGoPcvlfMPvoP7y0YhddibF5bRIUPXKxUfs4a2QYyaO14NzP0L

