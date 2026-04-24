"use client"

import { LoaderCircle, Plus } from "lucide-react"
import { useEffect, useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  type CategoriaPuntoOption,
  type EstadoPuntoOption,
  type PrioridadOption,
  resolveDefaultEstadoPuntoId,
  resolveDefaultPrioridadId,
} from "@/lib/punto-catalogos"

type NewPointDialogProps = {
  pliegoId: number
  nextNumeroPunto: number
  onCreated: () => Promise<void> | void
}

type FormState = {
  texto_final: string
  prioridad_id: string
  categoria_id: string
}

const initialForm: FormState = {
  texto_final: "",
  prioridad_id: "",
  categoria_id: "",
}

export function NewPointDialog({
  pliegoId,
  nextNumeroPunto,
  onCreated,
}: NewPointDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<FormState>(initialForm)
  const [prioridades, setPrioridades] = useState<PrioridadOption[]>([])
  const [categorias, setCategorias] = useState<CategoriaPuntoOption[]>([])
  const [estados, setEstados] = useState<EstadoPuntoOption[]>([])
  const [isLoadingCatalogs, setIsLoadingCatalogs] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const detectedEstadoId = resolveDefaultEstadoPuntoId(estados)

  useEffect(() => {
    if (!open || (prioridades.length > 0 && estados.length > 0 && categorias.length > 0)) {
      return
    }

    const loadCatalogs = async () => {
      setIsLoadingCatalogs(true)

      try {
        const [prioridadesResponse, estadosResponse, categoriasResponse] = await Promise.all([
          fetch("/api/unidad/catalogos/prioridades", { cache: "no-store" }),
          fetch("/api/unidad/catalogos/estados-punto", { cache: "no-store" }),
          fetch("/api/unidad/catalogos/categorias-punto", { cache: "no-store" }),
        ])

        const prioridadesPayload = await prioridadesResponse.json()
        const estadosPayload = await estadosResponse.json()
        const categoriasPayload = await categoriasResponse.json()

        if (!prioridadesResponse.ok) {
          toast.error(
            prioridadesPayload.error ?? "No fue posible cargar prioridades.",
          )
          return
        }

        if (!estadosResponse.ok) {
          toast.error(estadosPayload.error ?? "No fue posible cargar estados de punto.")
          return
        }
        if (!categoriasResponse.ok) {
          toast.error(
            categoriasPayload.error ?? "No fue posible cargar categorías de punto.",
          )
          return
        }

        const prioridadItems = (prioridadesPayload.items ?? []) as PrioridadOption[]
        const estadoItems = (estadosPayload.items ?? []) as EstadoPuntoOption[]
        const categoriaItems = (categoriasPayload.items ?? []) as CategoriaPuntoOption[]
        setPrioridades(prioridadItems)
        setEstados(estadoItems)
        setCategorias(categoriaItems)

        const defaultPrioridadId = resolveDefaultPrioridadId(prioridadItems)

        setForm((current) => ({
          ...current,
          prioridad_id: current.prioridad_id || String(defaultPrioridadId ?? ""),
        }))
      } catch {
        toast.error("No fue posible conectar con los catálogos del sistema.")
      } finally {
        setIsLoadingCatalogs(false)
      }
    }

    void loadCatalogs()
  }, [categorias.length, estados.length, open, prioridades.length])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      setForm({
        ...initialForm,
        prioridad_id: form.prioridad_id,
        categoria_id: form.categoria_id,
      })
    }
  }

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (
      form.texto_final.trim() === "" ||
      form.prioridad_id.trim() === ""
    ) {
      toast.error("Completa los campos obligatorios del punto.")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/unidad/pliegos/${pliegoId}/puntos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          numero_punto: nextNumeroPunto,
          texto_final: form.texto_final.trim(),
          prioridad_id: Number(form.prioridad_id),
          estado_punto_id: Number(detectedEstadoId),
          categoria_id:
            form.categoria_id.trim() === "" ? null : Number(form.categoria_id),
          origen_captura: "manual",
          requiere_validacion: false,
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        toast.error(payload.error ?? "No fue posible crear el punto.")
        return
      }

      setOpen(false)
      setForm((current) => ({
        ...initialForm,
        prioridad_id: current.prioridad_id,
        categoria_id: current.categoria_id,
      }))
      await onCreated()
      toast.success("Punto agregado al pliego.")
    } catch {
      toast.error("No fue posible conectar con el backend.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#4f0d1d]">
          <Plus className="size-4" />
          Agregar punto
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl rounded-[1.8rem] border border-[#ddd8de] bg-white p-0 shadow-[0_30px_80px_rgba(64,42,48,0.18)]">
        <div className="p-6 sm:p-7">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl tracking-tight text-[#5f1024]">
              Nuevo punto
            </DialogTitle>
            <DialogDescription className="text-sm leading-7 text-[#65656d]">
              Agrega manualmente un punto al pliego con su redacción final y su
              clasificación inicial.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                id="prioridad_id"
                label="Prioridad"
                value={form.prioridad_id}
                onChange={(value) => updateField("prioridad_id", value)}
                disabled={isLoadingCatalogs}
                options={prioridades.map((item) => ({
                  value: String(item.id),
                  label: item.nombre,
                }))}
              />
              <SelectField
                id="categoria_id"
                label="Categoría"
                value={form.categoria_id}
                onChange={(value) => updateField("categoria_id", value)}
                disabled={isLoadingCatalogs}
                options={categorias.map((item) => ({
                  value: String(item.id),
                  label: item.nombre,
                }))}
                placeholder="Selecciona una categoría"
              />
            </div>

            <TextAreaField
              id="texto_final"
              label="Texto final del punto"
              value={form.texto_final}
              onChange={(value) => updateField("texto_final", value)}
              placeholder="Describe el punto petitorio con la redacción final que conservará el sistema."
            />

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
                disabled={isSubmitting || isLoadingCatalogs || !detectedEstadoId}
                className="h-11 rounded-full bg-[#5f1024] px-5 text-white hover:bg-[#4f0d1d]"
              >
                {isSubmitting ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar punto"
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
  placeholder = "Selecciona una opción",
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  disabled?: boolean
  placeholder?: string
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
        disabled={disabled}
        className="h-12 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 text-sm text-[#35353b] outline-none transition focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      >
        <option value="">{placeholder}</option>
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
        className="min-h-36 w-full rounded-2xl border border-[#ddd9de] bg-white px-4 py-3 text-sm text-[#35353b] outline-none transition placeholder:text-[#9a9aa1] focus:border-[#8f1d35] focus:ring-4 focus:ring-[#f3eaed]"
      />
    </div>
  )
}
