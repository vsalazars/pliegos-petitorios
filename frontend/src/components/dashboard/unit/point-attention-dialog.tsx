"use client"

import { LoaderCircle, Paperclip } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
import type { TipoEvidenciaOption, PuntoEvidenciaItem } from "@/lib/punto-operacion"
import type { UnidadPliegoPunto } from "@/lib/unidad-dashboard"

type PointAttentionDialogProps = {
  pliegoId: number
  punto: UnidadPliegoPunto
  onSaved: () => Promise<void> | void
}

type UploadFormState = {
  tipo_evidencia_id: string
  titulo: string
  descripcion: string
}

const initialUploadForm: UploadFormState = {
  tipo_evidencia_id: "",
  titulo: "",
  descripcion: "",
}

export function PointAttentionDialog({
  pliegoId,
  punto,
  onSaved,
}: PointAttentionDialogProps) {
  const [open, setOpen] = useState(false)
  const [evidencias, setEvidencias] = useState<PuntoEvidenciaItem[]>([])
  const [tiposEvidencia, setTiposEvidencia] = useState<TipoEvidenciaOption[]>([])
  const [uploadForm, setUploadForm] = useState<UploadFormState>(initialUploadForm)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleOpenChange = async (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setUploadForm(initialUploadForm)
      setSelectedFile(null)
      return
    }

    setIsLoading(true)
    try {
      const [evidenciasResponse, tiposResponse] = await Promise.all([
        fetch(`/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}/evidencias`, {
          cache: "no-store",
        }),
        fetch("/api/unidad/catalogos/tipos-evidencia", { cache: "no-store" }),
      ])

      const evidenciasPayload = await evidenciasResponse.json()
      const tiposPayload = await tiposResponse.json()

      if (!evidenciasResponse.ok) {
        toast.error(
          evidenciasPayload.error ?? "No fue posible cargar las evidencias del punto.",
        )
        return
      }

      if (!tiposResponse.ok) {
        toast.error(
          tiposPayload.error ?? "No fue posible cargar tipos de evidencia.",
        )
        return
      }

      const loadedTipos = (tiposPayload.items ?? []) as TipoEvidenciaOption[]
      setEvidencias((evidenciasPayload.items ?? []) as PuntoEvidenciaItem[])
      setTiposEvidencia(loadedTipos)
      setUploadForm((current) => ({
        ...current,
        tipo_evidencia_id:
          current.tipo_evidencia_id || String(loadedTipos[0]?.id ?? ""),
      }))
    } catch {
      toast.error("No fue posible conectar con el backend del punto.")
    } finally {
      setIsLoading(false)
    }
  }

  const refreshEvidencias = async () => {
    const response = await fetch(
      `/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}/evidencias`,
      {
        cache: "no-store",
      },
    )
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload.error ?? "No fue posible recargar evidencias.")
    }

    setEvidencias((payload.items ?? []) as PuntoEvidenciaItem[])
  }

  const handleUploadEvidence = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedFile || uploadForm.tipo_evidencia_id.trim() === "") {
      toast.error("Selecciona archivo y tipo de evidencia.")
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.set("file", selectedFile)
      formData.set("tipo_evidencia_id", uploadForm.tipo_evidencia_id)
      if (uploadForm.titulo.trim() !== "") {
        formData.set("titulo", uploadForm.titulo.trim())
      }
      if (uploadForm.descripcion.trim() !== "") {
        formData.set("descripcion", uploadForm.descripcion.trim())
      }

      const response = await fetch(
        `/api/unidad/pliegos/${pliegoId}/puntos/${punto.id}/evidencias`,
        {
          method: "POST",
          body: formData,
        },
      )
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible subir la evidencia.")
        return
      }

      setSelectedFile(null)
      setUploadForm((current) => ({
        ...initialUploadForm,
        tipo_evidencia_id: current.tipo_evidencia_id,
      }))
      await refreshEvidencias()
      await onSaved()
      toast.success("Evidencia registrada correctamente.")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No fue posible conectar con el backend."
      toast.error(message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(value) => void handleOpenChange(value)}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          aria-label={`Atender punto ${punto.numero_punto}`}
          title="Atender punto"
          className="size-10 rounded-full border-[#d6d0d6] bg-white p-0 text-[#5d5d65] hover:border-[#5f1024] hover:text-[#5f1024]"
        >
          <Paperclip className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] w-[min(1100px,calc(100vw-2rem))] max-w-none overflow-x-hidden overflow-y-auto rounded-[1.8rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)] sm:max-w-none">
        <div className="p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl tracking-tight text-[#5f1024]">
              Atender punto {punto.numero_punto}
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-[#65656d]">
              Adjunta y organiza las evidencias del punto para dejarlo listo antes de
              enviarlo a revisión DES.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm leading-7 text-[#4c4c54]">
            {punto.texto_final}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <section className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-medium text-[#5f1024]">Evidencias registradas</h3>
                <span className="text-sm text-[#7a7a81]">
                  {evidencias.length} evidencia(s)
                </span>
              </div>

              {isLoading ? (
                <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm text-[#66666d]">
                  Cargando evidencias...
                </div>
              ) : evidencias.length === 0 ? (
                <div className="rounded-2xl border border-[#ece8ec] bg-[#faf8f9] px-4 py-4 text-sm leading-7 text-[#66666d]">
                  Todavía no hay evidencias cargadas para este punto.
                </div>
              ) : (
                <div className="space-y-3">
                  {evidencias.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#ece8ec] bg-white px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#4a4a52]">
                            {item.titulo ?? item.archivo.nombre_original}
                          </p>
                          <p className="mt-1 text-sm text-[#6a6a72]">
                            {item.tipo_evidencia_nombre}
                          </p>
                        </div>
                        <span className="text-xs uppercase tracking-[0.14em] text-[#9a9aa1]">
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {item.descripcion ? (
                        <p className="mt-2 text-sm leading-7 text-[#67676f]">
                          {item.descripcion}
                        </p>
                      ) : null}

                      <p className="mt-3 text-xs text-[#8b8b92]">
                        Archivo: {item.archivo.nombre_original} · {formatFileSize(item.archivo.tamano_bytes)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <form
                className="space-y-4 rounded-2xl border border-[#ece8ec] bg-white px-4 py-4"
                onSubmit={handleUploadEvidence}
              >
                <h3 className="font-medium text-[#5f1024]">Agregar evidencia</h3>

                <SelectField
                  id={`tipo-evidencia-${punto.id}`}
                  label="Tipo de evidencia"
                  value={uploadForm.tipo_evidencia_id}
                  onChange={(value) =>
                    setUploadForm((current) => ({ ...current, tipo_evidencia_id: value }))
                  }
                  options={tiposEvidencia.map((item) => ({
                    value: String(item.id),
                    label: item.nombre,
                  }))}
                />

                <Field
                  id={`titulo-evidencia-${punto.id}`}
                  label="Título"
                  value={uploadForm.titulo}
                  onChange={(value) =>
                    setUploadForm((current) => ({ ...current, titulo: value }))
                  }
                  placeholder="Evidencia de atención del punto"
                />

                <TextAreaField
                  id={`descripcion-evidencia-${punto.id}`}
                  label="Descripción"
                  value={uploadForm.descripcion}
                  onChange={(value) =>
                    setUploadForm((current) => ({ ...current, descripcion: value }))
                  }
                  placeholder="Describe brevemente qué demuestra el archivo."
                />

                <div className="space-y-2">
                  <Label htmlFor={`archivo-evidencia-${punto.id}`}>Archivo</Label>
                  <Input
                    id={`archivo-evidencia-${punto.id}`}
                    type="file"
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                    className="h-12 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] file:mr-3 file:rounded-full file:bg-[#f3eaed] file:px-3 file:py-1 file:text-[#7a1730]"
                  />
                  {selectedFile ? (
                    <p className="text-sm text-[#7a1730]">{selectedFile.name}</p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  disabled={isUploading || isLoading}
                  className="h-10 rounded-full bg-[#5f1024] px-4 text-white hover:bg-[#4f0d1d]"
                >
                  {isUploading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    "Subir evidencia"
                  )}
                </Button>
              </form>
            </section>
          </div>
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
      <Input
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border-[#ddd9de] bg-white text-sm text-[#35353b] focus-visible:border-[#8f1d35] focus-visible:ring-[#f3eaed]"
      />
    </div>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-[#5d5d65]" htmlFor={id}>
        {label}
      </Label>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
        className="min-h-24 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 py-3 text-sm text-[#35353b] outline-none transition placeholder:text-[#9a9aa1] focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      />
    </div>
  )
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value))
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
