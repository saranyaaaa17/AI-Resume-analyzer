from typing import Optional
from io import BytesIO

def extract_text_from_bytes(content: bytes) -> Optional[str]:
    """Extract text from PDF bytes using PyPDF2. Returns concatenated page text or None on failure."""
    try:
        from PyPDF2 import PdfReader

        reader = PdfReader(BytesIO(content))
        text_parts = []
        for page in reader.pages:
            try:
                text = page.extract_text() or ""
                text_parts.append(text)
            except Exception:
                continue

        if not text_parts:
            # Fallback: try to decode bytes to provide a best-effort preview
            try:
                return content.decode(errors="replace")
            except Exception:
                return None

        return "\n\n".join(text_parts).strip()
    except Exception:
        # If PyPDF2 fails entirely, try a best-effort byte decode
        try:
            return content.decode(errors="replace")
        except Exception:
            return None
