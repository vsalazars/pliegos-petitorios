import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: "sesión no válida" }, { status: 401 })
  }

  const { id } = await context.params
  const userId = String(id).trim()
  if (userId === "") {
    return NextResponse.json({ error: "id inválido" }, { status: 400 })
  }

  const body = await request.json()
  const response = await backendFetch(
    `/admin/usuarios/${userId}/activo`,
    {
      method: "PATCH",
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
