from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
import logging
from datetime import date

router = APIRouter(prefix="/api/planner", tags=["Planner"])
logger = logging.getLogger(__name__)

class StopCreate(BaseModel):
    seq: int = 0 # Front-end uses 'seq'
    container_id: str
    lat: float
    lng: float
    eta: str
    travel_min: float
    service_min: float
    traffic_level: str

class RouteCreate(BaseModel):
    collector_id: str
    stops: List[dict]
    summary: dict
    geometry: Optional[List[dict]] = None

class PlanPublishRequest(BaseModel):
    date: str
    routes: List[RouteCreate]

@router.post("/publish")
async def publish_plan(plan: PlanPublishRequest):
    """Save a generated plan to the database"""
    supabase = get_supabase_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database service unavailable")
    
    try:
        # 1. Clean up existing routes for this date
        # (This avoids duplicates if they publish again)
        # Note: We don't delete ALL routes, maybe just for the collectors in this plan?
        # For simplicity, let's delete all for this specific date if it's a "master" publish.
        collector_ids = [r.collector_id for r in plan.routes]
        
        # We delete routes for these collectors on this date
        supabase.table("routes").delete().eq("date", plan.date).in_("collector_id", collector_ids).execute()
        
        # 2. Insert new routes and their stops
        for route_data in plan.routes:
            # Create a very minimal Route row first to be safe
            route_row = {
                "date": plan.date,
                "collector_id": route_data.collector_id,
                "summary": route_data.summary # User schema uses a 'summary' JSONB/Text column
            }
            
            if route_data.geometry:
                route_row["geometry"] = route_data.geometry
            
            try:
                res = supabase.table("routes").insert(route_row).execute()
            except Exception as e:
                if "PGRST204" in str(e) or "column" in str(e).lower():
                    logger.warning(f"Fallback to even more minimal insert due to: {e}")
                    # Remove anything that might be causing it
                    route_row.pop("summary", None)
                    route_row.pop("geometry", None)
                    res = supabase.table("routes").insert(route_row).execute()
                else:
                    raise e
                    
            if not res.data:
                continue
            
            route_id = res.data[0]["id"]
            
            # Create Stops rows
            stop_rows = []
            for i, stop in enumerate(route_data.stops):
                stop_rows.append({
                    "route_id": route_id,
                    "seq": i + 1, # Use 1-based seq for DB stability, or stop.get('seq')
                    "container_id": stop.get("container_id"),
                    "lat": stop.get("lat"),
                    "lng": stop.get("lng"),
                    "eta": stop.get("eta")
                })
            
            if stop_rows:
                try:
                    # In your DB, 'seq' is the confirmed column name and it is NOT NULL
                    supabase.table("route_stops").insert(stop_rows).execute()
                except Exception as e:
                    logger.error(f"Failed to insert route stops: {e}")
                    # If 'seq' fails, it might be 'sequence' after all? 
                    # But check_schema said 'seq' exists and 'sequence' is missing.
                    if "seq" in str(e).lower() and "PGRST204" in str(e):
                         for row in stop_rows:
                            row["sequence"] = row.pop("seq")
                         supabase.table("route_stops").insert(stop_rows).execute()
                    else:
                        raise e
                
        return {"status": "success", "message": f"Published {len(plan.routes)} routes for {plan.date}"}
        
    except Exception as e:
        logger.error(f"Failed to publish plan: {e}")
        raise HTTPException(status_code=500, detail=str(e))
