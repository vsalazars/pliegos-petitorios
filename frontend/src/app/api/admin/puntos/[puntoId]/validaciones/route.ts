import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

type Params = {
  params: Promise<{ puntoId: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: "sesión no válida" }, { status: 401 })
  }

  const { puntoId } = await params
  const response = await backendFetch(`/admin/puntos/${puntoId}/validaciones`, {}, token)
  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: "sesión no válida" }, { status: 401 })
  }

  const { puntoId } = await params
  const body = await request.json()

  const response = await backendFetch(
    `/admin/puntos/${puntoId}/validaciones`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    token,
  )
  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data, { status: 201 })
}
