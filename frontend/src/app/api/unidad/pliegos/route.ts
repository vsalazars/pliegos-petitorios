import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { isUnidadRole } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"
import type { UnidadPliego } from "@/lib/unidad-dashboard"

export async function GET() {
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

  const pliegosResponse = await backendFetch("/unidad/pliegos", {}, token)
  const pliegosData = await pliegosResponse.json()
  if (!pliegosResponse.ok) {
    return NextResponse.json(pliegosData, { status: pliegosResponse.status })
  }

  return NextResponse.json({
    user: meData.user,
    items: (pliegosData.items ?? []) as UnidadPliego[],
    total: pliegosData.total ?? 0,
  })
}

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

  const body = await request.json()
  const unidadId = meData.user.unidad_id
  if (!unidadId) {
    return NextResponse.json({ error: "usuario sin unidad asignada" }, { status: 400 })
  }

  const response = await backendFetch("/unidad/pliegos", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      unidad_id: unidadId,
    }),
  }, token)

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}
