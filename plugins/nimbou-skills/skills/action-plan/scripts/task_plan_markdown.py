"""Markdown companion and phase integrity checks for the task-plan format."""
from pathlib import Path


def validate_phases(plan):
    phases = plan.get("fases")
    if not phases:
        if any(m.get("fase_id") for m in plan.get("marcos") or []):
            raise ValueError("Marcos com fase_id exigem fases[].")
        return
    phase_ids = [phase.get("id") for phase in phases]
    if not all(phase_ids) or len(set(phase_ids)) != len(phase_ids):
        raise ValueError("IDs de fases ausentes ou repetidos.")
    milestones = plan.get("marcos") or []
    milestone_ids = [milestone.get("id") for milestone in milestones]
    if not all(milestone_ids) or len(set(milestone_ids)) != len(milestone_ids):
        raise ValueError("IDs de marcos ausentes ou repetidos.")
    by_id = {milestone["id"]: milestone for milestone in milestones}
    assigned = []
    for phase in phases:
        for milestone_id in phase.get("marcos") or []:
            if milestone_id not in by_id or by_id[milestone_id].get("fase_id") != phase["id"]:
                raise ValueError(f"Marco fora da fase declarada: {milestone_id}")
            assigned.append(milestone_id)
    if assigned != milestone_ids:
        raise ValueError("As fases devem conter todos os marcos, uma vez e na ordem do plano.")


def write_markdown(plan, numbers, pdf_path):
    lines = ["# " + plan.get("titulo", "Plano de ação"), "",
             f"Versão {plan.get('versao', 1)}", "",
             (plan.get("objetivo") or {}).get("frase", ""), ""]
    for field in ("orientacao_execucao", "observacao_prazos"):
        if plan.get(field):
            lines += [plan[field], ""]
    phases = {phase["id"]: (index, phase)
              for index, phase in enumerate(plan.get("fases") or [], 1)}
    previous_phase = None
    for milestone in plan.get("marcos") or []:
        phase_id = milestone.get("fase_id")
        if phase_id and phase_id != previous_phase:
            index, phase = phases[phase_id]
            lines += [f"## Fase {index}. {phase['nome']}", ""]
            if phase.get("periodo"):
                lines += [phase["periodo"], ""]
            previous_phase = phase_id
        lines += ["### " + milestone.get("nome", "Marco"), ""]
        if milestone.get("resultado_verificavel"):
            lines += [milestone["resultado_verificavel"], ""]
        for task in milestone.get("tarefas") or []:
            lines += [f"#### {numbers[task['id']]} · {task.get('titulo', '')}", "",
                      f"- ID: `{task['id']}`."]
            for field, label in (("responsavel", "Responsável"), ("executor", "Execução"),
                                 ("prazo", "Previsão")):
                if task.get(field):
                    lines.append(f"- {label}: {task[field]}.")
            deps = ", ".join(numbers[d] for d in task.get("depende_de") or [])
            if deps:
                lines.append("- Depende de: " + deps + ".")
            lines.append("")
            if task.get("concluida_quando"):
                lines += ["**Pronto quando:** " + task["concluida_quando"], ""]
            lines += ["- " + sub for sub in task.get("subtarefas") or []] + [""]
            if task.get("recorrencia"):
                lines += [task["recorrencia"], ""]
            for field, label in (("insumos", "Referências"), ("entregaveis", "Entregas")):
                if task.get(field):
                    lines += [label + ": " + "; ".join(task[field]) + ".", ""]
    for phase in plan.get("fases_futuras") or []:
        lines += ["## " + phase.get("nome", "Próxima fase"), ""]
        if phase.get("periodo"):
            lines += [phase["periodo"], ""]
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
            lines.append("- " + text)
        lines.append("")
    for field, heading in (("limites", "Limites"), ("gatilhos_ajuste", "Quando ajustar")):
        if plan.get(field):
            lines += ["## " + heading, "", *["- " + item for item in plan[field]], ""]
    review = (plan.get("ciclo") or {}).get("proxima_revisao")
    if review:
        lines += ["Próxima revisão: " + review + ".", ""]
    output = Path(pdf_path).with_suffix(".md")
    output.write_text("\n".join(lines), encoding="utf-8")
    return output
