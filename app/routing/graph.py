import math
import hashlib
from typing import List, Dict, Optional, Tuple, Set
from scipy.spatial import cKDTree
import numpy as np

class Node:
    def __init__(self, id: int, lat: float, lon: float, zone_id: Optional[int] = None, 
                 node_type: str = "intersection", elevation: float = 0.0):
        self.id = id
        self.lat = lat
        self.lon = lon
        self.zone_id = zone_id
        self.node_type = node_type  # intersection, collection_point, depot
        self.elevation = elevation
        self.out_edges: List['Edge'] = []

    def get_neighbors(self) -> List['Node']:
        return [edge.target for edge in self.out_edges]

    def calculate_distance_to(self, other_node: 'Node') -> float:
        """Haversine distance in meters."""
        R = 6371000  # radius of Earth in meters
        phi1, phi2 = math.radians(self.lat), math.radians(other_node.lat)
        dphi = math.radians(other_node.lat - self.lat)
        dlambda = math.radians(other_node.lon - self.lon)
        a = math.sin(dphi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

class Edge:
    def __init__(self, source: Node, target: Node, length_meters: float, 
                 road_type: str = "residential", max_speed_kmh: float = 30.0, 
                 oneway: bool = False, congestion_factor: float = 1.0):
        self.source = source
        self.target = target
        self.length_meters = length_meters
        self.road_type = road_type # secondary, primary, tertiary, highway
        self.max_speed_kmh = max_speed_kmh
        self.oneway = oneway
        self.congestion_factor = congestion_factor
        
        # Derived weights
        self.time_weight = self._calculate_base_travel_time()

    def _calculate_base_travel_time(self) -> float:
        """Base travel time in seconds without dynamic congestion."""
        speed_ms = (self.max_speed_kmh * 1000) / 3600
        if speed_ms <= 0: return float('inf')
        return self.length_meters / speed_ms

    def calculate_travel_time(self, current_hour: int) -> float:
        """
        Estimate travel time based on hour of day (congestion).
        Peak hours in Algeria: 7-9 AM, 4-7 PM.
        """
        modifier = 1.0
        if 7 <= current_hour <= 9 or 16 <= current_hour <= 19:
            modifier = 1.5 * self.congestion_factor  # Heavy traffic
        elif 22 <= current_hour <= 5:
            modifier = 0.8  # Night time
        
        return self.time_weight * modifier

    def is_accessible_for_truck(self, truck_type: str) -> bool:
        """
        Check if road allows specific truck types.
        Example logic for narrow Casbah streets vs broad boulevards.
        """
        if truck_type == "heavy":
            if self.road_type in ["living_street", "pedestrian", "path", "steps"]:
                return False
            # Casbah-like narrow streets
            if self.road_type == "residential" and self.max_speed_kmh < 20: 
                return False
        return True

class RoadGraph:
    def __init__(self):
        self.nodes_dict: Dict[int, Node] = {}
        self.spatial_index: Optional[cKDTree] = None
        self.node_ids_ordered: List[int] = [] # For index mapping

    def add_node(self, id: int, lat: float, lon: float, **kwargs):
        self.nodes_dict[id] = Node(id, lat, lon, **kwargs)

    def add_edge(self, source_id: int, target_id: int, **kwargs):
        if source_id in self.nodes_dict and target_id in self.nodes_dict:
            source = self.nodes_dict[source_id]
            target = self.nodes_dict[target_id]
            edge = Edge(source, target, **kwargs)
            source.out_edges.append(edge)
            # If not oneway, add reverse edge? 
            # Usually graphs are built from raw data which specifies oneway explicitly.
            # If we assume input handles oneway logic, we just add what we are given.

    def build_spatial_index(self):
        """Build KDTree for fast nearest neighbor lookup."""
        coords = []
        self.node_ids_ordered = []
        for nid, node in self.nodes_dict.items():
            coords.append([node.lat, node.lon])
            self.node_ids_ordered.append(nid)
        if coords:
            self.spatial_index = cKDTree(np.array(coords))

    def get_nearest_node(self, lat: float, lon: float) -> Optional[Node]:
        if not self.spatial_index:
            self.build_spatial_index()
            if not self.spatial_index: return None # Still empty
        
        # query returns (distance, index)
        _, idx = self.spatial_index.query([lat, lon])
        node_id = self.node_ids_ordered[idx]
        return self.nodes_dict[node_id]

    def get_edges_between(self, u_id: int, v_id: int) -> List[Edge]:
        if u_id not in self.nodes_dict: return []
        return [e for e in self.nodes_dict[u_id].out_edges if e.target.id == v_id]
