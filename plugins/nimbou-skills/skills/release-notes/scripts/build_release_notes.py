# -*- coding: utf-8 -*-
"""
Renderiza um PDF de Notas de Versão FAEPEN a partir de um notes.json.

O notes.json NÃO é o CHANGELOG.md — é uma destilação feita pelo agente
(linguagem de negócio, ruído técnico removido, frentes e fases já decididas).
Ver SKILL.md. Este script é só o layout: recebe o JSON e a saída, e falha alto
se faltar algo obrigatório.

Uso:
    python build_release_notes.py notes.json saida.pdf

Depende de reportlab. Para conferir o resultado, renderize as páginas para PNG
(ex.: com PyMuPDF/fitz) e olhe — layout de PDF quebra fácil.
"""
import json
import os
import sys

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_JUSTIFY
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table, TableStyle,
    Image, KeepTogether, NextPageTemplate, PageBreak, Flowable,
)

# ---- identidade visual FAEPEN ----------------------------------------------
GREEN      = colors.HexColor("#2C5937")
GREEN_DK   = colors.HexColor("#1E3E26")
GOLD       = colors.HexColor("#C4922A")
CREAM      = colors.HexColor("#F8F6F3")
INK        = colors.HexColor("#2A2A28")
MUTED      = colors.HexColor("#6B6B66")
LINE       = colors.HexColor("#E2DED7")
GREEN_SOFT = colors.HexColor("#EAF0EC")
GOLD_SOFT  = colors.HexColor("#F6ECD6")
BODY_TXT   = colors.HexColor("#46443F")

SERIF, SERIF_B = "Times-Roman", "Times-Bold"
SANS, SANS_B, SANS_I = "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"

PAGE_W, PAGE_H = A4
MARGIN = 18 * mm
CONTENT_W = PAGE_W - 2 * MARGIN

BADGE_BG = {"NOVO": GREEN_DK, "ALPHA": colors.HexColor("#B23A2E"), "BETA": GOLD}

ALPHA_NOTE = ("Em fase ALPHA — disponível apenas para testes. O recurso ainda está em validação; "
              "comportamentos e dados podem mudar, e não deve ser usado para operação real.")
BETA_NOTE = ("Em fase BETA — liberado para uso acompanhado. Já é funcional, mas ainda pode receber "
             "ajustes; reporte qualquer comportamento inesperado à equipe.")

# candidatos de logo, na ordem: env, valor no JSON (tratado no main), caminhos conhecidos
LOGO_FALLBACKS = [
    r"C:\www\projetos.faepen.org.br\apps\web\public\branding\logo.png",
    "/var/www/projetos.faepen.org.br/apps/web/public/branding/logo.png",
    "/www/projetos.faepen.org.br/apps/web/public/branding/logo.png",
]


def _styles():
    S = {}
    S['cover_title'] = ParagraphStyle('ct', fontName=SERIF_B, fontSize=30, leading=34, textColor=GREEN_DK)
    S['cover_sub']   = ParagraphStyle('cs', fontName=SANS, fontSize=11.5, leading=17, textColor=MUTED)
    S['cover_kick']  = ParagraphStyle('ck', fontName=SANS_B, fontSize=10, leading=12, textColor=GOLD, spaceAfter=6)
    S['intro']       = ParagraphStyle('in', fontName=SANS, fontSize=10.5, leading=16, textColor=INK, alignment=TA_JUSTIFY)
    S['item_title']  = ParagraphStyle('it', fontName=SANS_B, fontSize=10, leading=13.5, textColor=INK)
    S['item_body']   = ParagraphStyle('ib', fontName=SANS, fontSize=9.3, leading=13.5, textColor=BODY_TXT)
    S['note']        = ParagraphStyle('nt', fontName=SANS, fontSize=8.8, leading=12.5, textColor=GREEN_DK)
    S['toc']         = ParagraphStyle('tc', fontName=SANS, fontSize=10, leading=20, textColor=INK)
    S['stat_num']    = ParagraphStyle('sn', fontName=SERIF_B, fontSize=22, leading=24, textColor=GREEN, alignment=1)
    S['stat_lbl']    = ParagraphStyle('sl', fontName=SANS, fontSize=8, leading=11, textColor=MUTED, alignment=1)
    return S


