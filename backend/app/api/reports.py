"""
ASTRACARE – Reports API router.
"""

from __future__ import annotations

import os
from typing import Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.astronaut import Astronaut
from app.models.report import Report
from app.services.report_service import generate_report, get_reports_for_astronaut

router = APIRouter()


class ReportGenerateRequest(BaseModel):
    astronaut_id: str
    report_type: str = "full"
    notes: Optional[str] = None


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/", status_code=status.HTTP_200_OK)
def get_all_reports(limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """List all generated reports in the mission database."""
    reports = db.query(Report).order_by(Report.generated_at.desc()).limit(limit).all()
    return {
        "total": len(reports),
        "reports": [
            {
                "id": r.id,
                "astronaut_id": r.astronaut_id,
                "report_type": r.report_type,
                "generated_at": r.generated_at.isoformat(),
                "file_path": r.file_path,
                "file_size": r.file_size,
                "notes": r.notes,
            }
            for r in reports
        ],
    }


@router.post("/generate", status_code=status.HTTP_201_CREATED)
def generate_report_json(payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    """Generate a PDF medical summary report for an astronaut via JSON payload."""
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == payload.astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{payload.astronaut_id}' not found.")

    report = generate_report(db, ast, report_type=payload.report_type, notes=payload.notes)

    return {
        "id": report.id,
        "astronaut_id": report.astronaut_id,
        "report_type": report.report_type,
        "message": "Report generated successfully.",
        "file_path": report.file_path,
        "generated_at": report.generated_at.isoformat(),
    }


@router.post("/generate/{astronaut_id}", status_code=status.HTTP_201_CREATED)
def create_report_path(astronaut_id: str, db: Session = Depends(get_db)):
    """Generate a comprehensive health & wellness PDF report for an astronaut by path parameter."""
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    report = generate_report(db, ast)
    return {
        "id": report.id,
        "astronaut_id": report.astronaut_id,
        "report_type": report.report_type,
        "message": "Report generated successfully.",
        "file_path": report.file_path,
        "generated_at": report.generated_at.isoformat(),
    }


@router.get("/download/{report_id}")
@router.get("/{report_id}/download")
def download_report(report_id: int, db: Session = Depends(get_db)):
    """Download a generated PDF report by its ID."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail=f"Report {report_id} not found.")

    if not report.file_path or not os.path.exists(report.file_path):
        raise HTTPException(status_code=404, detail="Report file not found on server.")

    return FileResponse(
        path=report.file_path,
        media_type="application/pdf",
        filename=os.path.basename(report.file_path),
    )


@router.get("/{astronaut_id}")
def list_reports(astronaut_id: str, db: Session = Depends(get_db)):
    """List all reports generated for an astronaut."""
    ast = db.query(Astronaut).filter(Astronaut.astronaut_id == astronaut_id.upper()).first()
    if not ast:
        raise HTTPException(status_code=404, detail=f"Astronaut '{astronaut_id}' not found.")

    reports = get_reports_for_astronaut(db, ast.id)
    return {
        "astronaut_id": astronaut_id,
        "total": len(reports),
        "reports": [
            {
                "id": r.id,
                "report_type": r.report_type,
                "generated_at": r.generated_at.isoformat(),
                "file_path": r.file_path,
                "file_size": r.file_size,
            }
            for r in reports
        ],
    }
