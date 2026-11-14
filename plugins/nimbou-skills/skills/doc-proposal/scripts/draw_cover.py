"""Capa vetorial Nimbou; o chamador registra fontes e gerencia páginas e arquivo.

Uso: draw_cover(canvas, client=..., subtitle=..., issue_date=..., issue_year=...).
Requer reportlab e svglib. Os assets acompanham a skill.
"""
from html import escape
from io import BytesIO
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import Paragraph
from svglib.svglib import svg2rlg

ASSETS = Path(__file__).resolve().parents[1] / 'assets'


def draw_cover(pdf, *, client, subtitle, issue_date, issue_year,
               client_description='', title_prefix='Proposta de',
               title_lines=('Assessoria', 'Empresarial'),
               regular_font='Lato', bold_font='Lato-Bold'):
    """Desenha em A4; textos extensos exigem ajuste editorial, sem encolher fonte."""
    width, height = A4
    if not 1 <= len(title_lines) <= 2:
        raise ValueError('Use uma ou duas linhas de título nesta composição.')
    for line in title_lines:
        if pdfmetrics.stringWidth(line, bold_font, 39) > width-104:
            raise ValueError('Título excede a coluna; ajuste a divisão das linhas.')
    if any(pdfmetrics.stringWidth(str(value), regular_font, 8.5) > (width-104)/2
           for value in (issue_date, 'NIMBOU SOFTWARE')):
        raise ValueError('Data ou identificação excede a coluna do rodapé.')
    body = ParagraphStyle('CoverSubtitle', fontName=regular_font, fontSize=12.5,
                          leading=18, textColor=HexColor('#c1d2e4'))
    lead = Paragraph(escape(subtitle), body)
    _, lead_height = lead.wrap(375, 200)
    if lead_height > 72:
        raise ValueError('Subtítulo longo; resuma ou adapte a composição da capa.')
    client_style = ParagraphStyle('CoverClient', fontName=bold_font, fontSize=17,
                                  leading=21, textColor=white)
    client_par = Paragraph(escape(client), client_style)
    _, client_height = client_par.wrap(235, 100)
    if client_height > 42:
        raise ValueError('Nome do cliente longo; adapte a área do destinatário.')
    if pdfmetrics.stringWidth(client_description, regular_font, 9.5) > 235:
        raise ValueError('Descrição do cliente longa; resuma ou adapte a composição.')

    logo = svg2rlg(str(ASSETS/'nimbou-logo.svg'))
    symbol_xml = (ASSETS/'nimbou-simbolo.svg').read_text(encoding='utf-8')
    symbol = svg2rlg(BytesIO(symbol_xml.replace('#296cb5', '#398be0').encode()))

    def artwork(drawing, x, y, target_width):
        pdf.saveState()
        pdf.translate(x, y)
        pdf.scale(target_width/drawing.width, target_width/drawing.width)
        renderPDF.draw(drawing, pdf, 0, 0)
        pdf.restoreState()

    pdf.saveState()
    pdf.setFillColor(HexColor('#081b30'))
    pdf.rect(0, 0, width, height, fill=1, stroke=0)
    for color, x, y, radius in [('#0d2540', width+45, 220, 330),
                                 ('#102c49', width+74, 215, 267)]:
        pdf.setFillColor(HexColor(color))
        pdf.circle(x, y, radius, fill=1, stroke=0)
    pdf.setStrokeColor(HexColor('#1a3a59'))
    pdf.setLineWidth(.55)
    for points in [[(298,420),(351,380),(width+8,380)],
                   [(353,452),(403,410),(width+8,410)],
                   [(272,131),(322,102),(width+8,102)],
                   [(397,486),(448,444),(width+8,444)]]:
        line = pdf.beginPath()
        line.moveTo(*points[0])
        for point in points[1:]:
            line.lineTo(*point)
        pdf.drawPath(line, fill=0, stroke=1)
    pdf.setFillColor(HexColor('#4a92cd'))
    for x, y in [(298,420),(353,452),(272,131),(397,486)]:
        pdf.circle(x, y, 1.8, fill=1, stroke=0)

    artwork(logo, 52, height-83, 147)
    pdf.setFillColor(HexColor('#84a6c8'))
    pdf.setFont(regular_font, 8)
    pdf.drawRightString(width-52, height-69, f'PROPOSTA · {issue_year}')
    pdf.setStrokeColor(HexColor('#23425f'))
    pdf.setLineWidth(.6)
    pdf.line(52, height-111, width-52, height-111)
    pdf.setFillColor(HexColor('#80b6eb'))
    pdf.setFont(regular_font, 19)
    pdf.drawString(52, height-187, title_prefix)
    pdf.setFillColor(white)
    pdf.setFont(bold_font, 39)
    for index, line in enumerate(title_lines):
        pdf.drawString(50, height-235-index*46, line)
    lead.drawOn(pdf, 52, height-307-lead_height)
    artwork(symbol, 295, 136, 321)

    pdf.setFillColor(HexColor('#4b9de7'))
    pdf.rect(52, 224, 28, 2.4, fill=1, stroke=0)
    pdf.setFillColor(HexColor('#8caac6'))
    pdf.setFont(regular_font, 9)
    pdf.drawString(52, 201, 'PREPARADA PARA')
    client_par.drawOn(pdf, 52, 190-client_height)
    pdf.setFillColor(HexColor('#9bb5cf'))
    pdf.setFont(regular_font, 9.5)
    pdf.drawString(52, 175-client_height, client_description)
    pdf.setStrokeColor(HexColor('#23425f'))
    pdf.line(52, 82, width-52, 82)
    pdf.setFillColor(HexColor('#9bb5cf'))
    pdf.setFont(regular_font, 8.5)
    pdf.drawString(52, 57, str(issue_date))
    pdf.drawRightString(width-52, 57, 'NIMBOU SOFTWARE')
    pdf.restoreState()
