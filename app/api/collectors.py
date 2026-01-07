from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
import logging
from datetime import date

router = APIRouter(prefix="/api/collectors", tags=["Collectors"])
logger = logging.getLogger(__name__)

# Pydantic Models
class CollectorBase(BaseModel):
    id: str
    name: str
    phone: Optional[str] = None
    truck_id: Optional[str] = None
    truck_capacity_kg: Optional[int] = 5000
    status: Optional[str] = "available"
    shift_start: Optional[str] = "08:00"
    shift_end: Optional[str] = "16:00"
    avg_speed_kmh: Optional[float] = 25.0

class CollectorCreate(CollectorBase):
    user_id: Optional[str] = None

class CollectorUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    truck_id: Optional[str] = None
    truck_capacity_kg: Optional[int] = None
    status: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    shift_start: Optional[str] = None
    shift_end: Optional[str] = None
    avg_speed_kmh: Optional[float] = None

class Collector(CollectorBase):
    user_id: Optional[str] = None
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

@router.get("", response_model=List[Collector])
async def list_collectors(status_filter: Optional[str] = None):
    """Get all collectors, optionally filtered by status"""
    supabase = get_supabase_client()
    
    if not supabase:
        logger.warning("Supabase not configured - returning empty collectors list")
        return []
    
    try:
        query = supabase.table("collectors").select("*")
        
        if status_filter:
            query = query.eq("status", status_filter)
        
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch collectors: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("", response_model=Collector, status_code=status.HTTP_201_CREATED)
async def create_collector(collector: CollectorCreate):
    """Create a new collector"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured - cannot create collectors"
        )
    
    try:
        # Check if collector with same ID exists
        existing = supabase.table("collectors").select("id").eq("id", collector.id).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail=f"Collector with ID '{collector.id}' already exists"
            )
        
        # Insert collector
        response = supabase.table("collectors").insert(collector.model_dump()).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create collector")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create collector: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{collector_id}", response_model=Collector)
async def get_collector(collector_id: str):
    """Get a specific collector by ID"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("collectors").select("*").eq("id", collector_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Collector '{collector_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch collector: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{collector_id}", response_model=Collector)
async def update_collector(collector_id: str, collector: CollectorUpdate):
    """Update a collector"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Only update fields that are provided
        update_data = {k: v for k, v in collector.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("collectors").update(update_data).eq("id", collector_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Collector '{collector_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update collector: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{collector_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collector(collector_id: str):
    """Delete a collector"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("collectors").delete().eq("id", collector_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Collector '{collector_id}' not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete collector: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.patch("/{collector_id}/location")
async def update_collector_location(collector_id: str, lat: float, lng: float):
    """Update collector's current location (for real-time tracking)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("collectors").update({
            "current_lat": lat,
            "current_lng": lng
        }).eq("id", collector_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Collector '{collector_id}' not found")
        
        return {"status": "ok", "collector_id": collector_id, "lat": lat, "lng": lng}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update collector location: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{collector_id}/routes")
async def get_collector_routes(collector_id: str, date_filter: Optional[str] = None):
    """Get routes assigned to a collector, optionally for a specific date"""
    supabase = get_supabase_client()
    
    if not supabase:
        return []
    
    try:
        query = supabase.table("routes").select("*, route_stops(*)").eq("collector_id", collector_id)
        
        if date_filter:
            query = query.eq("date", date_filter)
        else:
            # Default to today
            today = date.today().isoformat()
            query = query.eq("date", today)
        
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch collector routes: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{collector_id}/today")
async def get_collector_today_route(collector_id: str):
    """Get today's route for a collector (convenience endpoint for mobile app)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        today = date.today().isoformat()
        
        response = supabase.table("routes").select("*, route_stops(*)").eq("collector_id", collector_id).eq("date", today).execute()
        
        if not response.data:
            return {"message": "No route assigned for today", "date": today}
        
        return response.data[0]
    except Exception as e:
        logger.error(f"Failed to fetch today's route: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
