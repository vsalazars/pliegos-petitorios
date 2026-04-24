import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { resolveDashboardPath, type LoginResponse } from "@/lib/auth"
import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

export async function POST(request: Request) {
  const body = await request.json()

  const response = await backendFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  })

  const data = await response.json()
  if (!response.ok) {
    return NextResponse.json(data, { status: response.status })
  }

  const login = data as LoginResponse
  const cookieStore = await cookies()
  cookieStore.set(AUTH_COOKIE_NAME, login.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    expires: new Date(login.expires_at),
  })

  return NextResponse.json({
    user: login.user,
    redirect_to: resolveDashboardPath(login.user.rol_clave),
  })
}
