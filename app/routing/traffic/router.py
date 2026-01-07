import heapq
import datetime
from typing import List, Optional, Tuple, Dict
from ..graph import RoadGraph, Node
from .prediction import LSTMTrafficPredictor, AlgerianTrafficFactors

class DynamicTrafficAwareRouter:
    def __init__(self, graph: RoadGraph):
        self.graph = graph
        self.predictor = LSTMTrafficPredictor() 
        self.factors = AlgerianTrafficFactors()
        self.cache = {}

    def _calculate_dynamic_cost(self, edge, current_time: datetime.datetime) -> float:
        # Base time
        base_time = edge.time_weight
        
        # Predict traffic factor
        # In real scenario, prepare features for LSTM here.
        # For now, use the factor heuristic + simple heuristic speed adjustment
        
        multiplier = self.factors.get_traffic_multiplier(current_time)
        
        # If multiplier is high (traffic high), speed is low -> time is high
        # Time ~= BaseTime * Multiplier ? No, Speed ~= BaseSpeed / Multiplier
        # Time ~= Dist / Speed
        
        # Let's say multiplier represents "Traffic Intensity".
        # 1.0 = Free flow. 2.0 = Heavy.
        
        predicted_time = base_time * multiplier
        return predicted_time

    def find_optimal_route(self, start_id: int, end_id: int, departure_time: datetime.datetime):
        priority_queue = [(0, start_id)]
        distances = {start_id: 0}
        predecessors = {start_id: None}
        arrival_times = {start_id: departure_time}
        
        visited = set()

        while priority_queue:
            current_cost, u_id = heapq.heappop(priority_queue)
            
            if u_id == end_id:
                break
            
            if u_id in visited:
                continue
            visited.add(u_id)
            
            u_node = self.graph.nodes_dict[u_id]
            current_time = arrival_times[u_id]
            
            for edge in u_node.out_edges:
                v_id = edge.target.id
                if v_id in visited:
                    continue
                
                # Dynamic cost calculation
                # Note: A* would need a consistent heuristic, Dijkstra is safer for time-dependent if FIFO holds
                travel_time = self._calculate_dynamic_cost(edge, current_time)
                new_cost = current_cost + travel_time
                
                if new_cost < distances.get(v_id, float('inf')):
                    distances[v_id] = new_cost
                    predecessors[v_id] = u_id
                    arrival_times[v_id] = current_time + datetime.timedelta(seconds=travel_time)
                    heapq.heappush(priority_queue, (new_cost, v_id))
                    
        # Reconstruct
        if end_id not in predecessors:
            return None
            
        return self._reconstruct_path(predecessors, start_id, end_id)

    def _reconstruct_path(self, predecessors, start, end):
        path = []
        curr = end
        while curr is not None:
            path.append(curr)
            curr = predecessors.get(curr)
        return path[::-1]

class RealTimeReroutingEngine:
    def __init__(self, router: DynamicTrafficAwareRouter):
        self.router = router
        
    def check_and_reroute(self, truck_id: str, current_pos_node: int, destination_node: int, 
                          original_eta: datetime.datetime, current_time: datetime.datetime) -> Optional[List[int]]:
        """
        Check if we need to reroute based on current conditions.
        """
        # Re-calc ETA
        new_route_nodes = self.router.find_optimal_route(current_pos_node, destination_node, current_time)
        if not new_route_nodes:
            return None
            
        # Compare cost/time of new route vs original (assumed stored elsewhere)
        # Simplified: just return new optimal route
        return new_route_nodes
