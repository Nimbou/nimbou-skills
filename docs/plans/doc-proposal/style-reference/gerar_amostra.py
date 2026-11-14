#!/usr/bin/env python3
"""Gera a amostra de duas páginas a partir de conteudo.json."""

from __future__ import annotations

import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF


HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[4]
LOGO = ROOT / "plugins/nimbou-skills/skills/doc-proposal/assets/nimbou-logo.svg"
FONT_DIR = Path("/usr/share/fonts/truetype/lato")
OUT = HERE / "amostra-estilo.pdf"
W, H = A4
M = 43
CW = W - 2 * M

NAVY = colors.HexColor("#14263c")
BLUE = colors.HexColor("#296cb5")
PALE = colors.HexColor("#edf2f9")
HEADER_TEXT = colors.HexColor("#a9c7e8")
NOTE = colors.HexColor("#4d6177")
TABLE_HEAD = colors.HexColor("#dce8f5")
ALT = colors.HexColor("#f3f6fa")
RULE = colors.HexColor("#d5dfeb")

pdfmetrics.registerFont(TTFont("Lato", str(FONT_DIR / "Lato-Regular.ttf")))
pdfmetrics.registerFont(TTFont("Lato-Bold", str(FONT_DIR / "Lato-Bold.ttf")))


def style(name: str, size: float, leading: float, bold: bool = False, color=NAVY):
    return ParagraphStyle(
        name,
        fontName="Lato-Bold" if bold else "Lato",
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceAfter=0,
        allowWidows=0,
        allowOrphans=0,
    )


TITLE = style("title", 19.5, 24, True)
SECTION = style("section", 12.8, 17, True, BLUE)
BODY = style("body", 10.2, 14.4)
CELL = style("cell", 9.5, 13)
CELL_BOLD = style("cell-bold", 9.5, 13, True)
FLOW = style("flow", 9.5, 13, True)


def paragraph(c: canvas.Canvas, text: str, x: float, top: float, width: float, pstyle: ParagraphStyle) -> float:
    p = Paragraph(escape(text), pstyle)
    _, height = p.wrap(width, H)
    p.drawOn(c, x, H - top - height)
    return top + height


def header_footer(c: canvas.Canvas, data: dict, page: int) -> None:
    c.setFillColor(NAVY)
    c.rect(0, H - 84, W, 84, stroke=0, fill=1)
    drawing = svg2rlg(str(LOGO))
    scale = 116 / drawing.width
    c.saveState()
    c.translate(M, H - 53)
    c.scale(scale, scale)
    renderPDF.draw(drawing, c, 0, 0)
    c.restoreState()

    c.setFillColor(HEADER_TEXT)
    c.setFont("Lato", 8)
    c.drawRightString(W - M, H - 34, data["cliente"])
    c.setFont("Lato", 7.5)
    c.drawRightString(W - M, H - 49, f'Responsável: {data["responsavel"]}  ·  {data["prestador"]}  ·  {data["data"]}')

    c.setStrokeColor(RULE)
    c.setLineWidth(0.6)
    c.line(M, 37, W - M, 37)
    c.setFillColor(NOTE)
    c.setFont("Lato", 7.5)
    c.drawString(M, 24, f'{data["prestador"]}  ·  {data["assunto_rodape"]}  ·  {data["versao"]}')
    c.drawRightString(W - M, 24, f'{page} / {len(data["paginas"])}')


def opening(c: canvas.Canvas, page: dict) -> float:
    c.setFillColor(BLUE)
    c.setFont("Lato-Bold", 8)
    c.drawString(M, H - 108, page["rotulo"])
    bottom = paragraph(c, page["titulo"], M, 124, CW, TITLE)
    return bottom + 21


def section(c: canvas.Canvas, title: str, top: float) -> float:
    return paragraph(c, title, M, top, CW, SECTION) + 12


