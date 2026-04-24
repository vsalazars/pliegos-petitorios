import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { isUnidadRole } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

type RouteContext = {
  params: Promise<{ id: string; puntoId: string }>
}

export async function PUT(request: Request, context: RouteContext) {
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

  const { id, puntoId } = await context.params
  const pliegoId = String(id).trim()
  const normalizedPuntoId = String(puntoId).trim()

  if (pliegoId === "" || normalizedPuntoId === "") {
    return NextResponse.json({ error: "identificadores inválidos" }, { status: 400 })
  }

  const body = await request.json()
  const response = await backendFetch(
    `/unidad/pliegos/${pliegoId}/puntos/${normalizedPuntoId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    token,
  )

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}

export async function DELETE(_request: Request, context: RouteContext) {
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

  const { id, puntoId } = await context.params
  const pliegoId = String(id).trim()
  const normalizedPuntoId = String(puntoId).trim()

  if (pliegoId === "" || normalizedPuntoId === "") {
    return NextResponse.json({ error: "identificadores inválidos" }, { status: 400 })
  }

  const response = await backendFetch(
    `/unidad/pliegos/${pliegoId}/puntos/${normalizedPuntoId}`,
    {
      method: "DELETE",
    },
    token,
  )

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}
