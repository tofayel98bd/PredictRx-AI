"""Document & image cleanup before sending to the Vision LLM (PDF pass-through, rotation, size, contrast)."""
from __future__ import annotations
import io
from PIL import Image, ImageOps

MIN_SIDE, MAX_SIDE = 1600, 3000
MAX_INPUT_BYTES = 10 * 1024 * 1024  # 10 MB hard safety ceiling
Image.MAX_IMAGE_PIXELS = 25_000_000  # Protect against decompression bombs


def is_pdf_bytes(data: bytes) -> bool:
    """Check PDF magic header."""
    return data.lstrip()[:5] == b"%PDF-"


def prepare_image(data: bytes) -> tuple[bytes, str]:
    """Validate and normalize prescription bytes (JPEG/PNG/WEBP or PDF) for Vision LLM input."""
    if not data:
        raise ValueError("Empty prescription document payload.")
    if len(data) > MAX_INPUT_BYTES:
        raise ValueError(f"Prescription document exceeds maximum allowed size of {MAX_INPUT_BYTES // (1024 * 1024)} MB.")

    if is_pdf_bytes(data):
        return data, "application/pdf"

    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img).convert("RGB")  # fix phone-camera rotation
    w, h = img.size
    long_side = max(w, h)
    if long_side < MIN_SIDE:  # upscale tiny screenshots
        s = MIN_SIDE / long_side
        img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    elif long_side > MAX_SIDE:
        s = MAX_SIDE / long_side
        img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    img = ImageOps.autocontrast(img, cutoff=1)  # help faded handwriting
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=92)
    return buf.getvalue(), "image/jpeg"
