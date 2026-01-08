from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
from typing import Optional

router = APIRouter(prefix="/api/collectors", tags=["Collector Authentication"])

class CollectorLoginRequest(BaseModel):
    collector_id: str
    password: str

class CollectorLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    collector: dict

@router.post("/login", response_model=CollectorLoginResponse)
async def collector_login(credentials: CollectorLoginRequest):
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(
            status_code=503, 
            detail="Database service unavailable"
        )
    
    try:
        # Fetch collector by ID
        result = supabase.table("collectors").select("*").eq("id", credentials.collector_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=401, detail="Invalid collector ID")
            
        collector = result.data[0]
        
        # Verify password (simplified for now, ideally hashed)
        # Note: If password is NULL in DB, we allow login if it matches some default or we block it
        db_password = collector.get('password')
        if not db_password or db_password != credentials.password:
             raise HTTPException(status_code=401, detail="Invalid password")

        return CollectorLoginResponse(
            access_token=f"collector_token_{collector['id']}", # Simplified token
            collector={
                "id": collector['id'],
                "name": collector.get('name', collector['id']),
                "role": "driver"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
