# Routing & Traffic Recommendation Engine (Pro)

A professional-grade microservice for optimizing waste collection routes with VRP support, traffic-aware scheduling, and pluggable routing providers.

## Features

- **Multi-Collector VRP**: Automatically assigns containers to collectors based on proximity (clustering) and optimizes each route (TSP).
- **Pluggable Routing Layer**: 
  - **Haversine (Default)**: Fast, offline geodesic distance.
  - **OSRM**: Integrated HTTP client for true road-network routing (supports `USE_ORTOOLS` + OSRM for powerful solving).
- **Traffic Awareness**: 
  - Departure-time based traffic multipliers per leg.
  - "Traffic Advice" engine highlighting difficult route segments.
- **Robust Scheduling**:
  - Precise ETAs using matrix durations.
  - Shift overflow detection and warnings.
  - Service time handling.
- **Observability**: JSON structured logging with Request ID tracking.

## Architecture

```
app/
├── api/            # Route handlers (future use)
├── core/           # Config, Logging, Constants
├── providers/      # Routing Abstractions (Haversine, OSRM)
├── schemas/        # Pydantic Data Models (Strict Types)
├── services/       # Business Logic (Optimizer, Traffic)
└── main.py         # Entry Point
```

## Configuration

Control behavior via Environment Variables (`.env`):

| Variable | Default | Description |
|----------|---------|-------------|
| `AVG_SPEED_KMH` | 25.0 | Fallback speed for Haversine calculations |
| `SERVICE_TIME_MIN` | 5 | Service time per container |
| `OSRM_BASE_URL` | None | URL for OSRM table service (e.g., `http://localhost:5000`) |
| `LOG_LEVEL` | INFO | Logging verbosity |

## Installation & Running

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Run Server**
   ```bash
   python -m uvicorn app.main:app --reload
   ```

3. **Run OSRM (Optional)**
   To enable road-network routing:
   ```bash
   docker run -t -i -p 5000:5000 -v "${PWD}:/data" osrm/osrm-backend osrm-routed --algorithm mld /data/algeria.osrm
   ```
   Then set `OSRM_BASE_URL=http://localhost:5000`.

## Testing

Run the full test suite (V2 logic + API):

```bash
python -m pytest tests/
```

## API Usage

### `POST /optimize-day`

Accepts N collectors and M containers.

**Example Request (Multi-Collector):**
```json
{
  "date": "2026-01-01",
  "depot": { "id": "D1", "lat": 36.75, "lng": 3.05 },
  "collectors": [
    { "id": "C1", "start_lat": 36.75, "start_lng": 3.05, "shift_start": "08:00", "shift_end": "16:00" },
    { "id": "C2", "start_lat": 36.80, "start_lng": 3.10, "shift_start": "09:00", "shift_end": "17:00" }
  ],
  "containers": [ ... ]
}
```

**Response includes:**
- `routes`: Per collector.
- `warnings`: List of non-blocking issues (e.g., shift overflows).
- `traffic_advice`: Specific legs with high congestion.
