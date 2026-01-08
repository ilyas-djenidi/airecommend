from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse, FileResponse
from typing import List, Optional
from pydantic import BaseModel
import logging
import os
from pathlib import Path

from app.services.map_service import AlgerianWasteMapService, generate_algerian_waste_map
from app.core.supabase import get_supabase_client

router = APIRouter(prefix="/api/maps", tags=["Maps & Visualization"])
logger = logging.getLogger(__name__)

# Shared Optimizer Service for routing
from app.services.optimizer import OptimizerService
optimizer_service = OptimizerService()

# Ensure maps directory exists
MAPS_DIR = Path("generated_maps")
MAPS_DIR.mkdir(exist_ok=True)

class MapGenerationRequest(BaseModel):
    date: Optional[str] = None
    include_zones: bool = True
    include_containers: bool = True
    include_routes: bool = True
    include_wpi: bool = False
    include_tracking: bool = False
    dark_mode: bool = False
    collector_id: Optional[str] = None

@router.post("/generate", response_class=HTMLResponse)
async def generate_map(request: MapGenerationRequest):
    """
    Generate comprehensive waste collection map
    
    Returns HTML map with all requested layers
    """
    logger.info(f"Received map generation request: {request}")
    try:
        supabase = get_supabase_client()
        logger.info(f"Supabase client available: {supabase is not None}")
        
        zones_data = []
        containers_data = []
        routes_data = []
        collectors_data = []
        
        # Fetch zones
        if request.include_zones and supabase:
            try:
                logger.info("Fetching zones...")
                zones_response = supabase.table("zones").select("*").execute()
                zones_data = zones_response.data
                logger.info(f"Fetched {len(zones_data)} zones")
            except Exception as e:
                logger.warning(f"Failed to fetch zones: {e}")
        
        # Fetch containers
        if request.include_containers and supabase:
            try:
                logger.info("Fetching containers...")
                containers_response = supabase.table("containers").select("*").execute()
                containers_data = containers_response.data
                logger.info(f"Fetched {len(containers_data)} containers")
            except Exception as e:
                logger.warning(f"Failed to fetch containers: {e}")
        
        # Fetch routes
        if request.include_routes and supabase:
            try:
                logger.info(f"Fetching routes for date: {request.date}")
                query = supabase.table("routes").select("*, route_stops(*)")
                if request.date:
                    query = query.eq("date", request.date)
                if request.collector_id:
                    query = query.eq("collector_id", request.collector_id)
                
                routes_response = query.execute()
                routes_data = routes_response.data
                logger.info(f"Fetched {len(routes_data)} routes")
            except Exception as e:
                logger.warning(f"Failed to fetch routes: {e}")
        
        # Fetch collectors for tracking
        if request.include_tracking and supabase:
            try:
                logger.info("Fetching collectors...")
                collectors_response = supabase.table("collectors").select("*").execute()
                collectors_data = collectors_response.data
                logger.info(f"Fetched {len(collectors_data)} collectors")
            except Exception as e:
                logger.warning(f"Failed to fetch collectors: {e}")
        
        # Generate WPI data (placeholder - replace with actual predictions)
        wpi_data = []
        if request.include_wpi and containers_data:
            wpi_data = [
                {
                    'lat': c['lat'],
                    'lng': c['lng'],
                    'wpi_score': (c.get('fill_level_percent', 50) / 100)
                }
                for c in containers_data
            ]
        
        # Generate map
        logger.info("Starting Folium map generation...")
        output_file = MAPS_DIR / f"waste_map_{request.date or 'latest'}.html"
        
        # Calculate priority counts for legend
        priority_counts = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
        if containers_data:
            for c in containers_data:
                p = str(c.get('priority', 'MEDIUM')).upper()
                if p in priority_counts:
                    priority_counts[p] += 1
        
        # Create map service instance
        from app.services.map_service import ALGIERS_CENTER
        map_service = AlgerianWasteMapService(center=ALGIERS_CENTER, zoom=10)
        map_service.create_base_map(dark_mode=request.dark_mode)
        
        # Add layers
        if zones_data:
            map_service.add_zones(zones_data)
        if containers_data:
            map_service.add_containers(containers_data, cluster=True)
        if routes_data:
            map_service.add_routes(routes_data, animated=True)
        if wpi_data:
            map_service.add_wpi_heatmap(wpi_data)
        if collectors_data:
            map_service.add_real_time_tracking(collectors_data)
            
        # Add legend with data from DB
        map_service.add_legend({
            f"Critical Priority ({priority_counts['CRITICAL']})": "#dc2626",
            f"High Priority ({priority_counts['HIGH']})": "#ea580c",
            f"Medium Priority ({priority_counts['MEDIUM']})": "#2563eb",
            f"Low Priority ({priority_counts['LOW']})": "#16a34a"
        })
        
        map_path = map_service.save(str(output_file))
        logger.info(f"Folium map generated at: {map_path}")
        
        # Read and return HTML
        with open(map_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        logger.info("Returning HTML response")
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"Map generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Map generation failed: {str(e)}")

