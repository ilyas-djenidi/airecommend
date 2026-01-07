from fastapi import APIRouter, HTTPException, Depends, Path
from app.core.supabase import get_supabase_client
from supabase import Client
from app.waste_intelligence.indices import WastePressureIndexCalculator

router = APIRouter(prefix="/waste", tags=["Waste Intelligence"])

@router.get("/pressure-index/{zone_id}")
async def get_waste_pressure_index(
    zone_id: str = Path(..., title="Zone ID"),
    supabase: Client = Depends(get_supabase_client)
):
    # Fetch real zone state from Supabase (mocked query for now)
    # zone_data = supabase.table('waste_points').select('*').eq('zone_id', zone_id).execute()
    
    # Calculate WPI
    calculator = WastePressureIndexCalculator()
    # Mock current state
    mock_state = {
        'fill_level': 0.8,
        'temperature': 30, # Algerian summer
        'is_special_event': False # Check if Ramadan
    }
    
    import datetime
    wpi = calculator.calculate_wpi(mock_state, datetime.datetime.now())
    
    return {
        "zone_id": zone_id,
        "wpi": wpi,
        "context": "Algerian Summer Adjustment"
    }

@router.get("/forecast/{wilaya_code}")
async def get_waste_forecast(wilaya_code: str):
    # Call predictions logic
    return {
        "wilaya_code": wilaya_code,
        "forecast_tons": 1250,
        "trend": "increasing", # e.g. Pre-Ramadan spike
        "confidence": 0.85
    }