class HBar(Flowable):
    """Faixa de cabeçalho de seção: quadro numerado + título serifado + badge."""
    def __init__(self, num, title, tag, width, badge=None):
        super().__init__()
        self.num, self.title, self.tag, self.width, self.badge = num, title, tag, width, badge
        self.height = 16 * mm

    def wrap(self, aw, ah):
        return self.width, self.height

    def draw(self):
        from reportlab.pdfbase.pdfmetrics import stringWidth
        c = self.canv; h = self.height
        c.setFillColor(GREEN); c.roundRect(0, 0, self.width, h, 3 * mm, stroke=0, fill=1)
        c.setFillColor(GOLD);  c.roundRect(0, 0, 16 * mm, h, 3 * mm, stroke=0, fill=1)
        c.setFillColor(GREEN); c.rect(13 * mm, 0, 3 * mm, h, stroke=0, fill=1)
        c.setFillColor(colors.white); c.setFont(SERIF_B, 19)
        c.drawCentredString(8 * mm, h / 2 - 6.2, self.num)
        right_limit = self.width - 5 * mm
        if self.badge:
            bfs, pad = 8.5, 3.2 * mm
            bw = stringWidth(self.badge, SANS_B, bfs) + 2 * pad
            bh = 6.2 * mm
            bx = self.width - 5 * mm - bw
            by = h / 2 - bh / 2
            c.setFillColor(BADGE_BG[self.badge])
            if self.badge == "NOVO":
                c.setStrokeColor(colors.HexColor("#CFE0D4")); c.setLineWidth(0.8)
                c.roundRect(bx, by, bw, bh, 1.6 * mm, stroke=1, fill=1)
            else:
                c.roundRect(bx, by, bw, bh, 1.6 * mm, stroke=0, fill=1)
            c.setFillColor(colors.white); c.setFont(SANS_B, bfs)
            c.drawCentredString(bx + bw / 2, by + bh / 2 - bfs * 0.34, self.badge)
            right_limit = bx - 4 * mm
        fs = 14.5
        avail = right_limit - 20 * mm
        while stringWidth(self.title, SERIF_B, fs) > avail and fs > 8.5:
            fs -= 0.5
        c.setFillColor(colors.white); c.setFont(SERIF_B, fs)
        c.drawString(20 * mm, h / 2 + 0.6, self.title)
        c.setFillColor(colors.HexColor("#CFE0D4")); c.setFont(SANS_I, 8.6)
        c.drawString(20 * mm, h / 2 - 9.5, self.tag)


def note_box(text, width, S, badge=None):
    if badge == "ALPHA":
        bg, bar, label, lblcol = colors.HexColor("#F7E7E4"), colors.HexColor("#B23A2E"), "ALPHA", "#8E2A20"
    elif badge == "NOVO":
        bg, bar, label, lblcol = GREEN_SOFT, GREEN, "Novo", "#1E3E26"
    elif badge == "BETA":
        bg, bar, label, lblcol = GOLD_SOFT, GOLD, "BETA", "#8A641A"
    else:
        bg, bar, label, lblcol = GREEN_SOFT, GREEN, "Nota", "#1E3E26"
    prefix = '<b><font color="%s">%s&nbsp;&nbsp;</font></b>' % (lblcol, label)
    t = Table([[Paragraph(prefix + text, S['note'])]], colWidths=[width])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), bg),
        ('TOPPADDING', (0, 0), (-1, -1), 7), ('BOTTOMPADDING', (0, 0), (-1, -1), 7),
        ('LEFTPADDING', (0, 0), (-1, -1), 10), ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('LINEBEFORE', (0, 0), (0, -1), 3, bar),
    ]))
    return t


