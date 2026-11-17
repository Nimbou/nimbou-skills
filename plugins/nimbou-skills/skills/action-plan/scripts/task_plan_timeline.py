"""Monthly delivery dates shared by the task-plan PDF and Markdown."""
from calendar import monthrange
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path

from reportlab.graphics import renderSVG
from reportlab.graphics.shapes import Circle, Drawing, Line, Polygon, Rect, String
from reportlab.lib import colors
from reportlab.lib.utils import simpleSplit


MONTHS = ('Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro')
INK = colors.HexColor('#14263C')
MUTED = colors.HexColor('#4D6177')
BLUE = colors.HexColor('#296CB5')
GOLD = colors.HexColor('#A36D16')
PALE = colors.HexColor('#EDF2F9')


def parse_date(value):
    """Accept exact dates only; do not turn forecasts such as 'Até ...' into dates."""
    text = str(value or '')
    try:
        return datetime.strptime(text, '%d/%m/%Y').date()
    except ValueError:
        try:
            return date.fromisoformat(text)
        except ValueError:
            return None


def timeline_charts(plan, width=507):
    if plan.get('linha_do_tempo') is False:
        return []
    months = defaultdict(list)
    final_date = parse_date((plan.get('objetivo') or {}).get('prazo'))
    for index, milestone in enumerate(plan.get('marcos') or [], 1):
        due = parse_date(milestone.get('prazo'))
        tasks = Counter(filter(None, (parse_date(t.get('prazo'))
                                     for t in milestone.get('tarefas') or [])))
        dated = set(tasks)
        if due:
            dated.add(due)
        for key in sorted({(d.year, d.month) for d in dated}):
            months[key].append((f'M{index} · {milestone.get("nome", "Marco")}', due, tasks))
    charts = []
    for (year, month), rows in sorted(months.items()):
        for start in range(0, len(rows), 6):
            name = f'{MONTHS[month - 1]} {year}'
            drawing = month_chart(name, year, month, rows[start:start + 6], final_date, width)
            charts.append((f'{year}-{month:02}-{start // 6 + 1}', name, drawing))
    return charts


def month_chart(name, year, month, rows, final_date, width):
    label_width = width * .32
    days = monthrange(year, month)[1]
    step = (width - label_width - 7) / days
    wrapped = [simpleSplit(label, 'Helvetica-Bold', 7.5, label_width - 12)
               for label, _, _ in rows]
    heights = [max(34, len(lines) * 9 + 16) for lines in wrapped]
    height = 70 + sum(heights)
    drawing = Drawing(width, height)

    def text(x, y, value, size=7, color=MUTED, bold=False, anchor='start'):
        drawing.add(String(x, y, str(value), fontName='Helvetica-Bold' if bold else 'Helvetica',
                           fontSize=size, fillColor=color, textAnchor=anchor))

    def x(day):
        return label_width + (day - .5) * step

    drawing.add(Rect(0, 0, width, height, fillColor=colors.white, strokeColor=None))
    text(8, height - 16, name, 12, INK, True)
    final_in_month = final_date and (final_date.year, final_date.month) == (year, month)
    if final_in_month:
        text(width - 8, height - 16, final_date.strftime('%d/%m/%Y'), 9, GOLD, True, 'end')
    for day in range(1, days + 1):
        if date(year, month, day).weekday() >= 5:
            drawing.add(Rect(x(day) - step / 2, 25, step, height - 51,
                             fillColor=PALE, strokeColor=None))
        drawing.add(Line(x(day), 25, x(day), height - 45,
                         strokeColor=PALE, strokeWidth=.4))
        text(x(day), height - 37, day, 6.5, INK, anchor='middle')
    if final_in_month:
        drawing.add(Line(x(final_date.day), 25, x(final_date.day), height - 45,
                         strokeColor=GOLD, strokeWidth=1, strokeDashArray=[3, 3]))
    y = height - 46
    for (label, due, tasks), lines, row_height in zip(rows, wrapped, heights):
        center = y - row_height / 2
        for offset, line in enumerate(lines):
            text(8, y - 10 - offset * 9, line, 7.5, INK, True)
        drawing.add(Line(label_width, center, width - 7, center,
                         strokeColor=PALE, strokeWidth=.7))
        for day, count in sorted(tasks.items()):
            if (day.year, day.month) != (year, month) or day == due:
                continue
            drawing.add(Circle(x(day.day), center, 2.5, fillColor=BLUE, strokeColor=None))
            text(x(day.day), center - 10, count, 6, anchor='middle')
        if due and (due.year, due.month) == (year, month):
            col = GOLD if due == final_date else BLUE
            cx, radius = x(due.day), 4
            drawing.add(Polygon([cx, center + radius, cx + radius, center,
                                 cx, center - radius, cx - radius, center],
                                fillColor=col, strokeColor=None))
            text(cx, center + 8, due.strftime('%d/%m'), 6.5, col, True, 'middle')
        y -= row_height
    text(8, 11, 'Pontos: tarefas (quantidade no dia). Losangos: marcos. Dourado: prazo final.', 6.8)
    return drawing


def markdown_timeline(plan, pdf_path):
    charts = timeline_charts(plan)
    if not charts:
        return []
    lines = ['## LINHA DO TEMPO', '',
             'Dias de entrega por mês; os marcadores não representam duração das tarefas.', '']
    path = Path(pdf_path)
    for key, name, drawing in charts:
        asset = path.with_name(f'{path.stem}_cronograma_{key}.svg')
        renderSVG.drawToFile(drawing, str(asset))
        lines += [f'### {name}', '', f'![{name}]({asset.name})', '']
    return lines
