import logging
import time
import requests
from abc import ABC, abstractmethod
from typing import List, Tuple, Dict, NamedTuple
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import settings
from app.utils import haversine_km
from app.core.logging import get_logger

logger = get_logger(__name__)

@dataclass
class Point:
    id: str
    lat: float
    lng: float

class MatrixResult(NamedTuple):
    durations_min: List[List[int]]  # NxN matrix
    distances_km: List[List[float]] # NxN matrix
    provider_name: str

class BaseRoutingProvider(ABC):
    @abstractmethod
    def get_matrix(self, points: List[Point]) -> MatrixResult:
        pass

class HaversineProvider(BaseRoutingProvider):
    """
    Default fallback provider using Haversine distance and constant speed.
    O(N^2) complexity, purely local.
    """
    def __init__(self, speed_kmh: float = settings.AVG_SPEED_KMH):
        self.speed_kmh = speed_kmh

    def get_matrix(self, points: List[Point]) -> MatrixResult:
        n = len(points)
        dists = [[0.0] * n for _ in range(n)]
        durs = [[0] * n for _ in range(n)]
        
        for i in range(n):
            for j in range(n):
                if i == j:
                    continue
                dist = haversine_km(points[i].lat, points[i].lng, points[j].lat, points[j].lng)
                dists[i][j] = dist
                # simple travel time: (dist / speed) * 60
                durs[i][j] = int((dist / self.speed_kmh) * 60)
        
        return MatrixResult(durs, dists, "HaversineProvider")

class OSRMProvider(BaseRoutingProvider):
    """
    OSRM Provider using the Table service.
    """
    def __init__(self, base_url: str, timeout: float = 2.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def get_matrix(self, points: List[Point]) -> MatrixResult:
        # OSRM Table API URL format: /table/v1/driving/{lon},{lat};{lon},{lat}?annotations=duration,distance
        coords = ";".join([f"{p.lng},{p.lat}" for p in points])
        url = f"{self.base_url}/table/v1/driving/{coords}"
        params = {"annotations": "duration,distance"}
        
        try:
            # Simple retry mechanism
            for attempt in range(1, 3):
                try:
                    resp = requests.get(url, params=params, timeout=self.timeout)
                    resp.raise_for_status()
                    data = resp.json()
                    if data.get("code") != "Ok":
                        raise ValueError(f"OSRM Error: {data.get('code')}")
                    
                    # Parse duration (seconds) -> minutes
                    durations_seconds = data["durations"]
                    durations_min = []
                    for row in durations_seconds:
                        # OSRM returns None if no route found? usually high value or null.
                        # We assume connected graph for now.
                        durations_min.append([int(x / 60) if x is not None else 9999 for x in row])
                    
                    # Parse distance (meters) -> km
                    distances_meters = data["distances"]
                    distances_km = []
                    for row in distances_meters:
                        distances_km.append([x / 1000.0 if x is not None else 9999.0 for x in row])

                    return MatrixResult(durations_min, distances_km, "OSRMProvider")
                
                except requests.RequestException as e:
                    if attempt == 2:
                        raise e
                    time.sleep(0.5)
            
        except Exception as e:
            logger.warning(f"OSRM failed: {e}. Falling back to Haversine.")
            # Fallback
            return HaversineProvider().get_matrix(points)
        
        # Should not reach here
        return HaversineProvider().get_matrix(points)

def get_routing_provider() -> BaseRoutingProvider:
    if settings.OSRM_BASE_URL:
        return OSRMProvider(settings.OSRM_BASE_URL, settings.OSRM_TIMEOUT_SEC)
    return HaversineProvider()
