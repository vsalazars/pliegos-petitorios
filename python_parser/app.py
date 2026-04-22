from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from pathlib import Path
import re

import fitz  # PyMuPDF


from pdf2image import convert_from_path
import pytesseract
from PIL import Image

app = FastAPI()


class ParsePDFRequest(BaseModel):
    archivo_path: str
    idioma: str = "spa"
    detect_points: bool = True


class PuntoDetectadoPython(BaseModel):
    numero_punto: int
    texto_original_ocr: str
    texto_final_sugerido: str
    origen_captura: str
    confidence: float
    warnings: List[str] = []


class ParsePDFResponseData(BaseModel):
    texto_ocr_bruto: str
    texto_revision_sugerida: Optional[str] = None
    ocr_procesado: bool
    ocr_fecha_procesado: str
    puntos_detectados: List[PuntoDetectadoPython]
    warnings_globales: List[str] = []


class ParsePDFResponse(BaseModel):
    ok: bool
    message: str
    error_code: Optional[str] = None
    details: List[str] = []
    data: Optional[ParsePDFResponseData] = None


@app.get("/")
def root():
    return {"ok": True, "service": "python_parser"}


def normalizar_texto(texto: str) -> str:
    texto = texto.replace("\r", "\n")
    texto = re.sub(r"[ \t]+", " ", texto)
    texto = re.sub(r"\n{3,}", "\n\n", texto)
    return texto.strip()


def extraer_texto_pdf(archivo_path: str) -> str:
    ruta = Path(archivo_path)
    if not ruta.exists():
        raise FileNotFoundError(f"No existe el archivo: {archivo_path}")

    if not ruta.is_file():
        raise ValueError(f"La ruta no es un archivo válido: {archivo_path}")

    texto_paginas: List[str] = []

    with fitz.open(archivo_path) as doc:
        for pagina in doc:
            texto = pagina.get_text("text")
            if texto:
                texto_paginas.append(texto)

    texto_completo = "\n\n".join(texto_paginas)
    return normalizar_texto(texto_completo)

def extraer_texto_ocr(archivo_path: str, idioma: str) -> str:
    imagenes = convert_from_path(archivo_path, dpi=300)

    textos = []

    for img in imagenes:
        texto = pytesseract.image_to_string(img, lang=idioma)
        if texto:
            textos.append(texto)

    texto_completo = "\n\n".join(textos)
    return normalizar_texto(texto_completo)


@app.post("/parse-pdf", response_model=ParsePDFResponse)
def parse_pdf(payload: ParsePDFRequest):
    warnings_globales: List[str] = []

    try:
        texto_ocr_bruto = extraer_texto_pdf(payload.archivo_path)

        if not texto_ocr_bruto:
             texto_ocr_bruto = extraer_texto_ocr(payload.archivo_path, payload.idioma)
        if not texto_ocr_bruto:
            warnings_globales.append(
                "No se extrajo texto del PDF. Probablemente es un PDF escaneado y requerirá OCR real."
            )

        return ParsePDFResponse(
            ok=True,
            message="PDF leído correctamente",
            data=ParsePDFResponseData(
                texto_ocr_bruto=texto_ocr_bruto,
                texto_revision_sugerida=texto_ocr_bruto if texto_ocr_bruto else None,
                ocr_procesado=True,
                ocr_fecha_procesado=datetime.now().astimezone().isoformat(),
                puntos_detectados=[],
                warnings_globales=warnings_globales,
            ),
        )

    except FileNotFoundError as e:
        return ParsePDFResponse(
            ok=False,
            message="archivo no encontrado",
            error_code="FILE_NOT_FOUND",
            details=[str(e)],
            data=None,
        )
    except Exception as e:
        return ParsePDFResponse(
            ok=False,
            message="error procesando PDF",
            error_code="PDF_PARSE_ERROR",
            details=[str(e)],
            data=None,
        )