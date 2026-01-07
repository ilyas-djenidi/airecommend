"""
Composition Analysis API Endpoint
Exposes the composition-based WPI scoring system
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Literal

from app.services.composition_scoring import calculate_composition_wpi

router = APIRouter()

class CompositionAnalysisRequest(BaseModel):
    date: str
    zone_name: str = "National Baseline"
    bioclimatic_zone: Optional[Literal["NORTHERN_COASTAL", "HIGH_PLATEAU", "SAHARAN"]] = None
    days_since_collection: int = 1
    is_scheduled: bool = True

class CompositionAnalysisResponse(BaseModel):
    date: str
    zone: str
    wpi_score: float
    organic_pct: float
    plastic_pct: float
    paper_pct: float
    metals_pct: float
    textiles_pct: float
    glass_pct: float
    other_pct: float
    density_kg_m3: float
    explanation_en: str
    explanation_ar: str
    explanation_fr: str

@router.post("/composition-analysis", response_model=CompositionAnalysisResponse)
def analyze_composition(request: CompositionAnalysisRequest):
    """
    Analyze waste composition and calculate WPI score with trilingual explanations.
    Based on AND 2018-2019 national characterization study.
    """
    wpi_result = calculate_composition_wpi(
        date_str=request.date,
        zone_name=request.zone_name,
        bioclimatic_zone=request.bioclimatic_zone,
        days_since_collection=request.days_since_collection,
        is_scheduled=request.is_scheduled
    )
    
    profile = wpi_result.composition_profile
    
    return CompositionAnalysisResponse(
        date=request.date,
        zone=request.zone_name,
        wpi_score=wpi_result.total_score,
        organic_pct=profile.organic_pct,
        plastic_pct=profile.plastic_pct,
        paper_pct=profile.paper_pct,
        metals_pct=profile.metals_pct,
        textiles_pct=profile.textiles_pct,
        glass_pct=profile.glass_pct,
        other_pct=profile.other_pct,
        density_kg_m3=profile.density_kg_m3,
        explanation_en=wpi_result.explanation_en,
        explanation_ar=wpi_result.explanation_ar,
        explanation_fr=wpi_result.explanation_fr
    )
