"""Nimbou presentation for task plans; runtime dependency: ReportLab only."""
from datetime import date
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, CondPageBreak, Flowable, Frame, KeepTogether, PageTemplate,
    Paragraph, Spacer, Table, TableStyle,
)


ASSETS = Path(__file__).resolve().parent.parent / "assets"
INK = colors.HexColor("#14263C")
BLUE = colors.HexColor("#296CB5")
ACTION = colors.HexColor("#225C9A")
MUTED = colors.HexColor("#4D6177")
PAPER = colors.HexColor("#F7F9FD")
SURFACE = colors.HexColor("#EDF2F9")
PALE = colors.HexColor("#D8E8FC")
LINE = colors.HexColor("#CCD7E4")
WHITE = colors.white
MARGIN = 44
WIDTH, HEIGHT = A4
CONTENT = WIDTH - MARGIN * 2


def styles():
    for name, filename in (("Archivo", "archivo-600.ttf"),
                           ("Source", "source-sans-3-400.ttf"),
                           ("SourceBold", "source-sans-3-600.ttf")):
        if name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(name, str(ASSETS / filename)))
    pdfmetrics.registerFontFamily("Source", normal="Source", bold="SourceBold")
    body = ParagraphStyle("body", fontName="Source", fontSize=9, leading=11.5,
                          textColor=INK)
    return {
        "body": body,
        "objective": ParagraphStyle("objective", parent=body, fontSize=10.5, leading=14.1),
        "label": ParagraphStyle("label", parent=body, fontName="SourceBold", fontSize=7.6,
                                leading=10, textColor=ACTION, spaceBefore=12,
                                spaceAfter=8, keepWithNext=True),
        "milestone": ParagraphStyle("milestone", parent=body, fontName="Archivo",
                                    fontSize=13, leading=16, spaceAfter=5),
        "result": ParagraphStyle("result", parent=body, textColor=MUTED, leading=11.8,
                                 spaceAfter=8),
        "title": ParagraphStyle("task-title", parent=body, fontName="SourceBold",
                                fontSize=10.5, leading=13),
        "detail": ParagraphStyle("task-detail", parent=body, spaceAfter=3),
        "bullet": ParagraphStyle("task-bullet", parent=body, fontSize=8.9,
                                 leading=11.2, textColor=MUTED),
        "small": ParagraphStyle("small", parent=body, fontSize=8.2, leading=10.5,
                                textColor=MUTED),
        "right": ParagraphStyle("right", parent=body, fontSize=8, leading=10,
                                textColor=MUTED, alignment=TA_RIGHT),
    }


def p(value, style):
    return Paragraph(escape(str(value or "")), style)


class Chip(Flowable):
    """A right-aligned pill that can wrap a long responsible person's name."""
    def __init__(self, value, primary=False, align="RIGHT"):
        super().__init__()
        self.value = str(value)
        self.primary = primary
        self.hAlign = align

    def wrap(self, avail_width, avail_height):
        # Leave a small rounding allowance so a short name never breaks its last letter.
        natural = pdfmetrics.stringWidth(self.value, "Source", 8.2) + 20
        self.width = min(natural, avail_width)
        self.paragraph = Paragraph(escape(self.value), ParagraphStyle(
            "chip", fontName="Source", fontSize=8.2, leading=10.5,
            textColor=ACTION if self.primary else MUTED, alignment=1))
        _, self.text_height = self.paragraph.wrap(max(1, self.width - 18), avail_height)
        self.height = max(18, self.text_height + 8)
        return self.width, self.height

    def draw(self):
        c = self.canv
        c.saveState()
        c.setFillColor(PALE if self.primary else SURFACE)
        c.roundRect(0, 0, self.width, self.height, 9, fill=1, stroke=0)
        self.paragraph.drawOn(c, 9, (self.height - self.text_height) / 2)
        c.restoreState()


class Arrow(Flowable):
    def __init__(self):
        super().__init__()
        self.width = self.height = 12

    def draw(self):
        c = self.canv
        c.saveState()
        c.setStrokeColor(BLUE)
        c.setLineWidth(.9)
        c.line(1, 6, 10, 6)
        c.line(7, 9, 10, 6)
        c.line(7, 3, 10, 6)
        c.restoreState()


def table_style(background=WHITE, padding=8, border=True):
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (-1, -1), background),
        ("LEFTPADDING", (0, 0), (-1, -1), padding),
        ("RIGHTPADDING", (0, 0), (-1, -1), padding),
        ("TOPPADDING", (0, 0), (-1, -1), padding),
        ("BOTTOMPADDING", (0, 0), (-1, -1), padding),
    ]
    if border:
        commands.append(("BOX", (0, 0), (-1, -1), 0.6, LINE))
    return TableStyle(commands)


