"""One-off (re-runnable): replace the old Miramar logo on the three static
employer PDFs with the new lockup. Meeting 2026-10-13.

Usage: /tmp/pdfenv/bin/python scripts/swap-doc-logos.py <out_dir>
Reads server/assets/<name>.pdf, writes <out_dir>/<name>.pdf. The old logo's
box is reused: new logo is sized by the box HEIGHT (taller lockup), centered
or left-aligned like the original, so nothing below moves.
"""
import sys, pymupdf

LOGO = "client/public/images/miramar-logo-transparent.png"  # charcoal text, for white paper
ASPECT = 1479 / 933
JOBS = {"performance-evaluation": "center", "operator-permit": "left", "attendance-sheet": "left"}

out_dir = sys.argv[1]
for name, align in JOBS.items():
    doc = pymupdf.open(f"server/assets/{name}.pdf")
    page = doc[0]
    placed = [(img[0], page.get_image_rects(img[0])) for img in page.get_images(full=True)]
    xref, rects = next((x, r) for x, r in placed if r)
    box = rects[0]
    page.add_redact_annot(box, fill=(1, 1, 1))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_REMOVE, graphics=0, text=1)
    h = box.height
    w = h * ASPECT
    x0 = box.x0 + (box.width - w) / 2 if align == "center" else box.x0
    page.insert_image(pymupdf.Rect(x0, box.y0, x0 + w, box.y1), filename=LOGO, keep_proportion=True)
    doc.save(f"{out_dir}/{name}.pdf", garbage=3, deflate=True)
    print(name, "old box", tuple(round(v) for v in box), "new w", round(w))
