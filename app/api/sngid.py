from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import random

router = APIRouter(prefix="/sngid", tags=["SNGID 2035 Innovation"])

# --- Models ---

class MarketplaceItem(BaseModel):
    tons: float
    value_dzd: float
    currency: str = "DZD"

class MarketplaceForecast(BaseModel):
    plastic: MarketplaceItem
    paper: MarketplaceItem
    metals: MarketplaceItem
    total_value_dzd: float

class ZonePerformance(BaseModel):
    zone_id: str
    name: str
    score: int
    grade: str # A, B, C
    issues: List[str]

# --- Endpoints ---

@router.get("/marketplace/forecast", response_model=MarketplaceForecast)
async def get_marketplace_forecast():
    """
    Returns the economic forecast for recoverable materials.
    Concept: SNGID Idea #6 (Recyclables Marketplace) & #4 (Demand-Driven)
    """
    # Simulated forecast based on "next 7 days"
    plastic_tons = 12.5
    paper_tons = 8.2
    metals_tons = 3.1
    
    val_p = plastic_tons * 45000
    val_pa = paper_tons * 12000
    val_m = metals_tons * 180000
    
    return MarketplaceForecast(
        plastic=MarketplaceItem(tons=plastic_tons, value_dzd=val_p),
        paper=MarketplaceItem(tons=paper_tons, value_dzd=val_pa),
        metals=MarketplaceItem(tons=metals_tons, value_dzd=val_m),
        total_value_dzd=val_p + val_pa + val_m
    )

@router.get("/zones/performance", response_model=List[ZonePerformance])
async def get_zone_performance():
    """
    Returns the performance score for each zone/municipality.
    Concept: SNGID Idea #2 (Municipality Maturity Scoring)
    """
    # Mock data for demonstration
    zones = [
        {"id": "ZN-01", "name": "Casbah Center"},
        {"id": "ZN-02", "name": "Bab Ezzouar Ind"},
        {"id": "ZN-03", "name": "El Biar Res"},
    ]
    
    results = []
    for z in zones:
        score = random.randint(60, 98)
        grade = "A" if score > 90 else "B" if score > 75 else "C"
        issues = []
        if score < 80:
            issues.append("High Contamination Rate")
        if score < 70:
            issues.append("Missed Collections")
            
        results.append(ZonePerformance(
            zone_id=z["id"],
            name=z["name"],
            score=score,
            grade=grade,
            issues=issues
        ))
    
    # Sort by score desc (Leaderboard)
    results.sort(key=lambda x: x.score, reverse=True)
    return results
