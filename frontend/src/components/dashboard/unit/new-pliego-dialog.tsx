"use client"

import { LoaderCircle, Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { EstadoPliego } from "@/lib/estado-pliego"
import { resolveDefaultEstadoPliegoId } from "@/lib/estado-pliego"

type NewPliegoDialogProps = {
  onCreated: () => Promise<void> | void
}

type FormState = {
  folio: string
  titulo: string
  descripcion: string
  periodo: string
  anio: string
  fecha_recepcion: string
  estado_pliego_id: string
}

const initialForm: FormState = {
  folio: "",
  titulo: "",
  descripcion: "",
  periodo: "",
  anio: String(new Date().getFullYear()),
  fecha_recepcion: "",
  estado_pliego_id: "",
}

export function NewPliegoDialog({ onCreated }: NewPliegoDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [estados, setEstados] = useState<EstadoPliego[]>([])
  const [catalogError, setCatalogError] = useState("")
  const [submitError, setSubmitError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || estados.length > 0) {
      return
    }

    const loadCatalog = async () => {
      setIsLoadingCatalog(true)
      setCatalogError("")

      try {
        const response = await fetch("/api/unidad/catalogos/estados-pliego", {
          cache: "no-store",
        })
        const payload = await response.json()

        if (!response.ok) {
          setCatalogError(payload.error ?? "No fue posible cargar estados de pliego.")
          return
        }

        const items = (payload.items ?? []) as EstadoPliego[]
        setEstados(items)

        const defaultEstadoId = resolveDefaultEstadoPliegoId(items)
        if (defaultEstadoId) {
          setForm((current) => ({
            ...current,
            estado_pliego_id: String(defaultEstadoId),
          }))
        }
      } catch {
        setCatalogError("No fue posible conectar con el catálogo de estados.")
      } finally {
        setIsLoadingCatalog(false)
      }
    }

    loadCatalog()
  }, [open, estados.length])

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setSubmitError("")
      setSuccessMessage("")
      setCatalogError("")
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError("")
    setSuccessMessage("")
    setIsSubmitting(true)

    try {
      const response = selectedFile
        ? await submitFromPDF(form, selectedFile)
        : await fetch("/api/unidad/pliegos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              folio: form.folio,
              titulo: form.titulo,
              descripcion: emptyToNull(form.descripcion),
              periodo: emptyToNull(form.periodo),
              anio: form.anio.trim() === "" ? null : Number(form.anio),
              fecha_recepcion: form.fecha_recepcion,
              estado_pliego_id: Number(form.estado_pliego_id),
            }),
          })

      const payload = await response.json()
      if (!response.ok) {
        setSubmitError(payload.error ?? "No fue posible crear el pliego.")
        return
      }

      if (selectedFile) {
        const totalPuntos = Array.isArray(payload.puntos_detectados)
          ? payload.puntos_detectados.length
          : 0
        setSuccessMessage(
          `Pliego creado desde PDF. Se detectaron ${totalPuntos} punto(s) por OCR.`,
        )
      } else {
        setSuccessMessage("Pliego creado correctamente.")
      }

      setOpen(false)
      setForm((current) => ({
        ...initialForm,
        estado_pliego_id: current.estado_pliego_id,
      }))
      setSelectedFile(null)
      await onCreated()
    } catch {
      setSubmitError("No fue posible conectar con el backend.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isSubmitDisabled =
    isSubmitting ||
    form.folio.trim() === "" ||
    form.titulo.trim() === "" ||
    form.fecha_recepcion.trim() === "" ||
    (!selectedFile && (isLoadingCatalog || form.estado_pliego_id.trim() === ""))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#4f0d1d]">
          <Plus className="size-4" />
          Nuevo pliego
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl rounded-[1.8rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)] sm:max-w-2xl">
        <div className="p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl tracking-tight text-[#5f1024]">
              Nuevo pliego
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-[#65656d]">
              Registra un pliego manualmente o adjunta su PDF para identificar puntos
              automáticamente con OCR.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                id="folio"
                label="Folio"
                placeholder="PLI-2026-009"
                value={form.folio}
                onChange={(value) => updateField("folio", value)}
              />
              <Field
                id="fecha_recepcion"
                label="Fecha de recepción"
                type="date"
                value={form.fecha_recepcion}
                onChange={(value) => updateField("fecha_recepcion", value)}
              />
            </div>

            <Field
              id="titulo"
              label="Título"
              placeholder="Pliego petitorio abril 2026"
              value={form.titulo}
              onChange={(value) => updateField("titulo", value)}
            />

            <div className="grid gap-5 md:grid-cols-[1fr_180px_180px]">
              <Field
                id="periodo"
                label="Periodo"
                placeholder="Abril 2026"
                value={form.periodo}
                onChange={(value) => updateField("periodo", value)}
              />
              <AutoStateField label="Año" value={form.anio} />
              <AutoStateField
                label="Estado inicial"
                value={selectedFile ? "Pendiente de revisión OCR" : "Recibido"}
              />
            </div>

            <TextAreaField
              id="descripcion"
              label="Descripción"
              placeholder="Descripción breve del pliego o contexto de recepción."
              value={form.descripcion}
              onChange={(value) => updateField("descripcion", value)}
            />

            <FileField
              id="archivo_pdf"
              label="PDF del pliego para OCR"
              helperText="Si adjuntas un PDF, se usará el flujo OCR y se intentarán identificar puntos automáticamente."
              selectedFileName={selectedFile?.name ?? null}
              onChange={setSelectedFile}
            />

            {catalogError ? (
              <MessageBox tone="error">{catalogError}</MessageBox>
            ) : null}
            {submitError ? (
              <MessageBox tone="error">{submitError}</MessageBox>
            ) : null}
            {successMessage ? (
              <MessageBox tone="success">{successMessage}</MessageBox>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t border-[#ebe6ea] pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-11 rounded-full border-[#d7d1d6] px-5 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#4f0d1d]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    {selectedFile ? "Procesando PDF..." : "Guardando..."}
                  </>
                ) : (
                  selectedFile ? "Crear desde PDF" : "Crear pliego"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
      />
    </div>
  )
}

function AutoStateField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]">
        {label}
      </Label>
      <div className="flex h-12 items-center rounded-2xl border border-dashed border-[#ddd9de] bg-[#faf7f8] px-4 text-sm font-medium text-[#5d5d65]">
        {value}
      </div>
    </div>
  )
}

