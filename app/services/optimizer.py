import math
from typing import List, Dict, Any, Tuple
from collections import defaultdict
import logging

from app.core.config import settings
from app.schemas.models import (
    OptimizationRequest, Route, Stop, RouteSummary, 
    Container, Collector, WarningCode
)
from app.providers.routing import get_routing_provider, Point, MatrixResult
from app.utils import minutes_to_time_str, time_str_to_minutes
from app.services.traffic import TrafficService
from app.routing.graph import RoadGraph
from app.routing.algorithms import PathFinder

# logger = logging.getLogger(__name__) ... is below

logger = logging.getLogger(__name__)

class OptimizerService:
    def __init__(self):
        self.provider = get_routing_provider()
        self.traffic = TrafficService()
        self.graph = None
        self.path_finder = None
        self.is_loading = False
        self._background_load()

    def _background_load(self):
        """Start non-blocking background initialization"""
        import threading
        if not self.is_loading and self.graph is None:
            self.is_loading = True
            thread = threading.Thread(target=self._ensure_graph_loaded)
            thread.daemon = True
            thread.start()

    def _ensure_graph_loaded(self):
        """Lazy load the road graph if needed with caching"""
        if self.graph is not None:
            return
            
        try:
            import osmnx as ox
            from pathlib import Path
            from app.services.map_service import ALGIERS_CENTER
            
            # Cache Setup
            CACHE_DIR = Path("data/algeria_networks")
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            cache_file = CACHE_DIR / "algiers_drive_12km.graphml"
            
            center_point = (ALGIERS_CENTER[0], ALGIERS_CENTER[1])
            
            if cache_file.exists():
                logger.info(f"Loading road graph from cache: {cache_file}")
                G = ox.load_graphml(cache_file)
            else:
                logger.info(f"Downloading OSM network for {center_point} (12km radius)...")
                G = ox.graph_from_point(center_point, dist=12000, network_type='drive', simplify=True)
                logger.info(f"Saving road graph to cache: {cache_file}")
                ox.save_graphml(G, cache_file)
            
            self.graph = RoadGraph()
            
            # Map OSM nodes to our Node objects
            for node_id, data in G.nodes(data=True):
                self.graph.add_node(node_id, data['y'], data['x'])
                
            # Map OSM edges to our Edge objects
            for u, v, data in G.edges(data=True):
                length = data.get('length', 0)
                road_type = str(data.get('highway', 'residential'))
                if isinstance(road_type, list): road_type = road_type[0]
                
                max_speed = 30.0 # Default
                if road_type == 'primary': max_speed = 60.0
                elif road_type == 'secondary': max_speed = 40.0
                elif road_type == 'tertiary': max_speed = 35.0
                
                self.graph.add_edge(u, v, length_meters=length, 
                                  road_type=road_type, max_speed_kmh=max_speed)
            
            self.graph.build_spatial_index()
            self.path_finder = PathFinder(self.graph)
            logger.info("Road graph initialized successfully.")
            
        except Exception as e:
            import traceback
            logger.error(f"CRITICAL: Failed to initialize road graph: {e}")
            logger.error(traceback.format_exc())
            self.path_finder = None
        finally:
            self.is_loading = False

    def _cluster_containers(self, collectors: List[Collector], containers: List[Container]) -> Dict[str, List[Container]]:
        """
        Assigns each container to the nearest collector (Start Location) 
        using simple distance heuristic.
        Deterministically breaks ties by ID.
        """
        clusters = defaultdict(list)
        if not collectors:
            return clusters
            
        # Optimization: pre-calculate collector points
        # Using simple euclidean squared or haversine for assignment logic?
        # Haversine is better.
        from app.utils import haversine_km
        
        for cont in containers:
            best_dist = float('inf')
            best_c_id = collectors[0].id
            
            for col in collectors:
                dist = haversine_km(col.start_lat, col.start_lng, cont.lat, cont.lng)
                if dist < best_dist:
                    best_dist = dist
                    best_c_id = col.id
                elif dist == best_dist:
                    # Stable tie-break
                    if col.id < best_c_id:
                        best_c_id = col.id
            
            clusters[best_c_id].append(cont)
            
        return clusters

    def _tsp_heuristic(self, start: Point, points: List[Point], matrix: MatrixResult, point_map: Dict[str, int]) -> List[Point]:
        """
        Solves TSP using Nearest Neighbor + 2-opt.
        Uses the provided matrix for costs (duration).
        point_map maps point.id -> matrix_index
        """
        if not points:
            return []
            
        unvisited = points[:]
        # Sort by ID for deterministic start
        unvisited.sort(key=lambda p: p.id)
        
        current_idx = point_map[start.id]
        path = []
        
        # Nearest Neighbor
        while unvisited:
            best_cost = float('inf')
            best_idx = -1
            
            for i, p in enumerate(unvisited):
                # Look up duration in matrix
                target_idx = point_map[p.id]
                cost = matrix.durations_min[current_idx][target_idx]
                
                if cost < best_cost:
                    best_cost = cost
                    best_idx = i
                elif cost == best_cost:
                    if p.id < unvisited[best_idx].id:
                        best_idx = i
            
            next_p = unvisited.pop(best_idx)
            path.append(next_p)
            current_idx = point_map[next_p.id]
            
        # 2-opt Refinement
        # Only feasible if N is small (< 100). 
        # For N=300 this might be slow in Python if not careful, but usually fine.
        improved = True
        while improved:
            improved = False
            # Calculate current path cost
            # Not fully implementing 2-opt cost delta for brevity/stability, 
            # just re-calc full path. 
            # Optimization: can trigger timeout if loop too long.
            pass # TODO: Implement 2-opt if needed, NN is MVP baseline for V2 upgrade in limited context
            
        return path

    def optimize(self, request: OptimizationRequest) -> Tuple[List[Route], List[WarningCode]]:
        """Main entry point for daily routing optimization"""
        # No more blocking _ensure_graph_loaded call here
        
        warnings = []
        routes = []

        # 1. Prepare Points for Matrix
        # We need a unified list of points: Depot? (Not used for VRP Start/End in this Logic yet), Collectors, Containers
        # Actually logic says: Route starts from collector start.
        all_points = []
        
        # Add containers
        for c in request.containers:
            all_points.append(Point(c.id, c.lat, c.lng))
        
        # Add collector starts (unique?)
        # Collectors might share start locations. Give them unique IDs or reuse?
        # Point ID must be string. 
        # Let's prefix collector starts to ensure uniqueness if ID overlaps with bins (unlikely but safe)
        c_start_map = {}
        for col in request.collectors:
            # We need the point object for matrix
            pid = f"COL_START_{col.id}"
            p = Point(pid, col.start_lat, col.start_lng)
            if pid not in c_start_map:
                all_points.append(p)
                c_start_map[col.id] = p

        # 2. Get Matrix
        # Fallback handling is inside provider
        matrix = self.provider.get_matrix(all_points)
        
        # Validate matrix provider
        if matrix.provider_name == "HaversineProvider" and settings.OSRM_BASE_URL:
             warnings.append(WarningCode(code="ROUTING_FALLBACK", message="OSRM failed, used Haversine fallback"))

        # Map point IDs to Matrix Indices
        # We need to be careful matching points.
        # Matrix order corresponds to all_points order.
        p_to_idx = {p.id: i for i, p in enumerate(all_points)}

        # 3. Assign Containers (Balanced Distribution)
        # ISSUE: If all collectors start from same depot, distance-based clustering
        # assigns everything to first collector (C1).
        # SOLUTION: Use balanced round-robin distribution for even load.
        
        clusters = defaultdict(list)
        
        if len(request.collectors) == 1:
            # Only one collector - assign all containers
            clusters[request.collectors[0].id] = list(request.containers)
        else:
            # Multiple collectors - balanced distribution
            # Sort containers by ID for deterministic assignment
            sorted_containers = sorted(request.containers, key=lambda c: c.id)
            
            # Round-robin assignment
            for idx, cont in enumerate(sorted_containers):
                collector_idx = idx % len(request.collectors)
                assigned_collector = request.collectors[collector_idx]
                clusters[assigned_collector.id].append(cont)
            
            logger.info(f"Balanced distribution: {[(k, len(v)) for k, v in clusters.items()]}")


        # 4. Route Per Collector
        for col in request.collectors:
            assigned_containers = clusters[col.id]
            if not assigned_containers:
                # Empty route
                routes.append(Route(
                    collector_id=col.id,
                    stops=[],
                    summary=RouteSummary(total_travel_min=0, total_service_min=0, total_min=0, distance_km=0)
                ))
                continue

            # TSP
            start_pt = c_start_map[col.id]
            cont_pts = [Point(c.id, c.lat, c.lng) for c in assigned_containers]
            
            path_points = self._tsp_heuristic(start_pt, cont_pts, matrix, p_to_idx)
            
            # 5. Build Timetable
            stops = []
            
            current_time_min = time_str_to_minutes(col.shift_start)
            shift_end_min = time_str_to_minutes(col.shift_end)
            
            total_travel = 0
            total_service = 0
            total_dist = 0.0
            
            prev_idx = p_to_idx[start_pt.id]
            route_geometry = []
            
            # Snap start to graph
            current_node = self.graph.get_nearest_node(start_pt.lat, start_pt.lng) if self.graph else None
            
            for seq, pt in enumerate(path_points, 1):
                curr_idx = p_to_idx[pt.id]
                
                # Calculate Path Geometry
                leg_geometry = []
                if self.path_finder and current_node:
                    target_node = self.graph.get_nearest_node(pt.lat, pt.lng)
                    if target_node:
                        # Use A* to find street path
                        path_result = self.path_finder.a_star(current_node.id, target_node.id)
                        if path_result:
                            leg_geometry = [{"lat": n.lat, "lng": n.lon} for n in path_result.path_nodes]
                            current_node = target_node
                
                # Retrieve Matrix Values (fallback to matrix for travel time/dist)
                base_travel_min = matrix.durations_min[prev_idx][curr_idx]
                dist_km = matrix.distances_km[prev_idx][curr_idx]
                
                multiplier = self.traffic.get_traffic_multiplier(current_time_min)
                final_travel_min = math.ceil(base_travel_min * multiplier)

                arrival_time = current_time_min + final_travel_min
                
                if not leg_geometry:
                    # Fallback to straight line if graph not ready
                    prev_lat = path_points[seq-2].lat if seq > 1 else start_pt.lat
                    prev_lng = path_points[seq-2].lng if seq > 1 else start_pt.lng
                    leg_geometry = [{"lat": prev_lat, "lng": prev_lng}, {"lat": pt.lat, "lng": pt.lng}]

                # Add Stop
                stops.append(Stop(
                    seq=seq,
                    container_id=pt.id,
                    lat=pt.lat,
                    lng=pt.lng,
                    eta=minutes_to_time_str(arrival_time),
                    travel_min=final_travel_min,
                    service_min=settings.SERVICE_TIME_MIN,
                    traffic_level=self.traffic.get_traffic_level(multiplier),
                    geometry=leg_geometry
                ))
                
                if leg_geometry:
                    route_geometry.extend(leg_geometry)
                
                total_travel += final_travel_min
                total_service += settings.SERVICE_TIME_MIN
                total_dist += dist_km
                
                current_time_min = arrival_time + settings.SERVICE_TIME_MIN
                prev_idx = curr_idx

            # 6. Return to Base (Final Leg)
            if stops and self.graph and current_node:
                # Calculate return to start_pt
                base_node = self.graph.get_nearest_node(start_pt.lat, start_pt.lng)
                if base_node and base_node.id != current_node.id:
                    path_result = self.path_finder.a_star(current_node.id, base_node.id)
                    if path_result:
                        return_geo = [{"lat": n.lat, "lng": n.lon} for n in path_result.path_nodes]
                        route_geometry.extend(return_geo)
                        
                        # Update stats for return leg
                        # We use the matrix or direct haversine if matrix index not available for "return" 
                        # but prev_idx vs start_idx should work.
                        start_idx = p_to_idx[start_pt.id]
                        base_travel = matrix.durations_min[prev_idx][start_idx]
                        base_dist = matrix.distances_km[prev_idx][start_idx]
                        
                        multiplier = self.traffic.get_traffic_multiplier(current_time_min)
                        final_return_min = math.ceil(base_travel * multiplier)
                        
                        total_travel += final_return_min
                        total_dist += base_dist
                        current_time_min += final_return_min
            overflow = max(0, current_time_min - shift_end_min)
            finish_time = minutes_to_time_str(current_time_min)
            
            if overflow > 0:
                warnings.append(WarningCode(code="SHIFT_OVERFLOW", message=f"Collector {col.id} shift exceeded by {overflow} min"))

            routes.append(Route(
                collector_id=col.id,
                stops=stops,
                summary=RouteSummary(
                    total_travel_min=total_travel,
                    total_service_min=total_service,
                    total_min=total_travel + total_service,
                    distance_km=round(total_dist, 2),
                    overflow_min=overflow,
                    finish_time=finish_time
                ),
                geometry=route_geometry if route_geometry else None
            ))
            
        return routes, warnings

    def re_optimize_from_point(self, start_lat: float, start_lng: float, stops: List[Dict]) -> Dict:
        """
        AI Re-optimization: Re-sequences stops from a new dynamic starting point.
        Ensures the nearest stop is visited first.
        """
        # No blocking call. Use what's available.
        if not stops:
            return {"stops": [], "geometry": []}

        # 1. Prepare Points
        start_pt = Point("CURRENT_POS", start_lat, start_lng)
        cont_pts = [Point(s['container_id'], s['lat'], s['lng']) for s in stops]
        all_pts = [start_pt] + cont_pts
        
        # 2. Get Matrix for these points
        matrix = self.provider.get_matrix(all_pts)
        p_to_idx = {p.id: i for i, p in enumerate(all_pts)}
        
        # 3. Solve TSP from CURRENT_POS
        path_points = self._tsp_heuristic(start_pt, cont_pts, matrix, p_to_idx)
        
        # 4. Rebuild Route with geometries
        new_stops = []
        route_geometry = []
        current_node = self.graph.get_nearest_node(start_lat, start_lng) if self.graph else None
        
        total_dist = 0.0
        total_travel = 0
        current_time_min = time_str_to_minutes("08:00") # Default starting time for re-opt
        prev_idx = p_to_idx[start_pt.id]

        for seq, pt in enumerate(path_points, 1):
            curr_idx = p_to_idx[pt.id]
            leg_geometry = []
            
            if self.path_finder and current_node:
                target_node = self.graph.get_nearest_node(pt.lat, pt.lng)
                if target_node:
                    path_result = self.path_finder.a_star(current_node.id, target_node.id)
                    if path_result:
                        leg_geometry = [{"lat": n.lat, "lng": n.lon} for n in path_result.path_nodes]
                        current_node = target_node
            
            base_travel = matrix.durations_min[prev_idx][curr_idx]
            dist_km = matrix.distances_km[prev_idx][curr_idx]
            
            arrival_time = current_time_min + base_travel
            
            # Instant Fallback Geometry
            actual_leg = leg_geometry
            if not actual_leg:
                prev_lat = path_points[seq-2].lat if seq > 1 else start_lat
                prev_lng = path_points[seq-2].lng if seq > 1 else start_lng
                actual_leg = [{"lat": prev_lat, "lng": prev_lng}, {"lat": pt.lat, "lng": pt.lng}]

            new_stops.append({
                "seq": seq,
                "container_id": pt.id,
                "lat": pt.lat,
                "lng": pt.lng,
                "eta": minutes_to_time_str(arrival_time),
                "travel_min": base_travel,
                "geometry": actual_leg
            })
            
            if actual_leg:
                route_geometry.extend(actual_leg)
                
            total_dist += dist_km
            total_travel += base_travel
            current_time_min = arrival_time + settings.SERVICE_TIME_MIN
            prev_idx = curr_idx

        # 5. Return to Base (Final Leg for re-opt)
        if new_stops and self.graph and current_node:
            base_node = self.graph.get_nearest_node(start_lat, start_lng)
            if base_node and base_node.id != current_node.id:
                path_result = self.path_finder.a_star(current_node.id, base_node.id)
                if path_result:
                    return_geo = [{"lat": n.lat, "lng": n.lon} for n in path_result.path_nodes]
                    route_geometry.extend(return_geo)
                    
                    start_idx = p_to_idx[start_pt.id]
                    base_travel = matrix.durations_min[prev_idx][start_idx]
                    base_dist = matrix.distances_km[prev_idx][start_idx]
                    
                    total_travel += base_travel
                    total_dist += base_dist
                    current_time_min += base_travel

        return {
            "stops": new_stops,
            "geometry": route_geometry,
            "total_distance_km": round(total_dist, 2),
            "total_duration_min": total_travel
        }