def body(c: canvas.Canvas, text: str, top: float) -> float:
    return paragraph(c, text, M, top, CW, BODY) + 10


def flow(c: canvas.Canvas, labels: list[str], top: float) -> float:
    gap = 12
    block_w = (CW - gap * 3) / 4
    block_h = 66
    for i, label in enumerate(labels):
        x = M + i * (block_w + gap)
        c.setFillColor(PALE)
        c.roundRect(x, H - top - block_h, block_w, block_h, 9, stroke=0, fill=1)
        c.setFillColor(BLUE)
        c.setFont("Lato-Bold", 8)
        c.drawString(x + 12, H - top - 20, f"0{i + 1}")
        paragraph(c, label, x + 12, top + 29, block_w - 24, FLOW)
        if i < 3:
            c.setStrokeColor(BLUE)
            c.setLineWidth(1)
            c.line(x + block_w + 2, H - top - 33, x + block_w + gap - 2, H - top - 33)
    return top + block_h + 24


def table(c: canvas.Canvas, data: dict, top: float, first_ratio: float = 0.30) -> float:
    x1 = M
    w1 = CW * first_ratio
    x2 = M + w1
    w2 = CW - w1
    rows = [data["cabecalho"], *data["linhas"]]
    y = top
    for idx, row in enumerate(rows):
        pstyle = CELL_BOLD if idx == 0 else CELL
        p1 = Paragraph(escape(row[0]), pstyle)
        p2 = Paragraph(escape(row[1]), pstyle)
        h1 = p1.wrap(w1 - 20, H)[1]
        h2 = p2.wrap(w2 - 20, H)[1]
        rh = max(h1, h2) + 16
        assert y + rh <= H - 52, f"Tabela excedeu área útil: {y + rh:.1f} pt do topo"
        if idx == 0:
            c.setFillColor(TABLE_HEAD)
        elif idx % 2 == 1:
            c.setFillColor(ALT)
        else:
            c.setFillColor(colors.white)
        c.rect(M, H - y - rh, CW, rh, fill=1, stroke=0)
        p1.drawOn(c, x1 + 10, H - y - 8 - h1)
        p2.drawOn(c, x2 + 10, H - y - 8 - h2)
        y += rh
        if idx == 0:
            c.setStrokeColor(HEADER_TEXT)
            c.setLineWidth(0.6)
            c.line(M, H - y, M + CW, H - y)
    return y + 14


def build() -> None:
    data = json.loads((HERE / "conteudo.json").read_text(encoding="utf-8"))
    assert len(data["paginas"]) == 2
    c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
    c.setTitle("Amostra visual do estilo de proposta")
    c.setAuthor("Nimbou Software")
    c.setSubject("Amostra sintética de duas páginas, versão demonstração")

    p1, p2 = data["paginas"]
    header_footer(c, data, 1)
    y = opening(c, p1)
    y = section(c, p1["secao"], y)
    y = body(c, p1["paragrafo"], y)
    y = flow(c, p1["fluxo"], y)
    y = table(c, p1["tabela"], y)
    assert y <= H - 52, f"Página 1: conteúdo termina a {y:.1f} pt do topo"
    page1_bottom = y
    c.showPage()

    header_footer(c, data, 2)
    y = opening(c, p2)
    y = section(c, p2["secao"], y)
    y = body(c, p2["paragrafo"], y)
    y = table(c, p2["tabela_responsabilidade"], y)
    y = section(c, p2["secao_condicoes"], y)
    y = table(c, p2["tabela_condicoes"], y)
    assert y <= H - 52, f"Página 2: conteúdo termina a {y:.1f} pt do topo"
    c.save()
    print(f"PDF: {OUT}")
    print(f"Fim do conteúdo: página 1 a {page1_bottom:.1f} pt; página 2 a {y:.1f} pt do topo")
    print(f"Limite útil: {H - 52:.1f} pt do topo")


if __name__ == "__main__":
    build()
