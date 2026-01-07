import networkx as nx
import numpy as np
from typing import List, Dict, Tuple, Set
from ..graph import RoadGraph, Node
from ..algorithms import PathFinder

class RouteConstraint:
    def __init__(self, max_capacity: float = 100.0, max_duration_seconds: float = 28800.0):
        self.max_capacity = max_capacity
        self.max_duration_seconds = max_duration_seconds # 8 hours

class OptimizationUtils:
    @staticmethod
    def calculate_savings_matrix(depot_id: int, points: List[int], dist_matrix: Dict[Tuple[int, int], float]) -> List[Tuple[float, int, int]]:
        """
        Calculates savings S_ij = D_0i + D_0j - D_ij
        Returns sorted list of (saving, i, j) descending.
        """
        savings = []
        for i in range(len(points)):
            for j in range(i + 1, len(points)):
                u, v = points[i], points[j]
                d_0u = dist_matrix.get((depot_id, u), float('inf'))
                d_0v = dist_matrix.get((depot_id, v), float('inf'))
                d_uv = dist_matrix.get((u, v), float('inf'))
                
                saving = d_0u + d_0v - d_uv
                savings.append((saving, u, v))
        
        savings.sort(key=lambda x: x[0], reverse=True)
        return savings

class ClarkeWrightSolver:
    def __init__(self, graph: RoadGraph, constraints: RouteConstraint):
        self.graph = graph
        self.constraints = constraints

    def solve(self, depot_id: int, collection_points: List[Tuple[int, float]], 
              dist_matrix: Dict[Tuple[int, int], float]) -> List[List[int]]:
        """
        collection_points: List of (node_id, volume)
        """
        # 1. Initialize routes: each point has its own route [0, i, 0]
        routes: Dict[int, List[int]] = {} # map point_id -> route list
        route_loads: Dict[int, float] = {} # map route_id (first point) -> load
        route_costs: Dict[int, float] = {} # map route_id -> cost
        
        ids = [p[0] for p in collection_points]
        vols = {p[0]: p[1] for p in collection_points}
        
        # Initial state
        active_routes = []
        for pid in ids:
            r = [depot_id, pid, depot_id]
            active_routes.append(r)
            # Route logic tracking usually needs a route object, using list for simplicity here
            # But verifying merges requires tracking ends.
        
        # Simpler approach: Map end_points to route_index
        # We start with N routes. We assume route ID is the index in list.
        # This implementation can be complex to manage indices. 
        # Making a cleaner implementation:
        
        # Track routes by the set of nodes they contain (excluding depot initially)
        # Actually standard CW maintains efficient lookup for (Route ends).
        
        # Let's use a Route management structure
        class Route:
            def __init__(self, nodes: List[int], load: float, cost: float):
                self.nodes = nodes # includes start/end depot
                self.load = load
                self.cost = cost
                
            def first_point(self): return self.nodes[1]
            def last_point(self): return self.nodes[-2]
            
        routes_map = {} # point_id -> Route object
        all_routes = []
        
        for pid in ids:
            cost = dist_matrix.get((depot_id, pid), 0) + dist_matrix.get((pid, depot_id), 0)
            r = Route([depot_id, pid, depot_id], vols[pid], cost)
            routes_map[pid] = r
            all_routes.append(r)
            
        savings = OptimizationUtils.calculate_savings_matrix(depot_id, ids, dist_matrix)
        
        for saving, i, j in savings:
            r1 = routes_map.get(i)
            r2 = routes_map.get(j)
            
            if r1 is None or r2 is None or r1 == r2:
                continue
            
            # Check if i and j are mergeable (one is last, one is first of respective routes)
            # For CW, we merge if i is last of r1 and j is first of r2 (or vice versa)
            
            i_is_first = (r1.first_point() == i)
            i_is_last = (r1.last_point() == i)
            j_is_first = (r2.first_point() == j)
            j_is_last = (r2.last_point() == j)
            
            merge_dir = None # None, 'i-j', 'j-i'
            
            if i_is_last and j_is_first:
                merge_dir = 'i-j'
            elif j_is_last and i_is_first:
                merge_dir = 'j-i'
            # Note: Can handle other cases by reversing routes if assumed symmetric, 
            # but waste collection is often directed graph. Assuming symmetric for savings here.
            
            if merge_dir:
                # Check constraints
                new_load = r1.load + r2.load
                new_cost = r1.cost + r2.cost - saving
                
                if new_load <= self.constraints.max_capacity and new_cost <= self.constraints.max_duration_seconds:
                    # Merge
                    if merge_dir == 'i-j':
                        new_nodes = r1.nodes[:-1] + r2.nodes[1:]
                    else:
                        new_nodes = r2.nodes[:-1] + r1.nodes[1:]
                        
                    r1.nodes = new_nodes
                    r1.load = new_load
                    r1.cost = new_cost
                    
                    # Update map for all nodes in r2 to point to r1
                    for node in r2.nodes:
                        if node != depot_id:
                            routes_map[node] = r1
                    
                    all_routes.remove(r2)
                    
        return [r.nodes for r in all_routes]

class ChristofidesSolver:
    @staticmethod
    def solve(nodes: List[int], dist_matrix: Dict[Tuple[int, int], float]) -> List[int]:
        """
        Logic:
        1. MST
        2. Odd degree vertices
        3. Min weight matching
        4. Eulerian circuit
        5. Hamiltonian path
        """
        # Create full graph
        G = nx.Graph()
        for i in range(len(nodes)):
            for j in range(i + 1, len(nodes)):
                u, v = nodes[i], nodes[j]
                w = dist_matrix.get((u, v), float('inf'))
                G.add_edge(u, v, weight=w)
                
        # 1. MST
        T = nx.minimum_spanning_tree(G)
        
        # 2. Odd Degree
        odd_degree_nodes = [v for v, d in T.degree() if d % 2 == 1]
        
        # 3. Min weight matching on odd nodes
        subgraph = G.subgraph(odd_degree_nodes)
        # Note: optimization needed here for negative weights if any, but distances are positive
        # NetworkX max_weight_matching can be used for min weight by negating weights
        # Or simple greedy if exact is too slow
        
        # Inverting weights for max_weight_matching to get min_weight
        mw_graph = nx.Graph()
        max_dist = 0
        for u, v, d in subgraph.edges(data=True):
             max_dist = max(max_dist, d['weight'])
             
        for u, v, d in subgraph.edges(data=True):
            mw_graph.add_edge(u, v, weight=-(d['weight']))

        matching = nx.max_weight_matching(mw_graph, maxcardinality=True)
        
        # 4. MultiGraph T + M
        M = nx.MultiGraph(T)
        for u, v in matching:
            w = dist_matrix.get((u, v), 0)
            M.add_edge(u, v, weight=w)
            
        # 5. Eulerian Circuit
        # Requires connected graph with all even degrees.
        try:
            euler_circuit = list(nx.eulerian_circuit(M, source=nodes[0]))
        except nx.NetworkXError:
            # Fallback if graph not Eulerian (shouldn't happen with Christofides logic if connected)
            return nodes + [nodes[0]]
            
        # 6. Shortcut
        path = []
        visited = set()
        for u, v in euler_circuit:
            if u not in visited:
                path.append(u)
                visited.add(u)
        path.append(nodes[0]) # Return to start
        
        return path
