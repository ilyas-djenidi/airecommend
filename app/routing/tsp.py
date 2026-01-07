from typing import List, Dict, Optional
from .graph import RoadGraph, Node
from .algorithms import PathFinder

class TSPResult:
    def __init__(self, route_ids: List[int], total_distance: float):
        self.route_ids = route_ids
        self.total_distance = total_distance

class WasteCollectionTSP:
    def __init__(self, graph: RoadGraph, path_finder: PathFinder):
        self.graph = graph
        self.pf = path_finder

    def solve_nearest_neighbor(self, depot_id: int, collection_points_ids: List[int], 
                             max_capacity: float = 100.0) -> List[TSPResult]:
        """
        Solves VRP/TSP for waste collection using Nearest Neighbor.
        Handles capacity constraints (returns multiple routes if truck fills up).
        """
        unvisited = list(collection_points_ids)
        truck_routes = []
        
        while unvisited:
            current_route = [depot_id]
            current_load = 0.0
            current_node_id = depot_id
            route_distance = 0.0
            
            while unvisited:
                # Find nearest unvisited neighbor
                nearest_id = None
                min_dist = float('inf')
                nearest_idx = -1
                
                # Optimization: In a real system, we wouldn't scan ALL unvisited every time.
                # We would use a spatial index or precomputed matrix.
                # For demo, simple linear scan.
                for idx, target_id in enumerate(unvisited):
                    # Estimate distance (Euclidean heuristic is fast)
                    # For accuracy, use self.pf.dijkstra(current_node_id, target_id) but it's slow
                    dist = self.pf.heuristic(self.graph.nodes_dict[current_node_id], 
                                           self.graph.nodes_dict[target_id])
                    
                    if dist < min_dist:
                        min_dist = dist
                        nearest_id = target_id
                        nearest_idx = idx
                
                if nearest_id is None:
                    break

                # Mock volume for this point (e.g., 5-15 units)
                waste_vol = 10.0 
                
                if current_load + waste_vol > max_capacity:
                    # Truck full, return to depot
                    break
                
                # Add to route
                current_route.append(nearest_id)
                current_load += waste_vol
                route_distance += min_dist # Using heuristic approx for speed
                
                current_node_id = nearest_id
                unvisited.pop(nearest_idx)
            
            # Return to depot
            current_route.append(depot_id)
            truck_routes.append(TSPResult(current_route, route_distance))
            
        return truck_routes
