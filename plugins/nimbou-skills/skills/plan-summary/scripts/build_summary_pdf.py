# -*- coding: utf-8 -*-
"""
Gera a folha executiva de UMA página (altura dinâmica) a partir de um resumo.json.

A página tem largura fixa (confortável para ler/imprimir) e ALTURA que cresce
para caber o conteúdo — um único PDF de uma página, de qualquer tamanho. Assim
a folha nunca transborda nem sobra branco: ela tem exatamente o tamanho do que
precisa dizer.

O resumo.json NÃO é o plano.json do action-plan — é uma destilação feita pelo
agente (linguagem de negócio, nós já escolhidos). Ver SKILL.md.

Uso:
    python build_summary_pdf.py resumo.json saida.pdf

Depende de reportlab.
"""
import json
import sys

from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.lib.utils import simpleSplit

WIDTH = 595.27          # largura A4; a ALTURA é calculada
M = 46                  # margem lateral
TOP = 42                # margem superior
BOT = 40                # margem inferior

BG    = HexColor('#F8F6F3')
GREEN = HexColor('#2C5937')
GOLD  = HexColor('#C4922A')
INK   = HexColor('#1F2421')
MUTED = HexColor('#6B6F6C')
RULE  = HexColor('#DCD7CF')
WHITE = HexColor('#FFFFFF')

MAX_TIMELINE = 7        # nós que cabem na largura de forma legível
INNER = WIDTH - 2 * M


def die(msg):
    print(f'ERRO: {msg}', file=sys.stderr)
    sys.exit(1)


def wrapped(text, font, size, width=INNER):
    return simpleSplit(text, font, size, width)


# ---------------------------------------------------------------------------
# Cada bloco: measure() -> altura em pt; draw(c, y_top) -> y após desenhar.
# ---------------------------------------------------------------------------

class Header:
    def __init__(self, r):
        self.titulo = r.get('titulo', '')
        self.sub = r.get('subtitulo', '')
        self.lines = wrapped(self.titulo, 'Times-Bold', 27)

    def measure(self):
        return 14 + len(self.lines) * 30 + 16

    def draw(self, c, y):
        c.setFillColor(GOLD)
        c.setFont('Helvetica-Bold', 8)
        c.drawString(M, y - 8, 'R E S U M O   E X E C U T I V O')
        if self.sub:
            c.setFillColor(MUTED)
            c.setFont('Helvetica', 9)
            c.drawRightString(WIDTH - M, y - 8, self.sub)
        yy = y - 34
        c.setFillColor(INK)
        c.setFont('Times-Bold', 27)
        for ln in self.lines:
            c.drawString(M, yy, ln)
            yy -= 30
        c.setStrokeColor(GREEN)
        c.setLineWidth(2)
        c.line(M, yy + 6, WIDTH - M, yy + 6)
        return yy - 10


class Para:
    def __init__(self, text, size=11, leading=16.5, gap=30, color=INK, font='Helvetica'):
        self.text, self.size, self.leading, self.gap, self.color, self.font = \
            text, size, leading, gap, color, font
        self.lines = wrapped(text, font, size)

    def measure(self):
        return len(self.lines) * self.leading + self.gap

    def draw(self, c, y):
        c.setFillColor(self.color)
        c.setFont(self.font, self.size)
        for ln in self.lines:
            c.drawString(M, y, ln)
            y -= self.leading
        return y - self.gap


class SectionTitle:
    def measure(self):
        return 28

    def __init__(self, title):
        self.title = title

    def draw(self, c, y):
        c.setFillColor(GREEN)
        c.setFont('Times-Bold', 14)
        c.drawString(M, y, self.title)
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.line(M, y - 6, WIDTH - M, y - 6)
        return y - 28


