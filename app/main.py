from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, RedirectResponse
import logging

from app.core.config import settings
from app.core.logging import setup_logging, request_id_ctx
from app.schemas.models import OptimizationRequest, OptimizationResponse
from app.services.optimizer import OptimizerService
from app.services.traffic import TrafficService
import uuid

# Setup Logging
setup_logging(settings.LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    req_id = str(uuid.uuid4())
    token = request_id_ctx.set(req_id)
    try:
        response = await call_next(request)
        response.headers["X-Request-ID"] = req_id
        return response
    finally:
        request_id_ctx.reset(token)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": settings.VERSION}

@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

# Register API routers
from app.api.composition import router as composition_router
app.include_router(composition_router, tags=["Composition Analysis"])

from app.api.sngid import router as sngid_router
app.include_router(sngid_router)

@app.post("/optimize-day", response_model=OptimizationResponse)
def optimize_day(request: OptimizationRequest):
    logger.info(f"Received optimization request for {request.date} with {len(request.containers)} containers")
    
    if not request.containers:
        logger.warning("Request validation failed: No containers")
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "No containers provided", "date": request.date, "routes": []}
        )

    if not request.collectors:
        logger.warning("Request validation failed: No collectors")
        return JSONResponse(
            status_code=400,
            content={"status": "error", "message": "No collectors provided", "date": request.date, "routes": []}
        )
    
    try:
        optimizer = OptimizerService()
        routes, warnings = optimizer.optimize(request)
        
        # Traffic Advice
        advice = TrafficService.generate_advice(routes, request.date)
        
        response = OptimizationResponse(
            status="ok",
            date=request.date,
            routes=routes,
            traffic_advice=[advice],
            unassigned=[],
            warnings=warnings
        )
        
        logger.info(f"Optimization completed. Generated {len(routes)} routes.")
        return response

    except Exception as e:
        logger.error(f"Unexpected error during optimization: {e}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": f"Internal Server Error: {str(e)}", 
                "date": request.date
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
