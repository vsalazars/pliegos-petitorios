import { randomUUID } from "crypto"
import { mkdir, rm, writeFile } from "fs/promises"
import os from "os"
import path from "path"

import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { isUnidadRole } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: "sesión no válida" }, { status: 401 })
  }

  const meResponse = await backendFetch("/auth/me", {}, token)
  const meData = await meResponse.json()
  if (!meResponse.ok) {
    return NextResponse.json(meData, { status: meResponse.status })
  }

  if (!isUnidadRole(meData.user.rol_clave)) {
    return NextResponse.json({ error: "acceso no permitido" }, { status: 403 })
  }

  const unidadId = meData.user.unidad_id
  if (!unidadId) {
    return NextResponse.json({ error: "usuario sin unidad asignada" }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "archivo PDF requerido" }, { status: 400 })
  }
  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ error: "solo se permiten archivos PDF" }, { status: 400 })
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "el archivo debe tener extensión .pdf" }, { status: 400 })
  }

  const extension = path.extname(file.name) || ".pdf"
  const tempDir = path.join(os.tmpdir(), "pliegos-des-frontend-uploads")
  await mkdir(tempDir, { recursive: true })

  const tempPath = path.join(tempDir, `${randomUUID()}${extension}`)
  const bytes = await file.arrayBuffer()
  await writeFile(tempPath, Buffer.from(bytes))

  try {
    const response = await backendFetch(
      "/unidad/pliegos/desde-pdf",
      {
        method: "POST",
        body: JSON.stringify({
          unidad_id: unidadId,
          folio: String(formData.get("folio") ?? "").trim(),
          titulo: String(formData.get("titulo") ?? "").trim(),
          descripcion: nullableValue(formData.get("descripcion")),
          periodo: nullableValue(formData.get("periodo")),
          anio: nullableNumber(formData.get("anio")),
          fecha_recepcion: String(formData.get("fecha_recepcion") ?? "").trim(),
          archivo_path: tempPath,
          idioma: "spa",
        }),
      },
      token,
    )

    const data = await response.json()
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } finally {
    await rm(tempPath, { force: true })
  }
}

function nullableValue(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim()
  return normalized === "" ? null : normalized
}

function nullableNumber(value: FormDataEntryValue | null) {
  const normalized = String(value ?? "").trim()
  if (normalized === "") {
    return null
  }

  const parsed = Number(normalized)
  return Number.isNaN(parsed) ? null : parsed
}
