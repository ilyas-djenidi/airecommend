import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.optimizer import OptimizerService
from app.schemas.models import OptimizationRequest, Depot, Collector, Container

client = TestClient(app)

# Mock Data
SAMPLE_REQUEST = {
    "date": "2023-11-20",
    "depot": {"id": "D1", "lat": 36.75, "lng": 3.05},
    "collectors": [
        {"id": "C1", "start_lat": 36.75, "start_lng": 3.05, "shift_start": "08:00", "shift_end": "16:00"},
        {"id": "C2", "start_lat": 36.78, "start_lng": 3.08, "shift_start": "09:00", "shift_end": "17:00"}
    ],
    "containers": [
        {"id": "BIN_1", "lat": 36.751, "lng": 3.051}, # Near C1
        {"id": "BIN_2", "lat": 36.781, "lng": 3.081}, # Near C2
        {"id": "BIN_3", "lat": 36.752, "lng": 3.052}  # Near C1
    ]
}

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_optimize_day_multi_collector():
    response = client.post("/optimize-day", json=SAMPLE_REQUEST)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert len(data["routes"]) == 2
    
    # Check assignments (Naive heuristic expectation: BIN_1, BIN_3 -> C1, BIN_2 -> C2)
    r1 = next(r for r in data["routes"] if r["collector_id"] == "C1")
    r2 = next(r for r in data["routes"] if r["collector_id"] == "C2")
    
    assert len(r1["stops"]) == 2
    assert len(r2["stops"]) == 1
    
    # Check BIN_2 is in C2
    assert r2["stops"][0]["container_id"] == "BIN_2"

def test_shift_overflow_warning():
    # Construct a request that definitely overflows
    # 2 containers very far away
    req = SAMPLE_REQUEST.copy()
    req["collectors"] = [{"id": "C_LONG", "start_lat": 36.75, "start_lng": 3.05, "shift_start": "08:00", "shift_end": "08:10"}] # 10 min shift
    req["containers"] = [{"id": "BIN_FAR", "lat": 37.00, "lng": 3.50}] # Far away
    
    response = client.post("/optimize-day", json=req)
    assert response.status_code == 200
    data = response.json()
    
    assert len(data["warnings"]) > 0
    assert any(w["code"] == "SHIST_OVERFLOW" or "exceeded" in w["message"] for w in data["warnings"])
    assert data["routes"][0]["summary"]["overflow_min"] > 0

def test_deterministic_output():
    # Run twice
    res1 = client.post("/optimize-day", json=SAMPLE_REQUEST).json()
    res2 = client.post("/optimize-day", json=SAMPLE_REQUEST).json()
    
    assert res1 == res2