def item_table(items, width, S):
    rows = []
    for it in items:
        t, d = it["title"], it["desc"]
        rows.append([Paragraph('<font color="#C4922A">◆</font>', S['item_title']),
                     [Paragraph(t, S['item_title']), Paragraph(d, S['item_body'])]])
    tbl = Table(rows, colWidths=[7 * mm, width - 7 * mm])
    tbl.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 5), ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (0, -1), 0), ('LEFTPADDING', (1, 0), (1, -1), 2),
        ('LINEBELOW', (1, 0), (1, -2), 0.5, LINE),
    ]))
    return tbl


def _painters(version, since):
    def on_cover(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(CREAM); canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        canvas.setFillColor(GREEN); canvas.rect(0, PAGE_H - 8 * mm, PAGE_W, 8 * mm, stroke=0, fill=1)
        canvas.setFillColor(GOLD);  canvas.rect(0, PAGE_H - 9.4 * mm, PAGE_W, 1.4 * mm, stroke=0, fill=1)
        canvas.setFillColor(GREEN); canvas.rect(0, 0, PAGE_W, 6 * mm, stroke=0, fill=1)
        canvas.setFillColor(colors.white); canvas.setFont(SANS, 7.5)
        canvas.drawCentredString(PAGE_W / 2, 2.1 * mm, "Fundação FAEPEN  ·  Sistema de Gestão de Projetos")
        canvas.restoreState()

    def on_content(canvas, doc):
        canvas.saveState()
        canvas.setFillColor(colors.white); canvas.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)
        canvas.setFillColor(GREEN); canvas.rect(0, PAGE_H - 4 * mm, PAGE_W, 4 * mm, stroke=0, fill=1)
        canvas.setFillColor(GOLD);  canvas.rect(0, PAGE_H - 5 * mm, PAGE_W, 1 * mm, stroke=0, fill=1)
        canvas.setFillColor(MUTED); canvas.setFont(SANS, 7.5)
        since_txt = ("  (desde a v%s)" % since) if since else ""
        canvas.drawString(MARGIN, PAGE_H - 9 * mm, "NOTAS DE VERSÃO  ·  v%s%s" % (version, since_txt))
        canvas.drawRightString(PAGE_W - MARGIN, PAGE_H - 9 * mm, "Fundação FAEPEN")
        canvas.setStrokeColor(LINE); canvas.setLineWidth(0.5)
        canvas.line(MARGIN, 12 * mm, PAGE_W - MARGIN, 12 * mm)
        canvas.setFillColor(MUTED); canvas.setFont(SANS, 7.5)
        canvas.drawString(MARGIN, 8 * mm, "Sistema de Gestão de Projetos — Fundação FAEPEN")
        canvas.drawRightString(PAGE_W - MARGIN, 8 * mm, "Página %d" % doc.page)
        canvas.restoreState()

    return on_cover, on_content


def _resolve_logo(data):
    for cand in [os.environ.get("FAEPEN_LOGO"), data.get("logo")] + LOGO_FALLBACKS:
        if cand and os.path.isfile(cand):
            return cand
    return None


def _badge_tag(b):
    if not b:
        return ""
    col = {"NOVO": "#1E3E26", "ALPHA": "#B23A2E", "BETA": "#8A641A"}[b]
    return '&nbsp;&nbsp;<font name="Helvetica-Bold" size="7" color="%s">[%s]</font>' % (col, b)


def _section_note(sec):
    """Nota da seção: a lead do agente + o disclaimer padrão da fase ALPHA/BETA."""
    badge = sec.get("badge")
    lead = (sec.get("note") or "").strip()
    if badge == "ALPHA":
        return (lead + " " + ALPHA_NOTE).strip() if lead else ALPHA_NOTE
    if badge == "BETA":
        return (lead + " " + BETA_NOTE).strip() if lead else BETA_NOTE
    # NOVO ou sem badge: só mostra caixa se o agente escreveu uma lead
    return lead or None


