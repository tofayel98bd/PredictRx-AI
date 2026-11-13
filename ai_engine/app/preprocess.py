"""Image cleanup before sending to the Vision LLM (rotation, size, contrast)."""
from __future__ import annotations
import io
from PIL import Image, ImageOps

MIN_SIDE, MAX_SIDE = 1600, 3000


def prepare_image(data: bytes) -> tuple[bytes, str]:
    img = Image.open(io.BytesIO(data))
    img = ImageOps.exif_transpose(img).convert("RGB")      # fix phone-camera rotation
    w, h = img.size
    long_side = max(w, h)
    if long_side < MIN_SIDE:                                # upscale tiny screenshots
        s = MIN_SIDE / long_side
        img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    elif long_side > MAX_SIDE:
        s = MAX_SIDE / long_side
        img = img.resize((int(w * s), int(h * s)), Image.LANCZOS)
    img = ImageOps.autocontrast(img, cutoff=1)               # help faded handwriting
    buf = io.BytesIO()
    img.save(buf, "JPEG", quality=92)
    return buf.getvalue(), "image/jpeg"
