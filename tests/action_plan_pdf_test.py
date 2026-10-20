"""Functional PDF checks. Requires reportlab and pypdf in the test environment."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "plugins/nimbou-skills/skills/action-plan/scripts/build_plan_pdf.py"


def plan():
    return {
        "titulo": "Piloto de atendimento",
        "objetivo": {"frase": "Testar o atendimento até 31/01/2027."},
        "ciclo": {"proxima_revisao": "27/10/2026"},
        "marcos": [{
            "nome": "Ambiente preparado",
            "tarefas": [{
                "id": "teste", "titulo": "Verifique o ambiente.",
                "responsavel": "Pessoa responsável", "prazo": "30/10/2026",
                "concluida_quando": "O acesso funciona.",
                "subtarefas": ["Confira os dados."]
            }]
        }]
    }


class PlanPdfTest(unittest.TestCase):
    def generate(self, data):
        directory = tempfile.TemporaryDirectory(prefix="action-plan-test-")
        self.addCleanup(directory.cleanup)
        source = Path(directory.name) / "plano.json"
        destination = Path(directory.name) / "plano.pdf"
        source.write_text(json.dumps(data), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(SCRIPT), str(source), str(destination)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        return PdfReader(destination)

    def test_task_text_and_metadata_share_the_top_in_separate_columns(self):
        pdf = self.generate(plan())
        chunks = []

        def visit(text, matrix, text_matrix, font, size):
            chunks.append((text.strip(), matrix[4] + text_matrix[4],
                           matrix[5] + text_matrix[5]))

        pdf.pages[0].extract_text(visitor_text=visit)
        title = next(c for c in chunks if "Verifique o ambiente." in c[0])
        owner = next(c for c in chunks if "Pessoa responsável" in c[0])
        self.assertGreater(owner[1] - title[1], 200,
                           "Responsible person must be in the right column")
        self.assertLess(abs(title[2] - owner[2]), 12,
                        "Title and metadata must start at the same height")

    def test_brand_fonts_are_embedded(self):
        pdf = self.generate(plan())
        font_names = [str(font.get_object().get("/BaseFont", ""))
                      for page in pdf.pages
                      for font in page["/Resources"]["/Font"].values()]
        self.assertTrue(any("Archivo" in name for name in font_names), font_names)
        self.assertTrue(any("SourceSans3" in name for name in font_names), font_names)

    def test_short_name_does_not_wrap_inside_a_chip(self):
        data = plan()
        data["marcos"][0]["tarefas"][0]["responsavel"] = "Everton"
        pdf = self.generate(data)
        self.assertIn("Everton", pdf.pages[0].extract_text())

    def test_long_task_can_continue_without_losing_text(self):
        data = plan()
        task = data["marcos"][0]["tarefas"][0]
        task["responsavel"] = "Pessoa responsável pelo atendimento entre setores e unidades"
        task["concluida_quando"] = ("Descrição longa e verificável. " * 300
                                   + "FIM_DA_DESCRICAO")
        task["subtarefas"] += [f"Execute a verificação número {i}." for i in range(65)]
        pdf = self.generate(data)
        text = " ".join(page.extract_text() for page in pdf.pages)
        self.assertGreater(len(pdf.pages), 1)
        self.assertIn("Verifique o ambiente.", pdf.pages[0].extract_text(),
                      "A long task must start with its milestone, without an empty first page")
        self.assertIn("FIM_DA_DESCRICAO", text)
        self.assertIn("Execute a verificação número 64.", text)

    def test_legacy_actions_keep_their_layout(self):
        pdf = self.generate({
            "titulo": "Plano legado",
            "objetivo": {"frase": "Concluir a conferência."},
            "ciclo": {"proxima_revisao": "27/10/2026"},
            "marcos": [{"nome": "Conferência pronta", "acoes": [{
                "o_que": "Confira o documento", "quem": "Ana", "quando": "30/10/2026"
            }]}]
        })
        text = " ".join(page.extract_text() for page in pdf.pages)
        self.assertIn("Confira o documento", text)
        self.assertIn("PDCA", text)


if __name__ == "__main__":
    unittest.main()