def build(data, out_path):
    for key in ("version", "sections"):
        if not data.get(key):
            raise SystemExit("notes.json inválido: falta '%s'." % key)

    version = str(data["version"])
    since = str(data.get("since") or "")
    date = data.get("date") or ""
    intro = data.get("intro") or ""
    stats = data.get("stats") or {}
    sections = data["sections"]
    for i, sec in enumerate(sections):
        for k in ("title", "tagline", "items"):
            if not sec.get(k):
                raise SystemExit("seção %d inválida: falta '%s'." % (i + 1, k))
        b = sec.get("badge")
        if b and b not in BADGE_BG:
            raise SystemExit("seção %d: badge '%s' desconhecido (use NOVO/ALPHA/BETA/omita)." % (i + 1, b))

    S = _styles()
    logo = _resolve_logo(data)
    on_cover, on_content = _painters(version, since)

    doc = BaseDocTemplate(
        out_path, pagesize=A4, leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=16 * mm, bottomMargin=16 * mm,
        title="Notas de Versão %s — Sistema de Gestão de Projetos FAEPEN" % version,
        author="Fundação FAEPEN",
        subject="Notas de Versão" + ((" — alterações desde a %s" % since) if since else ""))
    doc.addPageTemplates([
        PageTemplate(id='cover', frames=[Frame(MARGIN, 14 * mm, CONTENT_W, PAGE_H - 28 * mm, id='c')], onPage=on_cover),
        PageTemplate(id='content', frames=[Frame(MARGIN, 14 * mm, CONTENT_W, PAGE_H - 30 * mm, id='m')], onPage=on_content),
    ])

    story = []
    # -------- capa --------
    story.append(Spacer(1, 8 * mm))
    if logo:
        ratio = 1455 / 4132
        story.append(Image(logo, width=86 * mm, height=86 * mm * ratio))
        story.append(Spacer(1, 14 * mm))
    else:
        story.append(Paragraph("Fundação FAEPEN", ParagraphStyle('lf', fontName=SERIF_B, fontSize=24, textColor=GREEN_DK)))
        story.append(Spacer(1, 10 * mm))
    kick = ("NOVIDADES DESDE A %s" % since) if since else "NOVIDADES DESTA VERSÃO"
    story.append(Paragraph(kick, S['cover_kick']))
    story.append(Paragraph("Notas de Versão", S['cover_title']))
    story.append(Paragraph(version, ParagraphStyle('v', fontName=SERIF_B, fontSize=30, leading=34, textColor=GOLD)))
    story.append(Spacer(1, 7 * mm))
    if date:
        story.append(Paragraph("Publicado em %s" % date, S['cover_sub']))
        story.append(Spacer(1, 8 * mm))
    ld = Table([[""]], colWidths=[40 * mm], rowHeights=[1.4 * mm])
    ld.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), GOLD)])); story.append(ld)
    story.append(Spacer(1, 8 * mm))
    if intro:
        story.append(Paragraph(intro, S['intro']))
        story.append(Spacer(1, 6 * mm))

    # legenda de fases
    _leg = ParagraphStyle('leg', fontName=SANS, fontSize=9.5, leading=12, textColor=MUTED)

    def _chip(txt, hexbg):
        return Table([[Paragraph('<font name="Helvetica-Bold" size="7.5" color="white">%s</font>' % txt,
                                 ParagraphStyle('c', alignment=1))]], colWidths=[16 * mm], rowHeights=[5.4 * mm],
                     style=TableStyle([('BACKGROUND', (0, 0), (-1, -1), colors.HexColor(hexbg)),
                                       ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('ROUNDEDCORNERS', [3, 3, 3, 3])]))
    legend = Table([[
        _chip("NOVO", "#1E3E26"), Paragraph("Liberado.", _leg),
        _chip("BETA", "#C4922A"), Paragraph("Uso assistido.", _leg),
        _chip("ALPHA", "#B23A2E"), Paragraph("Só testes.", _leg),
    ]], colWidths=[16 * mm, 24 * mm, 16 * mm, 30 * mm, 17 * mm, CONTENT_W - 103 * mm])
    legend.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                                ('LEFTPADDING', (0, 0), (-1, -1), 0), ('RIGHTPADDING', (1, 0), (-1, -1), 4)]))
    story.append(legend)
    story.append(Spacer(1, 7 * mm))

    # tiles de estatística (opcional)
    tiles = stats.get("tiles") if isinstance(stats, dict) else None
    if tiles:
        stat = lambda n, l: [Paragraph(n, S['stat_num']), Spacer(1, 1), Paragraph(l, S['stat_lbl'])]
        row = [stat(t["num"], t["label"].replace("\n", "<br/>")) for t in tiles[:4]]
        st = Table([row], colWidths=[CONTENT_W / len(row)] * len(row))
        st.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), GREEN_SOFT), ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 9), ('BOTTOMPADDING', (0, 0), (-1, -1), 9),
            ('LINEAFTER', (0, 0), (-2, -1), 0.6, colors.white), ('ROUNDEDCORNERS', [4, 4, 4, 4]),
        ]))
        story.append(st)
    story.append(NextPageTemplate('content')); story.append(PageBreak())

    # -------- sumário --------
    story.append(Paragraph("Nesta atualização", ParagraphStyle(
        'th', fontName=SERIF_B, fontSize=18, leading=22, textColor=GREEN_DK, spaceAfter=6)))
    gr = Table([[""]], colWidths=[28 * mm], rowHeights=[1.2 * mm])
    gr.setStyle(TableStyle([('BACKGROUND', (0, 0), (-1, -1), GOLD)])); story.append(gr)
    story.append(Spacer(1, 6 * mm))

    toc_rows = []
    for i, sec in enumerate(sections):
        num = "%02d" % (i + 1)
        toc_rows.append([Paragraph('<font name="Times-Bold" color="#C4922A" size="12">%s</font>' % num, S['toc']),
                         Paragraph('<b>%s</b>%s' % (sec["title"], _badge_tag(sec.get("badge"))), S['toc'])])
        toc_rows.append(["", Paragraph('<font color="#6B6B66" size="8.5">%s</font>' % sec["tagline"], S['toc'])])
    toc = Table(toc_rows, colWidths=[14 * mm, CONTENT_W - 14 * mm])
    toc.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TOPPADDING', (0, 0), (-1, -1), 1), ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('LEFTPADDING', (0, 0), (0, -1), 0)]))
    story.append(toc)
    story.append(PageBreak())

    # -------- seções --------
    for i, sec in enumerate(sections):
        num = "%02d" % (i + 1)
        badge = sec.get("badge")
        items = sec["items"]
        note = _section_note(sec)
        head_parts = [HBar(num, sec["title"], sec["tagline"], CONTENT_W, badge), Spacer(1, 3 * mm)]
        if note:
            head_parts += [note_box(note, CONTENT_W, S, badge), Spacer(1, 3 * mm)]
        head_parts += [item_table(items[:1], CONTENT_W, S)]
        story.append(KeepTogether(head_parts))
        if len(items) > 1:
            story.append(item_table(items[1:], CONTENT_W, S))
        story.append(Spacer(1, 7 * mm))

    # -------- fechamento --------
    story.append(Spacer(1, 2 * mm))
    closing = data.get("closing") or (
        "Dúvidas sobre as novidades ou sugestões de melhoria? Fale com a equipe do Sistema de "
        "Gestão de Projetos da Fundação FAEPEN pelos canais habituais de atendimento.")
    close = Table([[Paragraph(closing, ParagraphStyle(
        'cl', fontName=SANS, fontSize=9.5, leading=14, textColor=GREEN_DK))]], colWidths=[CONTENT_W])
    close.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), GOLD_SOFT),
        ('TOPPADDING', (0, 0), (-1, -1), 10), ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('LEFTPADDING', (0, 0), (-1, -1), 12), ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('LINEBEFORE', (0, 0), (0, -1), 3, GOLD)]))
    story.append(close)

    doc.build(story)


def main(argv):
    if len(argv) != 3:
        raise SystemExit("Uso: python build_release_notes.py notes.json saida.pdf")
    in_path, out_path = argv[1], argv[2]
    with open(in_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    build(data, out_path)
    print("OK ->", out_path)


if __name__ == "__main__":
    main(sys.argv)
