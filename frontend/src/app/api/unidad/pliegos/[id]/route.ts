import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { isUnidadRole } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
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

  const { id } = await context.params
  const normalizedId = String(id).trim()
  if (normalizedId === "") {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const response = await backendFetch(`/unidad/pliegos/${normalizedId}`, {}, token)
  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
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

  const { id } = await context.params
  const normalizedId = String(id).trim()
  if (normalizedId === "") {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const body = await request.json()
  const response = await backendFetch(
    `/unidad/pliegos/${normalizedId}`,
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

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await validateUnidadAccess()
  if ("error" in auth) {
    return auth.error
  }

  const { id } = await context.params
  const normalizedId = String(id).trim()
  if (normalizedId === "") {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const response = await backendFetch(
    `/unidad/pliegos/${normalizedId}`,
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
