from __future__ import annotations


def build_sample_resume_pdf_bytes() -> bytes:
    """Build a tiny single-page PDF with extractable text for tests and smoke checks."""
    header = b"%PDF-1.4\n"

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    ]

    stream_text = (
        b"BT /F1 12 Tf 72 110 Td (Sample Resume) Tj T* "
        b"(Experienced software engineer with 5 years of experience. Improved performance by 40%.) Tj ET"
    )
    objects.append(
        b"4 0 obj\n"
        + f"<< /Length {len(stream_text)} >>\n".encode()
        + b"stream\n"
        + stream_text
        + b"\nendstream\nendobj\n"
    )
    objects.append(b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")

    parts = [header]
    offsets = [0]
    current_offset = len(header)

    for obj in objects:
        offsets.append(current_offset)
        parts.append(obj)
        current_offset += len(obj)

    xref_offset = current_offset
    xref_lines = [b"xref\n", b"0 6\n", b"0000000000 65535 f \n"]
    for offset in offsets[1:]:
        xref_lines.append(f"{offset:010d} 00000 n \n".encode())

    trailer = (
        b"trailer\n"
        b"<< /Size 6 /Root 1 0 R >>\n"
        b"startxref\n"
        + str(xref_offset).encode()
        + b"\n%%EOF\n"
    )

    return b"".join(parts + xref_lines + [trailer])