@router.get("/view/{filename}", response_class=HTMLResponse)
async def view_saved_map(filename: str):
    """
    View a previously generated map
    """
    file_path = MAPS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Map not found")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    return HTMLResponse(content=html_content)

@router.get("/list")
async def list_saved_maps():
    """
    List all generated maps
    """
    maps = []
    for file in MAPS_DIR.glob("*.html"):
        stat = file.stat()
        maps.append({
            "filename": file.name,
            "created": stat.st_ctime,
            "size_kb": stat.st_size / 1024
        })
    
    return {"maps": maps}

@router.get("/embed/{filename}")
async def get_map_embed_url(filename: str):
    """
    Get embeddable URL for map
    """
    file_path = MAPS_DIR / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Map not found")
    
    return {
        "url": f"/api/maps/view/{filename}",
        "iframe": f'<iframe src="/api/maps/view/{filename}" width="100%" height="600px" frameborder="0"></iframe>'
    }

@router.post("/heatmap", response_class=HTMLResponse)
async def generate_wpi_heatmap():
    """
    Generate standalone WPI heatmap
    """
    try:
        supabase = get_supabase_client()
        
        if not supabase:
            raise HTTPException(
                status_code=503,
                detail="Database not available"
            )
        
        # Fetch container data
        containers_response = supabase.table("containers").select("*").execute()
        containers = containers_response.data
        
        # Generate WPI data
        wpi_data = [
            {
                'lat': c['lat'],
                'lng': c['lng'],
                'wpi_score': (c.get('fill_level_percent', 50) / 100)
            }
            for c in containers
        ]
        
        # Create map with only heatmap
        map_service = AlgerianWasteMapService()
        map_service.create_base_map()
        map_service.add_wpi_heatmap(wpi_data, radius=30)
        
        output_file = MAPS_DIR / "wpi_heatmap.html"
        map_service.save(str(output_file))
        
        with open(output_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        logger.error(f"Heatmap generation failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/export-image")
async def export_map_as_image(filename: str):
    """
    Export map as static image (requires selenium/playwright)
    Note: This is a placeholder - actual implementation needs browser automation
    """
    return {
        "status": "not_implemented",
        "message": "Image export requires browser automation setup",
        "alternative": "Use browser's print-to-PDF or screenshot feature"
    }

@router.get("/route")
async def get_shortest_road_path(
    start_lat: float, start_lng: float, 
    end_lat: float, end_lng: float
):
    """
    Calculate shortest road-aware path between two points in Algiers.
    Returns geometry as a list of lat/lng coordinates.
    """
    try:
        optimizer_service._ensure_graph_loaded()
        if not optimizer_service.graph or not optimizer_service.path_finder:
            raise HTTPException(status_code=503, detail="Road graph not initialized")

        start_node = optimizer_service.graph.get_nearest_node(start_lat, start_lng)
        end_node = optimizer_service.graph.get_nearest_node(end_lat, end_lng)

        if not start_node or not end_node:
            raise HTTPException(status_code=400, detail="Could not snap points to road network")

        path_result = optimizer_service.path_finder.a_star(start_node.id, end_node.id)
        
        if not path_result:
            # Fallback to straight line if no path found
            return {
                "geometry": [
                    {"lat": start_lat, "lng": start_lng},
                    {"lat": end_lat, "lng": end_lng}
                ],
                "distance_km": 0, # unknown
                "fallback": True
            }

        geometry = [{"lat": n.lat, "lng": n.lon} for n in path_result.path_nodes]
        
        return {
            "geometry": geometry,
            "distance_km": round(path_result.distance / 1000, 2),
            "fallback": False
        }

    except Exception as e:
        import traceback
        logger.error(f"Routing error (falling back to straight line) for {start_lat},{start_lng} -> {end_lat},{end_lng}: {e}")
        logger.error(traceback.format_exc())
        return {
            "geometry": [
                {"lat": start_lat, "lng": start_lng},
                {"lat": end_lat, "lng": end_lng}
            ],
            "distance_km": round(((start_lat-end_lat)**2 + (start_lng-end_lng)**2)**0.5 * 111, 2),
            "fallback": True,
            "error": str(e)
        }
