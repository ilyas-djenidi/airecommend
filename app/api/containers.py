from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
import logging

router = APIRouter(prefix="/api/containers", tags=["Containers"])
logger = logging.getLogger(__name__)

# Pydantic Models
class ContainerBase(BaseModel):
    id: str
    zone_id: str
    lat: float
    lng: float
    priority: Optional[str] = "MEDIUM"
    capacity_liters: Optional[int] = 1100
    type: Optional[str] = "standard"
    address: Optional[str] = None
    status: Optional[str] = "active"
    fill_level_percent: Optional[int] = 0
    notes: Optional[str] = None

class ContainerCreate(ContainerBase):
    pass

class ContainerUpdate(BaseModel):
    zone_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    priority: Optional[str] = None
    capacity_liters: Optional[int] = None
    type: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
    fill_level_percent: Optional[int] = None
    notes: Optional[str] = None

class Container(ContainerBase):
    last_collection: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

@router.get("", response_model=List[Container])
async def list_containers(zone_id: Optional[str] = None):
    """Get all containers, optionally filtered by zone"""
    supabase = get_supabase_client()
    
    if not supabase:
        logger.warning("Supabase not configured - returning empty containers list")
        return []
    
    try:
        query = supabase.table("containers").select("*")
        
        if zone_id:
            query = query.eq("zone_id", zone_id)
        
        response = query.execute()
        return response.data
    except Exception as e:
        logger.error(f"Failed to fetch containers: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("", response_model=Container, status_code=status.HTTP_201_CREATED)
async def create_container(container: ContainerCreate):
    """Create a new container"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(
            status_code=503,
            detail="Database not configured - cannot create containers"
        )
    
    try:
        # Check if container with same ID exists
        existing = supabase.table("containers").select("id").eq("id", container.id).execute()
        if existing.data:
            raise HTTPException(
                status_code=400,
                detail=f"Container with ID '{container.id}' already exists"
            )
        
        # Verify zone exists
        zone_check = supabase.table("zones").select("id").eq("id", container.zone_id).execute()
        if not zone_check.data:
            raise HTTPException(
                status_code=400,
                detail=f"Zone '{container.zone_id}' does not exist"
            )
        
        # Insert container
        response = supabase.table("containers").insert(container.model_dump()).execute()
        
        if not response.data or len(response.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create container")
        
        logger.info(f"Container created successfully: {response.data[0]['id']}")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create container: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{container_id}", response_model=Container)
async def get_container(container_id: str):
    """Get a specific container by ID"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("containers").select("*").eq("id", container_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch container: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.put("/{container_id}", response_model=Container)
async def update_container(container_id: str, container: ContainerUpdate):
    """Update a container"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        # Only update fields that are provided
        update_data = {k: v for k, v in container.model_dump().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # If zone_id is being updated, verify it exists
        if "zone_id" in update_data:
            zone_check = supabase.table("zones").select("id").eq("id", update_data["zone_id"]).execute()
            if not zone_check.data:
                raise HTTPException(
                    status_code=400,
                    detail=f"Zone '{update_data['zone_id']}' does not exist"
                )
        
        response = supabase.table("containers").update(update_data).eq("id", container_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update container: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{container_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_container(container_id: str):
    """Delete a container"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        response = supabase.table("containers").delete().eq("id", container_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete container: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.patch("/{container_id}/status")
async def update_container_status(container_id: str, status_val: str, fill_level: Optional[int] = None):
    """Quick update for container status and fill level"""
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(status_code=503, detail="Database not configured")
    
    try:
        update_data = {"status": status_val}
        if fill_level is not None:
            update_data["fill_level_percent"] = fill_level
        
        response = supabase.table("containers").update(update_data).eq("id", container_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail=f"Container '{container_id}' not found")
        
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update container status: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
