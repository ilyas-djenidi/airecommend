from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from app.core.supabase import get_supabase_client
from supabase import Client

router = APIRouter(prefix="/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

@router.post("/login", response_model=LoginResponse)
async def login(credentials: LoginRequest):
    supabase = get_supabase_client()
    
    if not supabase:
        raise HTTPException(
            status_code=503, 
            detail="Authentication service unavailable - Supabase not configured"
        )
    
    try:
        # Utilize Supabase Auth
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email, 
            "password": credentials.password
        })
        
        if not res.user:
             raise HTTPException(status_code=401, detail="Invalid credentials")

        return LoginResponse(
            access_token=res.session.access_token,
            user={
                "id": str(res.user.id),
                "email": res.user.email,
                "role": res.user.user_metadata.get('role', 'driver')
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
