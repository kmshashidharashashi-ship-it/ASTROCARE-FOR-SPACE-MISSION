"""
ASTRACARE – Report generation service.
Generates PDF health & wellness summary reports using ReportLab.
"""

from __future__ import annotations

import json
import os
from datetime import datetime
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.health_record import HealthRecord
from app.models.report import Report
from app.models.wellness_record import WellnessRecord

REPORTS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "reports")


def _ensure_reports_dir() -> str:
    os.makedirs(REPORTS_DIR, exist_ok=True)
    return REPORTS_DIR


def _build_pdf(filepath: str, ast: Astronaut, health_records: list, wellness_records: list) -> None:
    """Generate a PDF report using ReportLab."""
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import (
            HRFlowable, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
        )

        doc = SimpleDocTemplate(filepath, pagesize=A4,
                                leftMargin=2*cm, rightMargin=2*cm,
                                topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle("title", parent=styles["Title"],
                                     textColor=colors.HexColor("#1a237e"))
        story.append(Paragraph("ASTRACARE – Health Summary Report", title_style))
        story.append(Spacer(1, 0.3*cm))
        story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#1a237e")))
        story.append(Spacer(1, 0.4*cm))

        # Astronaut info
        story.append(Paragraph(f"<b>Astronaut:</b> {ast.name}", styles["Normal"]))
        story.append(Paragraph(f"<b>ID:</b> {ast.astronaut_id}", styles["Normal"]))
        story.append(Paragraph(f"<b>Mission:</b> {ast.mission_name or 'N/A'}", styles["Normal"]))
        story.append(Paragraph(f"<b>Role:</b> {ast.role or 'N/A'}", styles["Normal"]))
        story.append(Paragraph(f"<b>Generated:</b> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
        story.append(Spacer(1, 0.5*cm))

        # Health records summary
        story.append(Paragraph("Health Measurements (Latest 20)", styles["Heading2"]))
        story.append(Spacer(1, 0.2*cm))

        if health_records:
            headers = ["Date", "HR (bpm)", "BP (sys/dia)", "BG (mg/dL)", "Temp (°C)", "SpO₂ (%)", "Sleep (h)", "Anomaly"]
            table_data = [headers]
            for r in health_records[:20]:
                date_str = r.recorded_at.strftime("%Y-%m-%d %H:%M") if r.recorded_at else "N/A"
                bp_str   = f"{r.systolic_bp or '—'}/{r.diastolic_bp or '—'}"
                anom     = "⚠️ Yes" if r.is_anomaly else ("No" if r.is_anomaly is False else "—")
                table_data.append([
                    date_str,
                    str(r.heart_rate or "—"),
                    bp_str,
                    str(r.blood_sugar or "—"),
                    str(r.body_temperature or "—"),
                    str(r.oxygen_saturation or "—"),
                    str(r.sleep_duration or "—"),
                    anom,
                ])
            tbl = Table(table_data, repeatRows=1)
            tbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1a237e")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
                ("FONTSIZE",   (0, 0), (-1, 0), 8),
                ("FONTSIZE",   (0, 1), (-1, -1), 7),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#e8eaf6")]),
                ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(tbl)
        else:
            story.append(Paragraph("No health records available.", styles["Normal"]))

        story.append(Spacer(1, 0.5*cm))

        # Wellness summary
        story.append(Paragraph("Wellness Check-ins (Latest 10)", styles["Heading2"]))
        story.append(Spacer(1, 0.2*cm))

        if wellness_records:
            w_headers = ["Date", "Mood", "Stress", "Fatigue", "Energy", "Sleep Quality"]
            w_data = [w_headers]
            for w in wellness_records[:10]:
                date_str = w.recorded_at.strftime("%Y-%m-%d") if w.recorded_at else "N/A"
                w_data.append([
                    date_str,
                    str(w.mood or "—"),
                    str(w.stress_level or "—"),
                    str(w.fatigue_level or "—"),
                    str(w.energy_level or "—"),
                    str(w.sleep_quality or "—"),
                ])
            wtbl = Table(w_data, repeatRows=1)
            wtbl.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#004d40")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
                ("FONTSIZE",   (0, 0), (-1, 0), 8),
                ("FONTSIZE",   (0, 1), (-1, -1), 7),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#e0f2f1")]),
            ]))
            story.append(wtbl)
        else:
            story.append(Paragraph("No wellness records available.", styles["Normal"]))

        story.append(Spacer(1, 0.5*cm))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
        story.append(Spacer(1, 0.2*cm))
        disclaimer_style = ParagraphStyle("disclaimer", parent=styles["Italic"],
                                          fontSize=7, textColor=colors.grey)
        story.append(Paragraph(
            "DISCLAIMER: This report is generated by ASTRACARE for monitoring purposes only. "
            "It does not constitute medical advice or diagnosis. Consult your mission medical officer "
            "for any health concerns. Simulated data is clearly labelled.",
            disclaimer_style,
        ))

        doc.build(story)

    except ImportError:
        # ReportLab not installed – write a plain-text fallback
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"ASTRACARE Health Report\n")
            f.write(f"Astronaut: {ast.name} ({ast.astronaut_id})\n")
            f.write(f"Generated: {datetime.utcnow().isoformat()}\n\n")
            f.write(f"Health records: {len(health_records)}\n")
            f.write(f"Wellness records: {len(wellness_records)}\n")
            f.write("\n[ReportLab not installed – PDF generation requires 'pip install reportlab']\n")


def generate_report(db: Session, ast: Astronaut, report_type: str = "health_summary", notes: Optional[str] = None) -> Report:
    """Generate a PDF report and persist a Report record."""
    _ensure_reports_dir()

    health_records = (
        db.query(HealthRecord)
        .filter(HealthRecord.astronaut_id == ast.id)
        .order_by(HealthRecord.recorded_at.desc())
        .limit(100)
        .all()
    )
    wellness_records = (
        db.query(WellnessRecord)
        .filter(WellnessRecord.astronaut_id == ast.id)
        .order_by(WellnessRecord.recorded_at.desc())
        .limit(50)
        .all()
    )

    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename  = f"report_{ast.astronaut_id}_{timestamp}.pdf"
    filepath  = os.path.join(REPORTS_DIR, filename)

    _build_pdf(filepath, ast, health_records, wellness_records)

    file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0

    summary = {
        "health_record_count":   len(health_records),
        "wellness_record_count": len(wellness_records),
        "anomaly_count":         sum(1 for r in health_records if r.is_anomaly),
    }

    report = Report(
        astronaut_id = ast.id,
        report_type  = report_type,
        notes        = notes,
        generated_at = datetime.utcnow(),
        file_path    = filepath,
        file_size    = file_size,
        summary_json = json.dumps(summary),
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_reports_for_astronaut(db: Session, astronaut_db_id: int) -> List[Report]:
    return (
        db.query(Report)
        .filter(Report.astronaut_id == astronaut_db_id)
        .order_by(Report.generated_at.desc())
        .all()
    )
