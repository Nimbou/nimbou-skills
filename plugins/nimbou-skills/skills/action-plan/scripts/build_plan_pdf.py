#!/usr/bin/env python3
"""Gera o PDF do plano de ação a partir de um plano.json.

Uso:  python3 build_plan_pdf.py plano.json plano_v1.pdf

O schema está em references/schema.md. Planos com `marcos[].tarefas[]` usam
o formato de tarefas; planos legados com `acoes[]` preservam o 5W2H.
Campos opcionais ausentes são omitidos. IDs/dependências inválidos no formato
de tarefas geram erro explícito antes da criação do PDF.
"""
import json
import sys
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, PageBreak,
                                PageTemplate, Paragraph, Spacer, Table, TableStyle)

INK = colors.HexColor("#1a1a1a")
MUTED = colors.HexColor("#6b7280")
LINE = colors.HexColor("#d4d4d8")
BAND = colors.HexColor("#f4f4f5")
ACCENT = colors.HexColor("#1d4ed8")
WARN = colors.HexColor("#b45309")

ss = getSampleStyleSheet()
S = {
    "h1": ParagraphStyle("h1", parent=ss["Heading1"], fontName="Helvetica-Bold",
                         fontSize=18, leading=22, textColor=INK, spaceAfter=2),
    "sub": ParagraphStyle("sub", fontName="Helvetica", fontSize=9, leading=12,
                          textColor=MUTED, spaceAfter=10),
    "h2": ParagraphStyle("h2", parent=ss["Heading2"], fontName="Helvetica-Bold",
                         fontSize=12.5, leading=16, textColor=INK,
                         spaceBefore=14, spaceAfter=6),
    "h3": ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=10.5, leading=14,
                         textColor=INK, spaceBefore=8, spaceAfter=3),
    "p": ParagraphStyle("p", fontName="Helvetica", fontSize=9.5, leading=13,
                        textColor=INK, alignment=TA_LEFT),
    "small": ParagraphStyle("small", fontName="Helvetica", fontSize=8.3, leading=11,
                            textColor=INK),
    "smallb": ParagraphStyle("smallb", fontName="Helvetica-Bold", fontSize=8.3,
                             leading=11, textColor=INK),
    "flag": ParagraphStyle("flag", fontName="Helvetica-Bold", fontSize=8.3,
                           leading=11, textColor=WARN),
}


