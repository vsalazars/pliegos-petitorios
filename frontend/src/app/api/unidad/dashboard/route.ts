import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { isUnidadRole } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"
import {
  buildUnidadDashboard,
  type UnidadPliego,
  type UnidadPliegoPunto,
} from "@/lib/unidad-dashboard"

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

  const items = (pliegosData.items ?? []) as UnidadPliego[]
  const puntos = await fetchUnidadDashboardPoints(items, token)

  return NextResponse.json({
    user: meData.user,
    dashboard: buildUnidadDashboard(items, puntos),
  })
}

async function fetchUnidadDashboardPoints(items: UnidadPliego[], token: string) {
  if (items.length === 0) {
    return [] as UnidadPliegoPunto[]
  }

  const responses = await Promise.all(
    items.map(async (item) => {
      const response = await backendFetch(`/unidad/pliegos/${item.id}`, {}, token)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "No fue posible cargar los puntos del pliego.")
      }

      return (data.puntos ?? []) as UnidadPliegoPunto[]
    }),
  )

  return responses.flat()
}
