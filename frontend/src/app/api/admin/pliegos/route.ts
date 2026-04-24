import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: "sesión no válida" }, { status: 401 })
  }

  const response = await backendFetch("/admin/pliegos", {}, token)
  const raw = await response.text()
  let data: unknown = {}

  try {
    data = raw.trim() === "" ? {} : JSON.parse(raw)
  } catch {
    data = { error: raw.trim() === "" ? "respuesta vacía del backend" : raw }
  }

  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  return NextResponse.json(data)
}
