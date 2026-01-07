from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
import logging

router = APIRouter(prefix="/api/zones", tags=["Zones"])
logger = logging.getLogger(__name__)

# Pydantic Models
class ZoneBase(BaseModel):
    id: str
    name: str
    category: str
    priority: str
    priority_score: Optional[int] = 3
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    population: Optional[int] = None
    area_km2: Optional[float] = None
    notes: Optional[str] = None

class ZoneCreate(ZoneBase):
    pass

class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    priority_score: Optional[int] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    population: Optional[int] = None
    area_km2: Optional[float] = None
    notes: Optional[str] = None

class Zone(ZoneBase):
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

@router.get("", response_model=List[Zone])
async def list_zones():
    """Get all zones"""
    supabase = get_supabase_client()
    
    if not supabase:
        # Fallback: return empty list if Supabase not configured
        logger.warning("Supabase not configured - returning empty zones list")
        return []
    
    try:
        response = supabase.table("zones").select("*").execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch zones: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("", response_model=Zone, status_code=status.HTTP_201_CREATED)
async def create_zone(zone: ZoneCreate):
    """Create a new zone"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured - cannot create zones"
        )
    
    try:
        # Check if zone with same ID exists
        existing = supabase.table("zones").select("id").eq("id", zone.id).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail=f"Zone with ID '{zone.id}' already exists"
            )
        
        # Insert zone
        response = supabase.table("zones").insert(zone.model_dump()).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create zone")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create zone: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{zone_id}", response_model=Zone)
async def get_zone(zone_id: str):
    """Get a specific zone by ID"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("zones").select("*").eq("id", zone_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch zone: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{zone_id}", response_model=Zone)
async def update_zone(zone_id: str, zone: ZoneUpdate):
    """Update a zone"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Only update fields that are provided
        update_data = {k: v for k, v in zone.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        response = supabase.table("zones").update(update_data).eq("id", zone_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update zone: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_zone(zone_id: str):
    """Delete a zone (cascades to containers)"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("zones").delete().eq("id", zone_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Zone '{zone_id}' not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete zone: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{zone_id}/containers")
async def get_zone_containers(zone_id: str):
    """Get all containers in a specific zone"""
    supabase = get_supabase_client()
    
    if not supabase:
        return []
    
    try:
        response = supabase.table("containers").select("*").eq("zone_id", zone_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch zone containers: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
