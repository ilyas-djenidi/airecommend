import time
import random
try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None

from .graph import RoadGraph
from .algorithms import PathFinder
from .tsp import WasteCollectionTSP

def mock_graph_data(num_nodes=100) -> RoadGraph:
    """Creates a synthetic disconnected random graph for testing logic."""
    g = RoadGraph()
    import random
    
    # Create random nodes around Algiers (approx 36.75, 3.05)
    for i in range(num_nodes):
        lat = 36.75 + random.uniform(-0.05, 0.05)
        lon = 3.05 + random.uniform(-0.05, 0.05)
        g.add_node(i, lat, lon, node_type="intersection" if i > 5 else "depot")
        
    g.build_spatial_index()
    
    # Create random edges
    for i in range(num_nodes):
        # Connect to 3 nearest
        neighbors = g.spatial_index.query([g.nodes_dict[i].lat, g.nodes_dict[i].lon], k=4)[1]
        for n_idx in neighbors:
            if n_idx == i: continue # self
            target_id = g.node_ids_ordered[n_idx]
            dist = g.nodes_dict[i].calculate_distance_to(g.nodes_dict[target_id])
            g.add_edge(i, target_id, length_meters=dist, max_speed_kmh=40)
            
    return g

def run_benchmarks():
    print("Initializing Graph...")
    g = mock_graph_data(200)
    pf = PathFinder(g)
    tsp = WasteCollectionTSP(g, pf)
    
    print(f"Graph created: {len(g.nodes_dict)} nodes")
    
    start_node = 0
    end_node = 199
    
    print("\n--- Benchmarking Pathfinding ---")
    
    # Dijkstra
    t0 = time.time()
    res_d = pf.dijkstra(start_node, end_node)
    t_d = time.time() - t0
    print(f"Dijkstra: {t_d:.4f}s | Path len: {res_d.total_distance if res_d else 'No Path'}")

    # A*
    t0 = time.time()
    res_a = pf.a_star(start_node, end_node)
    t_a = time.time() - t0
    print(f"A*      : {t_a:.4f}s | Path len: {res_a.total_distance if res_a else 'No Path'}")
    
    print("\n--- Benchmarking TSP ---")
    collection_points = [x for x in range(10, 30)]
    t0 = time.time()
    routes = tsp.solve_nearest_neighbor(0, collection_points, max_capacity=50)
    t_tsp = time.time() - t0
    print(f"TSP (NN): {t_tsp:.4f}s | Routes: {len(routes)}")
    for i, r in enumerate(routes):
        print(f"  Route {i+1}: {r.route_ids} (Dist: {r.total_distance:.1f}m)")

def main():
    run_benchmarks()

if __name__ == "__main__":
    main()
