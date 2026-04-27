import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { isUnidadRole } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

type RouteContext = {
  params: Promise<{ id: string; puntoId: string; evidenciaId: string }>
}

async function validateUnidadAccess() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return { error: NextResponse.json({ error: "sesión no válida" }, { status: 401 }) }
  }

  const meResponse = await backendFetch("/auth/me", {}, token)
  const meData = await meResponse.json()
  if (!meResponse.ok) {
    return { error: NextResponse.json(meData, { status: meResponse.status }) }
  }

  if (!isUnidadRole(meData.user.rol_clave)) {
    return { error: NextResponse.json({ error: "acceso no permitido" }, { status: 403 }) }
  }

  return { token }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await validateUnidadAccess()
  if ("error" in auth) {
    return auth.error
  }

  const { id, puntoId, evidenciaId } = await context.params
  const pliegoId = String(id).trim()
  const normalizedPuntoId = String(puntoId).trim()
  const normalizedEvidenciaId = String(evidenciaId).trim()

  if (pliegoId === "" || normalizedPuntoId === "" || normalizedEvidenciaId === "") {
    return NextResponse.json({ error: "identificadores inválidos" }, { status: 400 })
  }

  const body = await request.json()
  const response = await backendFetch(
    `/unidad/pliegos/${pliegoId}/puntos/${normalizedPuntoId}/evidencias/${normalizedEvidenciaId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    auth.token,
  )

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await validateUnidadAccess()
  if ("error" in auth) {
    return auth.error
  }

  const { id, puntoId, evidenciaId } = await context.params
  const pliegoId = String(id).trim()
  const normalizedPuntoId = String(puntoId).trim()
  const normalizedEvidenciaId = String(evidenciaId).trim()

  if (pliegoId === "" || normalizedPuntoId === "" || normalizedEvidenciaId === "") {
    return NextResponse.json({ error: "identificadores inválidos" }, { status: 400 })
  }

  const response = await backendFetch(
    `/unidad/pliegos/${pliegoId}/puntos/${normalizedPuntoId}/evidencias/${normalizedEvidenciaId}/archivo`,
    {},
    auth.token,
  )

  if (!response.ok) {
    const raw = await response.text()
    let payload: unknown = { error: raw || "No fue posible descargar el archivo." }

    try {
      payload = raw.trim() === "" ? payload : JSON.parse(raw)
    } catch {}

    return NextResponse.json(payload, { status: response.status })
  }

  const headers = new Headers()
  const contentType = response.headers.get("content-type")
  const contentDisposition = response.headers.get("content-disposition")

  if (contentType) {
    headers.set("Content-Type", contentType)
  }
  if (contentDisposition) {
    headers.set("Content-Disposition", contentDisposition)
  }

  return new NextResponse(response.body, {
    status: 200,
    headers,
  })
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await validateUnidadAccess()
  if ("error" in auth) {
    return auth.error
  }

  const { id, puntoId, evidenciaId } = await context.params
  const pliegoId = String(id).trim()
  const normalizedPuntoId = String(puntoId).trim()
  const normalizedEvidenciaId = String(evidenciaId).trim()

  if (pliegoId === "" || normalizedPuntoId === "" || normalizedEvidenciaId === "") {
    return NextResponse.json({ error: "identificadores inválidos" }, { status: 400 })
  }

  const response = await backendFetch(
    `/unidad/pliegos/${pliegoId}/puntos/${normalizedPuntoId}/evidencias/${normalizedEvidenciaId}`,
    {
      method: "DELETE",
    },
    auth.token,
  )

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}