function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <textarea
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-28 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 py-3 text-sm text-[#35353b] outline-none transition placeholder:text-[#9a9aa1] focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      />
    </div>
  )
}

function MessageBox({
  children,
  tone,
}: {
  children: React.ReactNode
  tone: "error" | "success"
}) {
  const className =
    tone === "error"
      ? "border-[#ead5db] bg-[#fbf5f7] text-[#7a1730]"
      : "border-[#d8e5db] bg-[#f5faf6] text-[#305a3a]"

  return <div className={`rounded-2xl border px-4 py-3 text-sm ${className}`}>{children}</div>
}

function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

function FileField({
  id,
  label,
  helperText,
  selectedFileName,
  onChange,
}: {
  id: string
  label: string
  helperText: string
  selectedFileName: string | null
  onChange: (file: File | null) => void
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type="file"
        accept="application/pdf"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="h-12 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] file:mr-3 file:rounded-full file:bg-[#f3eaed] file:px-3 file:py-1 file:text-[#7a1730]"
      />
      <p className="text-sm leading-6 text-[#7a7a81]">{helperText}</p>
      {selectedFileName ? (
        <p className="text-sm font-medium text-[#7a1730]">Archivo seleccionado: {selectedFileName}</p>
      ) : null}
    </div>
  )
}

async function submitFromPDF(form: FormState, file: File) {
  const formData = new FormData()
  formData.set("folio", form.folio)
  formData.set("titulo", form.titulo)
  formData.set("descripcion", form.descripcion)
  formData.set("periodo", form.periodo)
  formData.set("anio", form.anio)
  formData.set("fecha_recepcion", form.fecha_recepcion)
  formData.set("file", file)

  return fetch("/api/unidad/pliegos/desde-pdf", {
    method: "POST",
    body: formData,
  })
}
