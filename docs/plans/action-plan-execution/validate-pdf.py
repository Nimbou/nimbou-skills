"""Smoke de compatibilidade do PDF legado com IDs operacionais opcionais."""
import copy
import json
import subprocess
import sys
from pathlib import Path

from pypdf import PdfReader

destination = Path(__file__).resolve().parent
root = destination.parents[2]
builder = root / "plugins/nimbou-skills/skills/action-plan/scripts/build_plan_pdf.py"
legacy = {
    "titulo": "Conferir cadastro de fornecedores",
    "versao": 1,
    "data": "30/09/2026",
    "objetivo": {
        "frase": "Cadastro conferido e relatório entregue",
        "indicador": "Registros conferidos",
        "meta": "100% do recorte",
        "prazo": "30/10/2026",
    },
    "ciclo": {
        "inicio": "30/09/2026",
        "fim": "30/10/2026",
        "cadencia_revisao": "Semanal",
        "proxima_revisao": "07/10/2026",
    },
    "marcos": [{
        "nome": "Diagnóstico disponível",
        "resultado_verificavel": "Relatório conferido",
        "prazo": "07/10/2026",
        "acoes": [{
            "o_que": "Conferir o recorte de registros",
            "quem": "Responsável do plano",
            "quando": "07/10/2026",
            "criterio_conclusao": "Relatório completo acessível",
        }],
    }],
}
identified = copy.deepcopy(legacy)
identified["id"] = "cadastro-fornecedores"
identified["marcos"][0]["id"] = "diagnostico"
identified["marcos"][0]["acoes"][0]["id"] = "conferir-registros"
documents = []
for name, plan in [("legacy", legacy), ("identified", identified)]:
    source = destination / f"{name}.json"
    output = destination / f"{name}.pdf"
    source.write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")
    subprocess.run([sys.executable, str(builder), str(source), str(output)], check=True)
    pdf = PdfReader(output)
    documents.append([page.extract_text() for page in pdf.pages])
assert documents[0] == documents[1], "IDs opcionais alteraram conteúdo/paginação do PDF"
assert documents[0] and "Diagnóstico" in "\n".join(documents[0])
print(f"PDF compatibility: identical content and pagination ({len(documents[0])} pages)")
