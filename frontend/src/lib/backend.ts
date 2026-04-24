export const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL

if (!BACKEND_URL) {
  throw new Error(
    "BACKEND_URL o NEXT_PUBLIC_BACKEND_URL es obligatorio. Revisa frontend/.env.local",
  )
}

export const AUTH_COOKIE_NAME = "pliegos_token"

export async function backendFetch(
  path: string,
  init: RequestInit = {},
  token?: string,
) {
  const headers = new Headers(init.headers)
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData

  if (!headers.has("Content-Type") && init.body && !isFormData) {
    headers.set("Content-Type", "application/json")
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })
}
