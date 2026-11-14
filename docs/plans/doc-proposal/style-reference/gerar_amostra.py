#!/usr/bin/env python3
"""Amostra sintética do perfil atual: capa tecnológica e duas páginas comerciais."""
import importlib.util
import json
from io import BytesIO
from pathlib import Path

from reportlab.graphics import renderPDF
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, PageTemplate, Paragraph,
                               Table, TableStyle, Spacer, PageBreak, HRFlowable)
from svglib.svglib import svg2rlg

HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[4]
SKILL = ROOT/'plugins/nimbou-skills/skills/doc-proposal'
spec = importlib.util.spec_from_file_location('proposal_cover', SKILL/'scripts/draw_cover.py')
cover = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cover)


def build():
    data = json.loads((HERE/'conteudo.json').read_text(encoding='utf-8'))
    font_dir = Path('/usr/share/fonts/truetype/lato')
    for name, filename in [('Lato','Lato-Regular.ttf'), ('Lato-Bold','Lato-Bold.ttf')]:
        pdfmetrics.registerFont(TTFont(name, str(font_dir/filename)))
    pdfmetrics.registerFontFamily('Lato', normal='Lato', bold='Lato-Bold')
    width, height = A4
    column = width-120
    styles = {
        'p': ParagraphStyle('Body', fontName='Lato', fontSize=9.8, leading=13.4,
                            textColor=HexColor('#414141'), spaceAfter=7),
        'h': ParagraphStyle('Heading', fontName='Lato-Bold', fontSize=13.3, leading=16.5,
                            textColor=HexColor('#10314e'), spaceBefore=9, spaceAfter=4,
                            keepWithNext=True),
        'small': ParagraphStyle('Note', fontName='Lato', fontSize=8, leading=10.7,
                               textColor=HexColor('#63798c'), spaceAfter=8),
        'cell': ParagraphStyle('Cell', fontName='Lato', fontSize=9, leading=12,
                              textColor=HexColor('#414141')),
        'head': ParagraphStyle('Head', fontName='Lato-Bold', fontSize=9, leading=12,
                              textColor=white),
        'bullet': ParagraphStyle('Bullet', fontName='Lato', fontSize=9.8, leading=13.4,
                                textColor=HexColor('#414141'), leftIndent=20,
                                bulletIndent=7, bulletColor=HexColor('#216db2'), spaceAfter=7),
    }
    svg=(SKILL/'assets/nimbou-logo.svg').read_text()
    logo=svg2rlg(BytesIO(svg.replace('#ffffff','#1d1d1d').encode()))
    total=len(data['paginas'])+1

    def first(pdf, doc):
        cover.draw_cover(pdf, client=data['cliente'], subtitle=data['subtitulo'],
                         issue_date=data['data'], issue_year=data['ano'],
                         client_description=data['descricao_cliente'])

    def later(pdf, doc):
        pdf.saveState()
        pdf.translate(width-60-128, height-61)
        pdf.scale(128/logo.width,128/logo.width)
        renderPDF.draw(logo,pdf,0,0)
        pdf.restoreState()
        pdf.setStrokeColor(HexColor('#bfd0df'))
        pdf.setLineWidth(.5)
        pdf.line(60,height-71,width-60,height-71)
        pdf.line(60,43,width-60,43)
        pdf.setFont('Lato',7.3)
        pdf.setFillColor(HexColor('#839bb0'))
        pdf.drawCentredString(width/2,29,
            f'Nimbou Software · {data["cliente"]} · Página {doc.page} de {total}')

    story=[Spacer(1,1),PageBreak()]
    for index, blocks in enumerate(data['paginas']):
        if index:
            story.append(PageBreak())
        for kind, value in blocks:
            if kind in ('p','small','h'):
                story.append(Paragraph(value,styles[kind]))
                if kind=='h':
                    story += [HRFlowable(width='100%',thickness=.8,color=HexColor('#216db2')),Spacer(1,6)]
            elif kind=='list':
                story += [Paragraph(item,styles['bullet'],bulletText='•') for item in value]
            elif kind=='table':
                cells=[[Paragraph(v,styles['head']) for v in value['cabecalho']]]
                cells += [[Paragraph(v,styles['cell']) for v in row] for row in value['linhas']]
                table=Table(cells,colWidths=[column*.32,column*.68],repeatRows=1)
                table.setStyle(TableStyle([
                    ('BACKGROUND',(0,0),(-1,0),HexColor('#10314e')),
                    ('ROWBACKGROUNDS',(0,1),(-1,-1),[white,HexColor('#eaf1f6')]),
                    ('GRID',(0,0),(-1,-1),.4,HexColor('#bfd0df')),
                    ('VALIGN',(0,0),(-1,-1),'TOP'),
                    ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
                    ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
                ]))
                story += [table,Spacer(1,9)]
            else:
                raise ValueError(kind)
    out=HERE/'amostra-estilo.pdf'
    doc=BaseDocTemplate(str(out),pagesize=A4,leftMargin=60,rightMargin=60,
                        topMargin=78,bottomMargin=57,
                        title='Amostra sintética de proposta de assessoria',author='Nimbou Software')
    frame=Frame(60,57,column,height-78-57,leftPadding=0,rightPadding=0,
                topPadding=0,bottomPadding=0)
    doc.addPageTemplates([
        PageTemplate(id='cover',frames=[frame],onPage=first,autoNextPageTemplate='body'),
        PageTemplate(id='body',frames=[frame],onPage=later),
    ])
    doc.build(story)
    assert doc.page==total, f'A amostra transbordou: {doc.page} páginas; esperado {total}'
    print(f'{out} ({doc.page} páginas)')


if __name__=='__main__':
    build()