class Timeline:
    def __init__(self, nodes):
        self.nodes = nodes
        self.max_desc = max((len(n.get('desc', '').split('\n')) for n in nodes), default=0)

    def measure(self):
        return 62 + 34 + self.max_desc * 10 + 22

    def draw(self, c, y):
        tl_y = y - 62
        x0, x1 = M + 26, WIDTH - M - 26
        c.setStrokeColor(RULE)
        c.setLineWidth(3)
        c.line(x0, tl_y, x1, tl_y)
        n = len(self.nodes)
        step = (x1 - x0) / max(1, n - 1)
        for i, node in enumerate(self.nodes):
            x = x0 + i * step if n > 1 else (x0 + x1) / 2
            kind = node.get('kind', 'mid')
            color = GOLD if kind in ('start', 'revisao') else GREEN
            filled = kind in ('destino', 'revisao')
            c.setFillColor(INK)
            c.setFont('Courier-Bold', 10.5)
            c.drawCentredString(x, tl_y + 24, node['date'])
            if node.get('dow'):
                c.setFillColor(MUTED)
                c.setFont('Helvetica', 7.5)
                c.drawCentredString(x, tl_y + 14, node['dow'])
            c.setStrokeColor(color)
            c.setLineWidth(2.2)
            c.setFillColor(color if filled else BG)
            c.circle(x, tl_y, 6.5, fill=1, stroke=1)
            c.setFillColor(color if filled else INK)
            c.setFont('Helvetica-Bold', 9.5)
            c.drawCentredString(x, tl_y - 22, node['title'])
            if node.get('desc'):
                c.setFillColor(MUTED)
                c.setFont('Helvetica', 8)
                dy = tl_y - 34
                for ln in node['desc'].split('\n'):
                    c.drawCentredString(x, dy, ln)
                    dy -= 10
        return tl_y - 34 - self.max_desc * 10 - 22


class DetailList:
    """Etapas/marcos em detalhe: nome + o que entrega + prazo. Sem 5W2H."""
    def __init__(self, itens):
        self.itens = itens
        self._h = []
        for it in itens:
            lines = wrapped(it.get('entrega', ''), 'Helvetica', 9.5, INNER - 14)
            self._h.append(len(lines))

    def measure(self):
        total = 8
        for nl in self._h:
            total += 15 + nl * 12.5 + 10
        return total

    def draw(self, c, y):
        y -= 4
        for it, nl in zip(self.itens, self._h):
            # tarja/prazo
            c.setFillColor(INK)
            c.setFont('Helvetica-Bold', 10.5)
            c.drawString(M + 14, y, it.get('nome', ''))
            if it.get('prazo'):
                c.setFillColor(GOLD)
                c.setFont('Courier-Bold', 9.5)
                c.drawRightString(WIDTH - M, y, it['prazo'])
            # marcador
            c.setFillColor(GREEN)
            c.circle(M + 5, y + 3, 3, fill=1, stroke=0)
            y -= 15
            c.setFillColor(MUTED)
            c.setFont('Helvetica', 9.5)
            for ln in wrapped(it.get('entrega', ''), 'Helvetica', 9.5, INNER - 14):
                c.drawString(M + 14, y, ln)
                y -= 12.5
            y -= 10
        return y - 4


class Box:
    """Caixa dourada: título + texto + destaque (verde)."""
    def __init__(self, b):
        self.titulo = b.get('titulo')
        self.texto = b.get('texto', '')
        self.destaque = b.get('destaque', '')
        self.wt = wrapped(self.texto, 'Helvetica', 10, INNER - 24) if self.texto else []
        self.wd = wrapped(self.destaque, 'Helvetica-Bold', 10, INNER - 24) if self.destaque else []

    def _inner_h(self):
        h = 16
        h += len(self.wt) * 14.5
        if self.wt and self.wd:
            h += 6
        h += len(self.wd) * 14.5
        return h

    def measure(self):
        return (28 if self.titulo else 0) + self._inner_h() + 18

    def draw(self, c, y):
        if self.titulo:
            y = SectionTitle(self.titulo).draw(c, y)
        box_h = self._inner_h()
        c.setFillColor(WHITE)
        c.setStrokeColor(GOLD)
        c.setLineWidth(1.2)
        c.rect(M, y - box_h + 8, INNER, box_h, fill=1, stroke=1)
        ty = y - 8
        c.setFillColor(INK)
        c.setFont('Helvetica', 10)
        for ln in self.wt:
            c.drawString(M + 12, ty, ln)
            ty -= 14.5
        if self.wt and self.wd:
            ty -= 6
        c.setFillColor(GREEN)
        c.setFont('Helvetica-Bold', 10)
        for ln in self.wd:
            c.drawString(M + 12, ty, ln)
            ty -= 14.5
        return y - box_h + 8 - 18


