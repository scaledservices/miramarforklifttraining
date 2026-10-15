"""Re-runnable: replace old logo + old URLs/brand on the downloadable PDFs.
Meeting 2026-10-14 (Alberto): documents still showed forkliftcertified.training.

Usage: /tmp/pdfenv/bin/python scripts/fix-doc-branding.py <out_dir>

Logos: the old logo IMAGE is swapped in place (page.replace_image), padded to
the old box's aspect ratio so nothing moves and the new lockup is never
stretched. Light or dark variant is picked from the background around it.
Text: old URL/brand spans are removed and redrawn in Inter at the same size,
color and baseline, keeping the original alignment.
"""
import io, sys, re
import pymupdf
from PIL import Image

LIGHT_LOGO = "client/public/images/miramar-logo-transparent.png"   # charcoal text, light paper
DARK_LOGO = "client/public/images/miramar-logo-darkbg.png"         # light text, dark slides
FONT_REG = "/Users/peternemrow/Library/Fonts/Inter-Regular.ttf"
FONT_BOLD = "/Users/peternemrow/Library/Fonts/Inter-Bold.ttf"
NEW_URL = "training.miramarforklift.com"

# old logo pixel sizes per doc (verified by rendering crops) + alignment in its box
DOCS = {
    "attendance-sheet": ([], "left"),
    "operator-permit": ([], "left"),
    "performance-evaluation": ([], "left"),
    "osha-rules-regulations": ([(309, 137), (1112, 494)], "center"),
    "pre-operation-checklist": ([(1881, 836), (731, 324)], "left"),
    "sample-test": ([(829, 368)], "left"),
    "site-presentation": ([(306, 153), (500, 250)], "right"),
}
TEXT_FIXES = [
    (re.compile(r"(?:www\.)?forkliftcertified\.training", re.I), NEW_URL),
    (re.compile(r"(?<!training\.)miramarforklift\.training", re.I), NEW_URL),
    (re.compile(r"^Forklift Certified Training$"), "Miramar Forklift Training"),
    (re.compile(r"^Forklift Certified$"), "Miramar Forklift Training"),
]


def padded_logo(path: str, box_aspect: float, align: str, target_w: int) -> bytes:
    """Logo padded with transparency to box_aspect, so replace_image never stretches.
    Scaled to ~2x the old image's pixel width so files don't balloon."""
    im = Image.open(path).convert("RGBA")
    scale = min(1.0, (target_w * 2) / (im.width * max(1.0, box_aspect / (im.width / im.height))))
    if scale < 1.0:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    w, h = im.size
    if w / h < box_aspect:  # pad width
        W = round(h * box_aspect)
        canvas = Image.new("RGBA", (W, h), (0, 0, 0, 0))
        x = {"left": 0, "center": (W - w) // 2, "right": W - w}[align]
        canvas.paste(im, (x, 0))
    else:  # pad height, center vertically
        H = round(w / box_aspect)
        canvas = Image.new("RGBA", (w, H), (0, 0, 0, 0))
        canvas.paste(im, (0, (H - h) // 2))
    buf = io.BytesIO()
    canvas.save(buf, "PNG")
    return buf.getvalue()


def background_is_dark(page: pymupdf.Page, rect: pymupdf.Rect) -> bool:
    ring = pymupdf.Rect(rect.x0 - 6, rect.y0 - 6, rect.x1 + 6, rect.y1 + 6) & page.rect
    pix = page.get_pixmap(clip=ring, dpi=36, colorspace=pymupdf.csRGB, alpha=False)
    s = pix.samples
    px = [(s[i] + s[i + 1] + s[i + 2]) / 3 for i in range(0, len(s), 3)]
    edge = px[: pix.width] + px[-pix.width:]  # top + bottom rows (outside the logo)
    return sum(edge) / len(edge) < 110


def fix_logos(doc, sizes, align, report):
    done = set()
    for page in doc:
        for img in page.get_images(full=True):
            xref, w, h = img[0], img[2], img[3]
            if (w, h) not in sizes or xref in done:
                continue
            rects = page.get_image_rects(xref)
            if not rects:
                continue
            r = rects[0]
            dark = background_is_dark(page, r)
            data = padded_logo(DARK_LOGO if dark else LIGHT_LOGO, r.width / r.height, align, w)
            page.replace_image(xref, stream=data)
            done.add(xref)
            report.append(f"  logo xref {xref} {w}x{h} -> {'dark' if dark else 'light'} variant")
    return len(done)


def fix_text(doc, report):
    n = 0
    for page in doc:
        edits = []
        for b in page.get_text("dict")["blocks"]:
            for l in b.get("lines", []):
                for s in l["spans"]:
                    new = s["text"]
                    for pat, rep in TEXT_FIXES:
                        new = pat.sub(rep, new)
                    if new != s["text"]:
                        edits.append((s, new))
        if not edits:
            continue
        for s, _ in edits:
            r = pymupdf.Rect(s["bbox"])
            r.y0 += r.height * 0.2
            r.y1 -= r.height * 0.2
            page.add_redact_annot(r, fill=False)
        page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                              graphics=pymupdf.PDF_REDACT_LINE_ART_NONE,
                              text=pymupdf.PDF_REDACT_TEXT_REMOVE)
        for s, new in edits:
            bold = "Bold" in s["font"]
            fontfile = FONT_BOLD if bold else FONT_REG
            fname = "InterB" if bold else "InterR"
            font = pymupdf.Font(fontfile=fontfile)
            size = s["size"]
            width = font.text_length(new, fontsize=size)
            x0, y0, x1, _ = s["bbox"]
            old_center = (x0 + x1) / 2
            page_center = page.rect.width / 2
            # alignment: right-aligned footer cells end near the right margin,
            # centered ones sit on the page center, otherwise keep the left edge
            if x1 > page.rect.width * 0.8 and x0 > page.rect.width * 0.5:
                x = x1 - width
            elif abs(old_center - page_center) < 25:
                x = page_center - width / 2
            else:
                x = x0
            c = s["color"]
            color = ((c >> 16 & 255) / 255, (c >> 8 & 255) / 255, (c & 255) / 255)
            page.insert_text((x, s["origin"][1]), new, fontsize=size, fontname=fname,
                             fontfile=fontfile, color=color)
            report.append(f"  p{page.number + 1}: {s['text'][:60]!r} -> {new[:60]!r}")
            n += 1
    return n


out_dir = sys.argv[1]
for name, (sizes, align) in DOCS.items():
    doc = pymupdf.open(f"server/assets/{name}.pdf")
    report = []
    logos = fix_logos(doc, set(sizes), align, report) if sizes else 0
    texts = fix_text(doc, report)
    doc.save(f"{out_dir}/{name}.pdf", garbage=3, deflate=True)
    print(f"{name}: {logos} logo image(s), {texts} text fix(es)")
    for line in report[:6]:
        print(line)
    if len(report) > 6:
        print(f"  ... {len(report) - 6} more")
