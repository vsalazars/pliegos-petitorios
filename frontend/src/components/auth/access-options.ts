import type { LucideIcon } from "lucide-react"
import { ShieldCheck, University } from "lucide-react"

export type AccessOptionId = "des" | "unidad"

export type AccessOption = {
  id: AccessOptionId
  eyebrow: string
  title: string
  description: string
  helperText: string
  tone: "des" | "unidad"
  Icon: LucideIcon
  bullets: string[]
}

export const accessOptions: AccessOption[] = [
  {
    id: "des",
    eyebrow: "Supervisión central",
    title: "Acceso DES",
    description:
      "Para seguimiento institucional, validaciones, alertas operativas y tablero de focos críticos.",
    helperText:
      "Usa tu usuario institucional DES. Después conectamos este formulario al endpoint real de autenticación.",
    tone: "des",
    Icon: ShieldCheck,
    bullets: ["Validaciones y rechazos", "Dashboard operativo", "Monitoreo por unidad"],
  },
  {
    id: "unidad",
    eyebrow: "Gestión por plantel",
    title: "Acceso Unidad Académica",
    description:
      "Para capturar evidencias, responder observaciones y enviar puntos a revisión DES.",
    helperText:
      "Este acceso será para capturistas, administradores y consulta de cada unidad académica.",
    tone: "unidad",
    Icon: University,
    bullets: ["Carga de evidencias", "Respuesta a observaciones", "Seguimiento de pliegos"],
  },
]

export function getAccessOption(optionId: AccessOptionId) {
  return accessOptions.find((option) => option.id === optionId) ?? accessOptions[0]
}