class BulletList:
    """Lista simples (ex.: riscos-chave), em linguagem de negócio."""
    def __init__(self, itens):
        self.itens = itens
        self._w = [wrapped(t, 'Helvetica', 9.8, INNER - 16) for t in itens]

    def measure(self):
        return 6 + sum(len(w) * 13 + 8 for w in self._w)

    def draw(self, c, y):
        y -= 2
        for w in self._w:
            c.setFillColor(GOLD)
            c.circle(M + 4, y + 3, 2.4, fill=1, stroke=0)
            c.setFillColor(INK)
            c.setFont('Helvetica', 9.8)
            for ln in w:
                c.drawString(M + 14, y, ln)
                y -= 13
            y -= 8
        return y


class Footer:
    def __init__(self, r):
        self.rodape = r.get('rodape', '')
        self.assinatura = r.get('assinatura', '')

    def measure(self):
        return 32

    def draw(self, c, y):
        c.setStrokeColor(RULE)
        c.setLineWidth(0.8)
        c.line(M, y + 4, WIDTH - M, y + 4)
        c.setFillColor(MUTED)
        c.setFont('Helvetica', 8)
        if self.rodape:
            c.drawString(M, y - 8, self.rodape)
        if self.assinatura:
            c.drawRightString(WIDTH - M, y - 8, self.assinatura)
        return y - 20


def build_blocks(r):
    blocks = [Header(r)]
    if r.get('contexto'):
        blocks.append(Para(r['contexto']))
    tl = r.get('timeline') or []
    if not (2 <= len(tl) <= MAX_TIMELINE):
        die(f'timeline tem {len(tl)} nós; use entre 2 e {MAX_TIMELINE}. A largura só '
            f'comporta {MAX_TIMELINE}. Plano grande: 1 nó por FASE + destino na timeline, '
            f'e enumere o resto no bloco "detalhe" (ver SKILL.md).')
    blocks.append(SectionTitle(r.get('timeline_titulo', 'Linha do tempo')))
    blocks.append(Timeline(tl))

    det = r.get('detalhe')
    if det and det.get('itens'):
        blocks.append(SectionTitle(det.get('titulo', 'As etapas em detalhe')))
        blocks.append(DetailList(det['itens']))

    # caixas de destaque (uma ou mais)
    caixas = r.get('caixas')
    if not caixas and r.get('caixa'):
        caixas = [r['caixa']]
    for b in (caixas or []):
        blocks.append(Box(b))

    riscos = r.get('riscos')
    if riscos and riscos.get('itens'):
        blocks.append(SectionTitle(riscos.get('titulo', 'O que a gestão precisa saber')))
        blocks.append(BulletList(riscos['itens']))

    blocks.append(Footer(r))
    return blocks


def main():
    if len(sys.argv) != 3:
        die('uso: python build_summary_pdf.py resumo.json saida.pdf')
    r = json.load(open(sys.argv[1], encoding='utf-8'))
    blocks = build_blocks(r)

    height = TOP + sum(b.measure() for b in blocks) + BOT
    height = max(height, 420)  # piso, para não gerar uma tira minúscula

    c = canvas.Canvas(sys.argv[2], pagesize=(WIDTH, height))
    c.setTitle(r.get('titulo', 'Resumo executivo'))
    c.setFillColor(BG)
    c.rect(0, 0, WIDTH, height, fill=1, stroke=0)

    y = height - TOP
    for b in blocks:
        y = b.draw(c, y)
    c.showPage()
    c.save()

    print(f'OK: {sys.argv[2]} — 1 página de {WIDTH:.0f}x{height:.0f}pt, '
          f'{len(r.get("timeline", []))} nós na timeline')


if __name__ == '__main__':
    main()
