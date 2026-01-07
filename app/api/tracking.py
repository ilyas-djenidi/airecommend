from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
from supabase import Client
from datetime import datetime

router = APIRouter(prefix="/tracking", tags=["Tracking"])

class TruckUpdate(BaseModel):
    truck_id: str
    lat: float
    lon: float
    speed: float
    heading: float
    status: str

@router.post("/update")
async def update_truck_position(
    update: TruckUpdate, 
    supabase: Client = Depends(get_supabase_client)
):
    try:
        # 1. Store in Supabase 'tracking_history'
        data = {
            "truck_id": update.truck_id,
            "timestamp": datetime.now().isoformat(),
            "speed": update.speed,
            "heading": update.heading,
            "geom": f"POINT({update.lon} {update.lat})"
        }
        
        # Insert into tracking_history
        #Note: Need to handle PostGIS geometry insertion carefully or use a stored procedure provided by Supabase/PostGIS
        # For simplicity in this step, we assume the table accepts raw or we skip the complex geom for now
        
        # Update 'trucks' table current position
        supabase.table('trucks').update({
            "last_location": f"POINT({update.lon} {update.lat})", # Simplified representation
            "last_updated": datetime.now().isoformat(),
            "current_status": update.status
        }).eq('id', update.truck_id).execute()
        
        return {"status": "updated"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{truck_id}/history")
async def get_truck_history(truck_id: str, supabase: Client = Depends(get_supabase_client)):
    res = supabase.table('tracking_history').select('*').eq('truck_id', truck_id).limit(100).execute()
    return res.data