def esc(v):
    if v is None:
        return ""
    return (str(v).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def cell(v, bold=False):
    txt = esc(v)
    style = S["smallb"] if bold else S["small"]
    if "DONO A DEFINIR" in txt.upper() or "A DEFINIR" == txt.strip().upper():
        style = S["flag"]
    return Paragraph(txt, style)


def kv_table(rows, widths):
    t = Table(rows, colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BACKGROUND", (0, 0), (0, -1), BAND),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    return t


def grid_table(data, widths, header=True):
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    style = [
        ("GRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]
    if header:
        style.append(("BACKGROUND", (0, 0), (-1, 0), BAND))
    t.setStyle(TableStyle(style))
    return t


class Sec:
    """Numerador de seções — evita números fixos quando seções opcionais entram/saem."""
    def __init__(self):
        self.n = 0

    def __call__(self, title):
        self.n += 1
        return Paragraph(f"{self.n}. {esc(title)}", S["h2"])


def build_task_plan(plan, out_path):
    """Formato legível para planos que serão desdobrados em tarefas de sistema."""
    W, H = A4
    ML = MR = 18 * mm
    CW = W - ML - MR
    titulo = plan.get("titulo", "Plano de ação")
    versao = plan.get("versao", 1)
    doc = BaseDocTemplate(out_path, pagesize=A4, leftMargin=ML, rightMargin=MR,
                          topMargin=16 * mm, bottomMargin=16 * mm, title=titulo)
    frame = Frame(ML, 16 * mm, CW, H - 32 * mm, id="f")

    def deco(canvas, _doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(ML, H - 11 * mm, f"{titulo} — v{versao}")
        canvas.drawRightString(W - MR, 10 * mm, f"pág. {canvas.getPageNumber()}")
        canvas.setStrokeColor(LINE)
        canvas.line(ML, H - 13 * mm, W - MR, H - 13 * mm)
        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=deco)])
    marcos = plan.get("marcos") or []
    tarefas = [t for m in marcos for t in m.get("tarefas", [])]
    vistos = set()
    for tarefa in tarefas:
        tid = tarefa.get("id")
        if not tid or tid in vistos:
            raise ValueError(f"ID de tarefa ausente ou repetido: {tid!r}")
        for dep in tarefa.get("depende_de") or []:
            if dep not in vistos:
                raise ValueError(
                    f"Tarefa {tid!r} depende de {dep!r}, que não é tarefa anterior"
                )
        vistos.add(tid)
    for fase in plan.get("fases_futuras") or []:
        for marco in fase.get("marcos_previstos") or []:
            if isinstance(marco, dict):
                for dep in marco.get("depende_de") or []:
                    if dep not in vistos:
                        raise ValueError(
                            f"Marco futuro {marco.get('nome')!r} depende de tarefa desconhecida {dep!r}"
                        )
    numeros = {t["id"]: f"T{i}" for i, t in enumerate(tarefas, 1) if t.get("id")}
    F = [Paragraph(esc(titulo), S["h1"])]
    F.append(Paragraph(
        f"Plano de ação · versão {versao} · {esc(plan.get('data') or date.today().strftime('%d/%m/%Y'))}"
        + (f" · próxima revisão: {esc(plan['ciclo']['proxima_revisao'])}"
           if (plan.get("ciclo") or {}).get("proxima_revisao") else ""),
        S["sub"]))
    obj = plan.get("objetivo") or {}
    F.append(Paragraph("Objetivo", S["h2"]))
    F.append(Paragraph(esc(obj.get("frase")), S["p"]))

    # A sequência fica visível sem expor a terminologia interna do método.
    fases = plan.get("fases_futuras") or []
    if fases:
        F.append(Paragraph("Etapas do piloto", S["h2"]))
        etapas = [(plan.get("fase_atual_nome", "Fase atual"), "Agora")]
        etapas += [(f.get("nome", f"Etapa {i + 2}"), f.get("periodo", ""))
                   for i, f in enumerate(fases)]
        etapas = etapas[:3]
        cards = []
        widths = []
        for i, (nome, periodo) in enumerate(etapas):
            cards.append(Paragraph(
                f"<b>{esc(nome)}</b><br/><font color='#6b7280'>{esc(periodo)}</font>",
                S["small"]))
            widths.append((CW - (len(etapas) - 1) * 8 * mm) / len(etapas))
            if i < len(etapas) - 1:
                cards.append(Paragraph("→", S["h3"]))
                widths.append(8 * mm)
        t = Table([cards], colWidths=widths, hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), BAND),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        F.append(t)

    F.append(Paragraph("Marcos e tarefas", S["h2"]))
    F.append(Paragraph(
        "As referências T1, T2… identificam tarefas para futura criação no sistema. "
        "“Após T…” indica a tarefa que precisa terminar antes.", S["sub"]))
    for i, marco in enumerate(marcos, 1):
        F.append(Paragraph(f"Marco {i} — {esc(marco.get('nome'))}", S["h3"]))
        if marco.get("resultado_verificavel"):
            F.append(Paragraph(esc(marco["resultado_verificavel"]), S["p"]))
        if marco.get("prazo"):
            F.append(Paragraph(f"Previsão: {esc(marco['prazo'])}", S["sub"]))
        data = [[cell(h, True) for h in ("Tarefa e entrega", "Responsável", "Previsão", "Após")]]
        for tarefa in marco.get("tarefas", []):
            tid = numeros.get(tarefa.get("id"), "")
            detalhe = f"<b>{esc(tid)} · {esc(tarefa.get('titulo'))}</b>"
            if tarefa.get("concluida_quando"):
                detalhe += f"<br/>Concluída quando: {esc(tarefa['concluida_quando'])}"
            for sub in tarefa.get("subtarefas") or []:
                detalhe += f"<br/>• {esc(sub)}"
            deps = ", ".join(numeros.get(d, d) for d in tarefa.get("depende_de") or [])
            data.append([
                Paragraph(detalhe, S["small"]),
                cell(tarefa.get("responsavel")),
                cell(tarefa.get("prazo")),
                cell(deps or "—"),
            ])
        if len(data) > 1:
            F.append(grid_table(data, [0.55 * CW, 0.17 * CW, 0.13 * CW, 0.15 * CW]))
        F.append(Spacer(1, 4 * mm))

    if fases:
        F.append(Paragraph("Próximas fases", S["h2"]))
        for fase in fases:
            F.append(Paragraph(esc(fase.get("nome")), S["h3"]))
            for marco in fase.get("marcos_previstos") or []:
                if isinstance(marco, str):
                    F.append(Paragraph("• " + esc(marco), S["p"]))
                else:
                    resumo = marco.get("nome", "")
                    deps = ", ".join(
                        numeros[d] for d in marco.get("depende_de") or []
                    )
                    if deps:
                        resumo += f" (após {deps})"
                    if marco.get("prazo"):
                        resumo += f" — até {marco['prazo']}"
                    F.append(Paragraph("• " + esc(resumo), S["p"]))

    if plan.get("limites"):
        F.append(Paragraph("O que este piloto não muda", S["h2"]))
        cards = [Paragraph(esc(limite), S["small"]) for limite in plan["limites"][:3]]
        t = Table([cards], colWidths=[CW / len(cards)] * len(cards), hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.6, LINE),
            ("INNERGRID", (0, 0), (-1, -1), 0.6, LINE),
            ("BACKGROUND", (0, 0), (-1, -1), BAND),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        F.append(t)
        for limite in plan["limites"][3:]:
            F.append(Paragraph("• " + esc(limite), S["p"]))

    if plan.get("gatilhos_ajuste"):
        F.append(Paragraph("Quando ajustar o plano", S["h2"]))
        for gatilho in plan["gatilhos_ajuste"]:
            F.append(Paragraph("• " + esc(gatilho), S["p"]))
    doc.build(F)
    return out_path


def build(plan, out_path):
    if any(m.get("tarefas") for m in plan.get("marcos") or []):
        return build_task_plan(plan, out_path)
    W, H = A4
    ML = MR = 18 * mm
    doc = BaseDocTemplate(out_path, pagesize=A4, leftMargin=ML, rightMargin=MR,
                          topMargin=16 * mm, bottomMargin=16 * mm,
                          title=plan.get("titulo", "Plano de Ação"))
    frame = Frame(ML, 16 * mm, W - ML - MR, H - 32 * mm, id="f")

    titulo = plan.get("titulo", "Plano de Ação")
    versao = plan.get("versao", 1)

    def deco(canvas, _doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(ML, H - 11 * mm, f"{titulo} — v{versao}")
        canvas.drawRightString(W - MR, 10 * mm, f"pág. {canvas.getPageNumber()}")
        canvas.setStrokeColor(LINE)
        canvas.line(ML, H - 13 * mm, W - MR, H - 13 * mm)
        canvas.restoreState()

    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=deco)])

    CW = W - ML - MR
    F = []
    sec = Sec()
    obj = plan.get("objetivo", {}) or {}
    ciclo = plan.get("ciclo", {}) or {}
    escopo = plan.get("escopo", {}) or {}

    F.append(Paragraph(esc(titulo), S["h1"]))
    subtitle = (
        f"Plano de ação · versão {versao} · emitido em "
        f"{esc(plan.get('data') or date.today().strftime('%d/%m/%Y'))}"
    )
    if escopo.get("porte"):
        subtitle += f" · porte: {esc(escopo['porte'])}"
    if plan.get("responsavel_geral"):
        subtitle += f" · responsável: {esc(plan['responsavel_geral'])}"
    F.append(Paragraph(subtitle, S["sub"]))

    # Objetivo
    F.append(sec("Objetivo"))
    rows = [[cell("Resultado", True), cell(obj.get("frase"))]]
    for k, label in (("indicador", "Indicador"), ("meta", "Meta"), ("prazo", "Prazo"),
                     ("por_que_agora", "Por que agora"), ("custo_da_inacao", "Custo da inação")):
        if obj.get(k):
            rows.append([cell(label, True), cell(obj[k])])
    F.append(kv_table(rows, [32 * mm, CW - 32 * mm]))

    # Escopo (só em plano grande/programa)
    if escopo.get("horizonte") or escopo.get("fase_ativa"):
        F.append(sec("Escopo e fase ativa"))
        rows = []
        for k, label in (("porte", "Porte"), ("horizonte", "Horizonte"),
                         ("fase_ativa", "Fase ativa (detalhada abaixo)")):
            if escopo.get(k):
                rows.append([cell(label, True), cell(escopo[k])])
        F.append(kv_table(rows, [50 * mm, CW - 50 * mm]))

    # Ciclo
    if ciclo:
        F.append(sec("Ciclo e revisão (PDCA)"))
        rows = []
        for k, label in (("inicio", "Início"), ("fim", "Fim do ciclo"),
                         ("cadencia_revisao", "Cadência de revisão"),
                         ("proxima_revisao", "Próxima revisão")):
            if ciclo.get(k):
                rows.append([cell(label, True), cell(ciclo[k])])
        if rows:
            F.append(kv_table(rows, [38 * mm, CW - 38 * mm]))
        if plan.get("gatilhos_ajuste"):
            F.append(Paragraph("Gatilhos de ajuste", S["h3"]))
            for g in plan["gatilhos_ajuste"]:
                F.append(Paragraph("• " + esc(g), S["p"]))

    # Marcos (fase ativa)
    marcos = plan.get("marcos") or []
    fase_ativa = escopo.get("fase_ativa")
    titulo_marcos = "Marcos e ações (5W2H)"
    if fase_ativa:
        titulo_marcos = f"Marcos e ações da fase ativa (5W2H) — {fase_ativa}"
    F.append(sec(titulo_marcos))
    for i, m in enumerate(marcos, 1):
        blk = [Paragraph(f"Marco {i} — {esc(m.get('nome'))}", S["h3"])]
        head = []
        for k, label in (("resultado_verificavel", "Resultado verificável"),
                         ("indicador", "Indicador"), ("prazo", "Prazo"),
                         ("acao_48h", "Primeira ação (48h)")):
            if m.get(k):
                head.append([cell(label, True), cell(m[k])])
        if head:
            blk.append(kv_table(head, [38 * mm, CW - 38 * mm]))
            blk.append(Spacer(1, 4))

        acoes = m.get("acoes") or []
        if acoes:
            hdr = ["O quê", "Quem", "Quando", "Como", "Quanto", "Critério de conclusão"]
            data = [[cell(h, True) for h in hdr]]
            for a in acoes:
                onde = f" <i>({esc(a.get('onde'))})</i>" if a.get("onde") else ""
                oq = esc(a.get("o_que")) + onde
                pq = f"<br/><font color='#6b7280'>Por quê: {esc(a.get('por_que'))}</font>" if a.get("por_que") else ""
                data.append([
                    Paragraph(oq + pq, S["small"]),
                    cell(a.get("quem")),
                    cell(a.get("quando")),
                    cell(a.get("como")),
                    cell(a.get("quanto")),
                    cell(a.get("criterio_conclusao")),
                ])
            widths = [0.28, 0.11, 0.10, 0.19, 0.09, 0.23]
            blk.append(grid_table(data, [w * CW for w in widths]))
        F.append(KeepTogether(blk) if len(acoes) <= 3 else blk[0])
        if len(acoes) > 3:
            for el in blk[1:]:
                F.append(el)
        F.append(Spacer(1, 6))

    # Roadmap — fases futuras (esboço, sem 5W2H)
    fases = plan.get("fases_futuras") or []
    if fases:
        F.append(sec("Roadmap — próximas fases"))
        F.append(Paragraph(
            "Fases seguintes do programa, em esboço. Cada uma vira um ciclo detalhado "
            "quando promovida a fase ativa, na revisão. Sem 5W2H ainda — de propósito.",
            S["sub"]))
        for j, fase in enumerate(fases, 1):
            blk = [Paragraph(esc(fase.get("nome") or f"Fase futura {j}"), S["h3"])]
            head = []
            for k, label in (("resultado", "Resultado esperado"), ("periodo", "Período")):
                if fase.get(k):
                    head.append([cell(label, True), cell(fase[k])])
            if head:
                blk.append(kv_table(head, [38 * mm, CW - 38 * mm]))
                blk.append(Spacer(1, 3))
            previstos = fase.get("marcos_previstos") or []
            if previstos:
                data = [[cell(h, True) for h in ("Marco previsto", "Resultado verificável", "Prazo estimado")]]
                for mp in previstos:
                    if isinstance(mp, str):
                        data.append([cell(mp), cell(""), cell("")])
                    else:
                        data.append([cell(mp.get("nome")),
                                     cell(mp.get("resultado_verificavel")),
                                     cell(mp.get("prazo"))])
                blk.append(grid_table(data, [0.34 * CW, 0.44 * CW, 0.22 * CW]))
            F.append(KeepTogether(blk))
            F.append(Spacer(1, 6))

    # Riscos
    if plan.get("riscos"):
        F.append(sec("Riscos e bloqueios"))
        data = [[cell(h, True) for h in ("Risco", "Impacto", "Mitigação", "Dono")]]
        for r in plan["riscos"]:
            data.append([cell(r.get("risco")), cell(r.get("impacto")),
                         cell(r.get("mitigacao")), cell(r.get("dono"))])
        F.append(grid_table(data, [0.40 * CW, 0.12 * CW, 0.33 * CW, 0.15 * CW]))

    # Premissas
    if plan.get("premissas"):
        F.append(sec("Premissas (não validadas)"))
        for p in plan["premissas"]:
            F.append(Paragraph("• " + esc(p), S["p"]))

    # Backlog
    if plan.get("backlog"):
        F.append(sec("Backlog / próximo ciclo"))
        F.append(Paragraph(
            "Itens soltos, deliberadamente fora do ciclo atual, para manter o plano "
            "executável. Podem ser promovidos na próxima revisão.", S["sub"]))
        data = [[cell(h, True) for h in ("Item", "Motivo do adiamento")]]
        for b in plan["backlog"]:
            if isinstance(b, str):
                data.append([cell(b), cell("")])
            else:
                data.append([cell(b.get("item")), cell(b.get("motivo_adiamento"))])
        F.append(grid_table(data, [0.55 * CW, 0.45 * CW]))

    # Check/Act (v2+)
    ca = plan.get("check_act")
    if ca:
        F.append(PageBreak())
        F.append(Paragraph("Check / Act — fechamento do ciclo anterior", S["h2"]))
        for key, label in (("entregue", "Entregue"), ("aprendizados", "Aprendizados"),
                           ("mudancas", "O que muda agora")):
            if ca.get(key):
                F.append(Paragraph(label, S["h3"]))
                for it in ca[key]:
                    F.append(Paragraph("• " + esc(it), S["p"]))
        if ca.get("nao_entregue"):
            F.append(Paragraph("Não entregue", S["h3"]))
            data = [[cell(h, True) for h in ("Item", "Motivo")]]
            for it in ca["nao_entregue"]:
                if isinstance(it, str):
                    data.append([cell(it), cell("")])
                else:
                    data.append([cell(it.get("item")), cell(it.get("motivo"))])
            F.append(grid_table(data, [0.5 * CW, 0.5 * CW]))

    doc.build(F)
    return out_path


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    with open(sys.argv[1], encoding="utf-8") as fh:
        plan = json.load(fh)
    out = build(plan, sys.argv[2])
    print(f"PDF gerado: {out}")


if __name__ == "__main__":
    main()
