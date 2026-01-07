import json
import asyncio
from typing import Dict, Any, List
from .matching import HMMMapMatcher, ParticleFilterTracker
from ..graph import RoadGraph

class TruckStateEstimator:
    def __init__(self):
        self.state = {
            'position': None,
            'speed': 0.0,
            'status': 'idle'
        }
        
    def estimate_state(self, gps_point):
        # Basic pass-through or smoothing
        self.state['position'] = gps_point
        return self.state

class AlgerianRouteSerializer:
    def serialize_route(self, route_points: List[Dict], metadata: Dict = None):
        """
        route_points: List of dicts {'lat':, 'lon':}
        """
        geojson = {
            "type": "FeatureCollection",
            "properties": metadata or {},
            "features": [{
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[p['lon'], p['lat']] for p in route_points]
                },
                "properties": {}
            }]
        }
        return geojson

class GPSQualityAnalyzer:
    def analyze(self, gps_points: List[Dict]):
        # Simple analysis
        jumps = []
        for i in range(1, len(gps_points)):
            # Check dist vs time
            pass
        return {'status': 'good', 'jumps_detected': len(jumps)}

class RealTimeTrackingServer:
    def __init__(self, road_graph: RoadGraph):
        self.road_graph = road_graph
        self.connected_trucks = {}
        self.matchers = {} # truck_id -> Tracker

    async def handle_connection(self, websocket, truck_id: str):
        print(f"Truck {truck_id} connected")
        self.connected_trucks[truck_id] = websocket
        
        # Init tracker for truck
        self.matchers[truck_id] = ParticleFilterTracker(self.road_graph)
        
        try:
            while True:
                data_str = await websocket.receive_text()
                data = json.loads(data_str)
                
                if data['type'] == 'position_update':
                    gps = data['gps']
                    # First time init
                    if not self.matchers[truck_id].particles:
                        self.matchers[truck_id].initialize(gps)
                    
                    self.matchers[truck_id].update(gps, dt=1.0) # Assume 1s update
                    estimate = self.matchers[truck_id].get_estimate()
                    
                    # Send back correction
                    await websocket.send_text(json.dumps({
                        'type': 'correction',
                        'matched_pos': estimate
                    }))
        except Exception as e:
            print(f"Connection lost for {truck_id}: {e}")
        finally:
            del self.connected_trucks[truck_id]
