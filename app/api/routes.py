from fastapi import APIRouter, HTTPException, Depends, Header
from typing import List, Optional
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
from supabase import Client
from datetime import datetime

router = APIRouter(prefix="/routes", tags=["Routing"])

class RouteRequest(BaseModel):
    wilaya_code: str
    start_point: dict # {lat, lon}
    end_point: dict # {lat, lon}
    optimize_stops: bool = True

@router.post("/calculate")
async def calculate_route(
    req: RouteRequest,
    x_wilaya_code: Optional[str] = Header(None, alias="X-Wilaya-Code"),
    supabase: Client = Depends(get_supabase_client)
):
    # Algerian Context Logic
    wilaya = x_wilaya_code or req.wilaya_code
    
    # 1. Fetch Algerian Road Graph Metadata for Wilaya (Mocking the complex graph logic linkage for now)
    # In a full implementation, this calls app.routing.optimization.engine
    
    # Check for Prayer Times (Mock)
    current_hour = datetime.now().hour
    is_prayer_time = False 
    # Example logic: if 12:00-13:00 on Friday
    if datetime.now().weekday() == 4 and 12 <= current_hour < 14:
        is_prayer_time = True

    route_data = {
        "distance_km": 12.5,
        "duration_min": 25,
        "geometry": [], # GeoJSON LineString
        "warnings": []
    }

    if is_prayer_time:
        route_data["duration_min"] += 15 # Add delay
        route_data["warnings"].append("Includes Friday Prayer traffic adjustment")

    # 2. Log request to Supabase (Analytics)
    # supabase.table('route_requests').insert({...})

    return {
        "status": "success",
        "route": route_data,
        "context": {
            "wilaya": wilaya,
            "prayer_time_active": is_prayer_time
        }
    }

@router.post("/optimize-fleet")
async def optimize_fleet(supabase: Client = Depends(get_supabase_client)):
    # Trigger heavy calculation
    return {"status": "processing", "task_id": "job_123"}
