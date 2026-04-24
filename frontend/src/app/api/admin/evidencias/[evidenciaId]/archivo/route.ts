import { cookies } from "next/headers"
import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME, backendFetch } from "@/lib/backend"

type Params = {
  params: Promise<{ evidenciaId: string }>
}

export async function GET(_request: Request, { params }: Params) {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value

  if (!token) {
    return NextResponse.json({ error: "sesión no válida" }, { status: 401 })
  }

  const { evidenciaId } = await params
  const response = await backendFetch(`/admin/evidencias/${evidenciaId}/archivo`, {}, token)

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
