from typing import Optional
from io import BytesIO

def extract_text_from_bytes(content: bytes) -> Optional[str]:
    """Extract text from PDF bytes.

    Strategy:
    1. Try PyPDF2 (fast, lightweight).
    2. If PyPDF2 yields no text or fails, try pdfminer.six for more robust extraction.
    3. As a last resort, return a best-effort decoded byte string.
    """
    # Attempt PyPDF2 first
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(BytesIO(content))
        text_parts = []
        for page in reader.pages:
            try:
                text = page.extract_text() or ""
                if text:
                    text_parts.append(text)
            except Exception:
                continue

        if text_parts:
            return "\n\n".join(text_parts).strip()
    except Exception:
        # ignore and fall through to next extractor
        pass

    # Try pdfminer.six for more accurate extraction (if installed)
    try:
        from pdfminer.high_level import extract_text

        text = extract_text(BytesIO(content))
        if text and text.strip():
            return text.strip()
    except Exception:
        # ignore and fall through to final fallback
        pass

    # Try DOCX extraction if the file is a Word document
    try:
        from docx import Document

        document = Document(BytesIO(content))
        lines = [paragraph.text for paragraph in document.paragraphs if paragraph.text.strip()]
        if lines:
            return "\n\n".join(lines).strip()
    except Exception:
        pass

    # Final fallback: decode bytes to provide a best-effort preview
    try:
        return content.decode(errors="replace")
    except Exception:
        return None
