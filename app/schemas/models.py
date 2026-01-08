from pydantic import BaseModel, Field, validator, model_validator
from typing import List, Optional, Literal, Dict, Any

# --- Common ---

class WarningCode(BaseModel):
    code: str
    message: str

class Coordinates(BaseModel):
    lat: float
    lng: float

class Depot(Coordinates):
    id: str

class Collector(BaseModel):
    id: str
    start_lat: float
    start_lng: float
    shift_start: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")
    shift_end: str = Field(..., pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$")

class Container(Coordinates):
    id: str

class UnassignedContainer(BaseModel):
    container_id: str
    reason: str

# --- Output Components ---

class Stop(BaseModel):
    container_id: str
    seq: int
    lat: float
    lng: float
    eta: str
    traffic_level: Literal["low", "medium", "high"]
    geometry: Optional[List[Coordinates]] = None  # Lat/lng path for the leg leading to this stop

class RouteSummary(BaseModel):
    total_travel_min: int
    total_service_min: int
    total_min: int
    distance_km: float
    overflow_min: int = 0
    finish_time: Optional[str] = None

class Route(BaseModel):
    collector_id: str
    stops: List[Stop]
    summary: RouteSummary
    geometry: Optional[List[Coordinates]] = None  # Full flattened path geometry for the entire route

class AffectedLeg(BaseModel):
    from_id: str
    to_id: str
    traffic_level: str

class TrafficAdvice(BaseModel):
    recommendation_ar: str
    recommendation_en: str
    affected_legs: List[AffectedLeg] = []

# --- API ---

class OptimizationRequest(BaseModel):
    date: str
    depot: Depot
    collectors: List[Collector]
    containers: List[Container]

class OptimizationResponse(BaseModel):
    status: Literal["ok", "error"]
    date: str
    routes: List[Route] = []
    traffic_advice: List[TrafficAdvice] = []
    unassigned: List[UnassignedContainer] = []
    # New top-level warnings
    warnings: List[WarningCode] = []
    error_message: Optional[str] = None
