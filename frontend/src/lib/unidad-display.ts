import type { UnidadPliego } from "@/lib/unidad-dashboard"

export function resolveUnidadPliegoEstadoLabel(item: UnidadPliego) {
  switch (item.estado_pliego_clave) {
    case "pendiente_revision_ocr":
      return "Revisión OCR pendiente"
    case "recibido":
      return "Registrado"
    case "cerrado":
      return "Cerrado"
    default:
      return item.estado_pliego_nombre
  }
}

export function resolveUnidadPliegoEstadoTone(
  item: UnidadPliego,
): "rose" | "slate" | "green" | "amber" {
  switch (item.estado_pliego_clave) {
    case "pendiente_revision_ocr":
      return "rose"
    case "cerrado":
      return "green"
    case "recibido":
      return "slate"
    default:
      return "amber"
  }
}

export function resolveUnidadOCRLabel(item: UnidadPliego) {
  if (item.ocr_procesado) {
    return "OCR procesado"
  }

  if (item.estado_pliego_clave === "pendiente_revision_ocr") {
    return "Pendiente de revisión"
  }

  return "OCR pendiente"
}

export function resolveUnidadBadgeToneClass(
  tone: "rose" | "slate" | "green" | "amber",
) {
  return {
    rose: "bg-[#f8ebef] text-[#8b2740]",
    slate: "bg-[#f2f4f7] text-[#55606d]",
    green: "bg-[#edf6f1] text-[#2f6b4f]",
    amber: "bg-[#fff4de] text-[#8c5a08]",
  }[tone]
}
