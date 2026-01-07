from fastapi import APIRouter, HTTPException, Depends
from app.core.supabase import get_supabase_client
from supabase import Client

router = APIRouter(prefix="/municipal", tags=["Municipal Governance"])

@router.get("/performance/{wilaya_code}")
async def get_municipal_performance(
    wilaya_code: str, 
    supabase: Client = Depends(get_supabase_client)
):
    # Get SNGID metrics
    res = supabase.table('municipal_metrics')\
        .select('*')\
        .eq('wilaya_code', wilaya_code)\
        .order('date', desc=True)\
        .limit(1)\
        .execute()
        
    if not res.data:
        # Return default structure if no data
        return {
            "wilaya_code": wilaya_code,
            "collection_coverage": 0,
            "cost_recovery_rate": 0,
            "landfill_diversion_rate": 0,
            "zpi_score": 0
        }
        
    return res.data[0]

@router.post("/reports/generate")
async def generate_sngid_report(wilaya_code: str, report_type: str = "monthly"):
    return {
        "status": "generated",
        "url": "https://reports.waste-algeria.dz/2024/05/16_monthly.pdf"
    }
