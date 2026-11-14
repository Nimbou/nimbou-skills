"""Functional checks for the packaged cover; reportlab, svglib and pdfplumber required."""
import importlib.util
from io import BytesIO
from pathlib import Path
import unittest

import pdfplumber
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen.canvas import Canvas

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('proposal_cover',
    ROOT/'plugins/nimbou-skills/skills/doc-proposal/scripts/draw_cover.py')
COVER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(COVER)


def data():
    return dict(client='Horizonte & Parceiros',
                subtitle='Plano de desenvolvimento e melhoria da operação',
                issue_date='18 de maio de 2031', issue_year='2031',
                client_description='Amostra de validação',
                regular_font='Helvetica', bold_font='Helvetica-Bold')


class ProposalCoverTest(unittest.TestCase):
    def test_cover_uses_supplied_identity_as_readable_text_within_page(self):
        buffer = BytesIO()
        pdf = Canvas(buffer, pagesize=A4)
        COVER.draw_cover(pdf, **data())
        pdf.save()
        with pdfplumber.open(BytesIO(buffer.getvalue())) as document:
            self.assertEqual(len(document.pages), 1)
            page = document.pages[0]
            text = ' '.join(page.extract_text().split())
            for value in ['Horizonte & Parceiros', '18 de maio de 2031', 'PROPOSTA · 2031',
                          'Assessoria Empresarial', 'Plano de desenvolvimento e melhoria da operação']:
                self.assertIn(value, text)
            self.assertNotIn('Amazônia', text)
            self.assertNotIn('R$', text)
            for char in page.chars:
                self.assertGreaterEqual(char['x0'], 0)
                self.assertLessEqual(char['x1'], page.width)
                self.assertGreaterEqual(char['top'], 0)
                self.assertLessEqual(char['bottom'], page.height)

    def test_cover_preserves_canvas_state_and_leaves_pagination_to_caller(self):
        buffer = BytesIO()
        pdf = Canvas(buffer, pagesize=A4)
        pdf.setFillColorRGB(1, 0, 0)
        pdf.setFont('Helvetica', 10)
        COVER.draw_cover(pdf, **data())
        pdf.drawString(52, 27, 'STATE_MARKER')
        pdf.showPage()
        pdf.drawString(60, 700, 'BODY_MARKER')
        pdf.save()
        with pdfplumber.open(BytesIO(buffer.getvalue())) as document:
            self.assertEqual(len(document.pages), 2)
            marker = document.pages[0].search('STATE_MARKER')[0]
            for char in marker['chars']:
                self.assertEqual(char['non_stroking_color'], (1, 0, 0))
            self.assertIn('BODY_MARKER', document.pages[1].extract_text())

    def test_oversized_content_is_rejected_before_generating_a_clipped_cover(self):
        for changed in [dict(title_lines=['Título extenso ' * 15]),
                        dict(subtitle='Subtítulo excessivamente longo. ' * 80),
                        dict(client='Nome extenso da organização ' * 30),
                        dict(client_description='Descrição extensa ' * 30)]:
            with self.subTest(changed=next(iter(changed))):
                pdf = Canvas(BytesIO(), pagesize=A4)
                with self.assertRaises(ValueError):
                    COVER.draw_cover(pdf, **(data() | changed))


if __name__ == '__main__':
    unittest.main()
