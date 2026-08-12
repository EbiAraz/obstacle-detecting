from pathlib import Path
import re
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib import colors

md_path = Path('PITCH_DECK_RAILSAFE_TURKEY.md')
html_path = Path('PITCH_DECK_RAILSAFE_TURKEY_investor.html')
pdf_path = Path('PITCH_DECK_RAILSAFE_TURKEY_investor.pdf')

text = md_path.read_text(encoding='utf-8')
lines = text.splitlines()

slides = []
current_title = 'RailSafe AI'
current_lines = []

for line in lines:
    if line.startswith('## '):
        if current_lines:
            slides.append((current_title, current_lines))
        current_title = line[3:].strip()
        current_lines = []
    else:
        current_lines.append(line)
if current_lines:
    slides.append((current_title, current_lines))


def compact_slide_lines(body_lines):
    out = []
    for ln in body_lines:
        t = ln.strip()
        if not t:
            continue
        if t.startswith('### '):
            out.append(t)
        elif t.startswith('- '):
            out.append(t)
        elif re.match(r'^\d+\.\s+', t):
            out.append('- ' + re.sub(r'^\d+\.\s+', '', t))
        elif not t.startswith('#'):
            out.append('- ' + t)

    # Keep deck concise for investor meeting readability.
    final = []
    bullet_count = 0
    for item in out:
        if item.startswith('### '):
            final.append(item)
            continue
        if bullet_count < 6:
            final.append(item)
            bullet_count += 1
    return final


def md_line_to_html(line):
    if line.startswith('### '):
        return f"<h3>{line[4:]}</h3>"
    if line.startswith('- '):
        return f"<li>{line[2:]}</li>"
    return f"<p>{line}</p>"

html_slides = []
for idx, (title, body) in enumerate(slides, start=1):
    compact = compact_slide_lines(body)
    blocks = []
    in_ul = False
    for ln in compact:
        if ln.startswith('- '):
            if not in_ul:
                blocks.append('<ul>')
                in_ul = True
            blocks.append(md_line_to_html(ln))
        else:
            if in_ul:
                blocks.append('</ul>')
                in_ul = False
            blocks.append(md_line_to_html(ln))
    if in_ul:
        blocks.append('</ul>')

    html_slides.append(f"""
<section class=\"slide\">\
  <div class=\"top\">\
    <span class=\"brand\">RailSafe AI</span>\
    <span class=\"num\">{idx:02d}</span>\
  </div>\
  <h2>{title}</h2>\
  <div class=\"body\">{''.join(blocks)}</div>\
</section>
""")

html = f"""<!doctype html>
<html lang=\"en\">
<head>
<meta charset=\"utf-8\"/>
<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"/>
<title>RailSafe AI Investor Deck</title>
<style>
:root {{
  --bg: #091428;
  --card: #0f1d35;
  --text: #e9f0ff;
  --muted: #a9badc;
  --accent: #22c55e;
  --accent2: #06b6d4;
}}
* {{ box-sizing: border-box; }}
body {{
  margin: 0;
  font-family: 'Avenir Next', 'Segoe UI', Arial, sans-serif;
  color: var(--text);
  background: radial-gradient(circle at 15% 12%, #16345f, var(--bg) 48%, #050c17 100%);
}}
.deck {{ width: min(1280px, 96vw); margin: 20px auto 40px; }}
.slide {{
  min-height: 88vh;
  border-radius: 26px;
  border: 1px solid #2b4267;
  background: linear-gradient(160deg, rgba(16,31,56,.96), rgba(10,20,40,.98));
  box-shadow: 0 24px 60px rgba(0,0,0,.4);
  padding: 40px 52px;
  margin-bottom: 20px;
  page-break-after: always;
}}
.top {{ display:flex; justify-content:space-between; align-items:center; margin-bottom: 14px; }}
.brand {{
  background: linear-gradient(90deg, var(--accent), var(--accent2));
  color: #07231f;
  font-weight: 800;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: .9rem;
}}
.num {{ color: var(--muted); letter-spacing: .1em; }}
h2 {{ font-size: clamp(2rem, 3.2vw, 3rem); margin: 0 0 16px; }}
h3 {{ color: #8ee4ff; margin: 12px 0 8px; }}
.body p, .body li {{ font-size: clamp(1.1rem, 1.45vw, 1.35rem); line-height: 1.5; }}
ul {{ margin-top: 8px; }}
@media print {{
  body {{ background: white; }}
  .slide {{ border: none; box-shadow: none; margin: 0; border-radius: 0; min-height: auto; }}
}}
</style>
</head>
<body>
<div class=\"deck\">{''.join(html_slides)}</div>
</body>
</html>
"""
html_path.write_text(html, encoding='utf-8')

# Investor PDF: landscape, visually clean, max 6 bullets per slide.
W, H = landscape(A4)
c = canvas.Canvas(str(pdf_path), pagesize=(W, H))

for idx, (title, body) in enumerate(slides, start=1):
    c.setFillColorRGB(0.05, 0.11, 0.21)
    c.rect(0, 0, W, H, stroke=0, fill=1)

    c.setFillColor(colors.HexColor('#1dd1a1'))
    c.roundRect(1.2*cm, H - 2.0*cm, 4.6*cm, 0.9*cm, 0.25*cm, stroke=0, fill=1)
    c.setFillColor(colors.HexColor('#04251f'))
    c.setFont('Helvetica-Bold', 11)
    c.drawString(1.45*cm, H - 1.45*cm, 'RailSafe AI')

    c.setFillColor(colors.HexColor('#dbe7ff'))
    c.setFont('Helvetica-Bold', 30)
    c.drawString(1.4*cm, H - 3.2*cm, f"{idx:02d}. {title}")

    y = H - 4.5*cm
    compact = compact_slide_lines(body)
    c.setFont('Helvetica', 15)

    for ln in compact:
        if y < 2.0*cm:
            break
        if ln.startswith('### '):
            c.setFillColor(colors.HexColor('#7dd3fc'))
            c.setFont('Helvetica-Bold', 18)
            c.drawString(1.7*cm, y, ln[4:])
            y -= 0.9*cm
            c.setFillColor(colors.HexColor('#f1f5ff'))
            c.setFont('Helvetica', 15)
            continue

        txt = ln[2:] if ln.startswith('- ') else ln
        txt = '• ' + txt

        max_chars = 90
        chunks = []
        while len(txt) > max_chars:
            cut = txt.rfind(' ', 0, max_chars)
            if cut == -1:
                cut = max_chars
            chunks.append(txt[:cut])
            txt = txt[cut:].lstrip()
        chunks.append(txt)

        c.setFillColor(colors.HexColor('#f1f5ff'))
        for chunk in chunks:
            if y < 2.0*cm:
                break
            c.drawString(1.9*cm, y, chunk)
            y -= 0.7*cm

    c.showPage()

c.save()
print(f'HTML={html_path}')
print(f'PDF={pdf_path}')
