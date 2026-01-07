import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils import haversine_km, minutes_to_time_str, time_str_to_minutes
from app.services.traffic import TrafficService

# Updated imports to match new structure

client = TestClient(app)

def test_haversine():
    dist = haversine_km(48.8566, 2.3522, 51.5074, -0.1278)
    assert 340 < dist < 350

def test_time_conversions():
    assert time_str_to_minutes("08:30") == 8 * 60 + 30
    assert minutes_to_time_str(510) == "08:30"

def test_traffic_multiplier():
    # Use new service
    ts = TrafficService()
    assert ts.get_traffic_multiplier(9 * 60) == 1.5
    assert ts.get_traffic_multiplier(12 * 60) == 1.2
    assert ts.get_traffic_multiplier(14 * 60) == 1.0

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_optimize_day_empty_containers():
    payload = {
        "date": "2023-10-27",
        "depot": {"id": "D1", "lat": 36.75, "lng": 3.05},
        "collectors": [{"id": "C1", "start_lat": 36.75, "start_lng": 3.05, "shift_start": "08:00", "shift_end": "16:00"}],
        "containers": []
    }
    response = client.post("/optimize-day", json=payload)
    assert response.status_code == 400
    assert response.json()["status"] == "error"