def task_card(task, number, numbers, s):
    # All task prose stays in the left cell. Metadata never pushes it below the chips.
    left_width = CONTENT - 112 - 16 - 16
    heading = Table([[Chip(number, align="LEFT"), p(task.get("titulo"), s["title"])]],
                    colWidths=[34, left_width - 34], hAlign="LEFT")
    heading.setStyle(table_style(padding=0, border=False))
    left = [heading, Spacer(1, 6)]
    if task.get("concluida_quando"):
        left.append(Paragraph("<b>Pronto quando:</b> " + escape(task["concluida_quando"]),
                              s["detail"]))
    left.extend(p("• " + sub, s["bullet"]) for sub in task.get("subtarefas") or [])
    values = []
    if task.get("responsavel"):
        values.append((task["responsavel"], True))
    if task.get("prazo"):
        values.append(("Previsão: " + task["prazo"], False))
    deps = ", ".join(numbers[d] for d in task.get("depende_de") or [])
    if deps:
        values.append(("Após " + deps, False))
    right = []
    for value, primary in values:
        if right:
            right.append(Spacer(1, 5))
        right.append(Chip(value, primary))
    card = Table([[left, "", right]], colWidths=[left_width + 8, 16, 120],
                 hAlign="LEFT", cornerRadii=[10] * 4, splitInRow=1)
    style = table_style()
    style.add("RIGHTPADDING", (0, 0), (0, -1), 0)
    style.add("LEFTPADDING", (2, 0), (2, -1), 0)
    style.add("ALIGN", (2, 0), (2, -1), "RIGHT")
    card.setStyle(style)
    return card


def phase_sequence(plan, s):
    phases = [(plan.get("fase_atual_nome", "Fase atual"), "Agora")]
    future = plan.get("fases_futuras") or []
    phases += [(f.get("nome", "Próxima etapa"), "Próxima etapa") for f in future]
    deadline = (plan.get("objetivo") or {}).get("prazo")
    if deadline and future:
        phases[-1] = (phases[-1][0], "Até " + deadline)
    result = []
    for start in range(0, len(phases), 3):
        group = phases[start:start + 3]
        card_width = (CONTENT - (len(group) - 1) * 12) / len(group)
        card_height = max(62, max(p(name, s["title"]).wrap(card_width - 22, HEIGHT)[1]
                                  for name, _ in group) + 41.5)
        cells, widths = [], []
        for i, (name, period) in enumerate(group, start + 1):
            texts = [p(f"{i:02}  /  {period.upper()}", s["small"]), Spacer(1, 9),
                     p(name, s["title"])]
            card = Table([[texts]], colWidths=[card_width], rowHeights=[card_height],
                         cornerRadii=[10] * 4)
            card.setStyle(table_style(PALE if i == 1 else WHITE, padding=11))
            if cells:
                cells.append(Arrow())
                widths.append(12)
            cells.append(card)
            widths.append(card_width)
        row = Table([cells], colWidths=widths, hAlign="LEFT")
        row.setStyle(table_style(padding=0, border=False, background=PAPER))
        row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE")]))
        result.extend([row, Spacer(1, 6)])
    return result


def build_task_plan(plan, out_path, numbers):
    s = styles()
    title = p(plan.get("titulo", "Plano de ação"), ParagraphStyle(
        "cover-title", fontName="Archivo", fontSize=23.5, leading=28, textColor=WHITE))
    _, title_height = title.wrap(CONTENT, HEIGHT)
    cover_height = max(110, title_height + 76)
    emitted = plan.get("data") or date.today().strftime("%d/%m/%Y")

    def decoration(c, doc, first=False):
        c.saveState()
        c.setFillColor(PAPER)
        c.rect(0, 0, WIDTH, HEIGHT, fill=1, stroke=0)
        band = cover_height if first else 67
        c.setFillColor(INK)
        c.rect(0, HEIGHT - band, WIDTH, band, fill=1, stroke=0)
        logo_width = 104 if first else 92
        c.drawImage(str(ASSETS / "nimbou-logo.png"), MARGIN, HEIGHT - 42,
                    width=logo_width, height=logo_width * 113.2046 / 482.1079, mask="auto")
        c.setFont("Source", 8.1)
        c.setFillColor(colors.HexColor("#A9BED5"))
        c.drawRightString(WIDTH - MARGIN, HEIGHT - 28,
                          f"PLANO DE AÇÃO  /  V{plan.get('versao', 1)}")
        c.drawRightString(WIDTH - MARGIN, HEIGHT - 41, emitted)
        if first:
            title.drawOn(c, MARGIN, HEIGHT - 60 - title_height)
        else:
            c.setFillColor(WHITE)
            c.setFont("Source", 9)
            summary = p(plan.get("titulo", "Plano de ação"), ParagraphStyle(
                "running-title", parent=s["small"], textColor=WHITE,
                fontSize=8.5, leading=10))
            summary.wrap(CONTENT, 20)
            summary.drawOn(c, MARGIN, HEIGHT - 59)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.line(MARGIN, 34, WIDTH - MARGIN, 34)
        c.setFont("Source", 7.8)
        c.setFillColor(MUTED)
        c.drawString(MARGIN, 21, "Nimbou  /  Plano de ação")
        c.drawRightString(WIDTH - MARGIN, 21, f"{doc.page:02}")
        c.restoreState()

    doc = BaseDocTemplate(str(out_path), pagesize=A4, leftMargin=MARGIN,
                          rightMargin=MARGIN, topMargin=cover_height + 18, bottomMargin=46,
                          title=plan.get("titulo", "Plano de ação"), author="Nimbou")

    def frame(top, name):
        return Frame(MARGIN, 46, CONTENT, HEIGHT - top - 46, id=name,
                     leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)

    doc.addPageTemplates([
        PageTemplate(id="first", frames=[frame(cover_height + 18, "cover")],
                     onPage=lambda c, d: decoration(c, d, True), autoNextPageTemplate="later"),
        PageTemplate(id="later", frames=[frame(85, "content")], onPage=decoration),
    ])
    story = [p("OBJETIVO", s["label"]),
             p((plan.get("objetivo") or {}).get("frase"), s["objective"])]
    phases = plan.get("fases_futuras") or []
    if phases:
        story += [p("ETAPAS DO PLANO", s["label"]), *phase_sequence(plan, s)]
    for i, milestone in enumerate(plan.get("marcos") or [], 1):
        top = Table([[p(f"MARCO {i:02}", s["label"]),
                      p("Previsão: " + milestone["prazo"] if milestone.get("prazo") else "",
                        s["right"])]], colWidths=[CONTENT * .6, CONTENT * .4])
        top.setStyle(table_style(padding=0, background=PAPER, border=False))
        heading = [top, Spacer(1, 5), p(milestone.get("nome"), s["milestone"])]
        if milestone.get("resultado_verificavel"):
            heading.append(p(milestone["resultado_verificavel"], s["result"]))
        cards = [task_card(task, numbers[task["id"]], numbers, s)
                 for task in milestone.get("tarefas") or []]
        # Keep the heading with the start of a task, not with its entire potentially
        # multi-page body. Whole-card keepWithNext chains otherwise waste a page.
        heading_height = sum(item.wrap(CONTENT, HEIGHT)[1]
                             + item.getSpaceBefore() + item.getSpaceAfter()
                             for item in heading)
        first_height = min(cards[0].wrap(CONTENT, HEIGHT)[1], 100) if cards else 0
        story += [Spacer(1, 10), CondPageBreak(heading_height + first_height),
                  KeepTogether(heading)]
        for card in cards:
            story += [card, Spacer(1, 6)]
    if phases:
        story.append(p("PRÓXIMAS FASES", s["label"]))
        for i, phase in enumerate(phases, 2):
            story += [p(f"{i:02}  /  {phase.get('nome', '')}", s["title"]), Spacer(1, 3)]
            if phase.get("periodo"):
                story += [p(phase["periodo"], s["small"]), Spacer(1, 4)]
            for milestone in phase.get("marcos_previstos") or []:
                if isinstance(milestone, str):
                    text = milestone
                else:
                    text = milestone.get("nome", "")
                    deps = ", ".join(numbers[d] for d in milestone.get("depende_de") or [])
                    if deps:
                        text += f" (após {deps})"
                    if milestone.get("prazo"):
                        text += " - até " + milestone["prazo"]
                story += [p("• " + text, s["body"]), Spacer(1, 3)]
            story.append(Spacer(1, 6))
    if plan.get("limites"):
        story.append(p("LIMITES DO PLANO", s["label"]))
        for start in range(0, len(plan["limites"]), 3):
            group = plan["limites"][start:start + 3]
            cells, widths = [], []
            width = (CONTENT - (len(group) - 1) * 8) / len(group)
            card_height = max(p(text, s["body"]).wrap(width - 22, HEIGHT)[1]
                              for text in group) + 22
            for text in group:
                if cells:
                    cells.append("")
                    widths.append(8)
                card = Table([[p(text, s["body"])]], colWidths=[width], rowHeights=[card_height],
                             cornerRadii=[10] * 4,
                             splitInRow=1)
                card.setStyle(table_style(SURFACE, padding=11, border=False))
                cells.append(card)
                widths.append(width)
            row = Table([cells], colWidths=widths, hAlign="LEFT", splitInRow=1)
            row.setStyle(table_style(PAPER, padding=0, border=False))
            story += [row, Spacer(1, 6)]
    if plan.get("gatilhos_ajuste"):
        story.append(p("QUANDO AJUSTAR O PLANO", s["label"]))
        for text in plan["gatilhos_ajuste"]:
            story += [p("• " + text, s["bullet"]), Spacer(1, 5)]
    review = (plan.get("ciclo") or {}).get("proxima_revisao")
    if review:
        story += [Spacer(1, 6), p("Próxima revisão: " + review, s["small"])]
    doc.build(story)
    return out_path
