import time
from app.routing.graph import RoadGraph
from app.routing.optimization.engine import RoutingEngine

def run_benchmarks():
    print("Initializing Graph and Engine...")
    g = RoadGraph()
    # Mock data
    depot_id = 0
    g.add_node(depot_id, 36.75, 3.05, node_type="depot")
    
    points = []
    for i in range(1, 21): # 20 points
        g.add_node(i, 36.75 + i*0.001, 3.05 + i*0.001)
        points.append((i, 10.0)) # 10 units volume
    
    engine = RoutingEngine(g)
    
    print("\n--- VRP Benchmarks (Clarke-Wright) ---")
    start = time.time()
    routes = engine.solve_capacitated_routing(depot_id, points, method="clarke_wright")
    dur = time.time() - start
    print(f"Clarke-Wright: {dur:.4f}s | Routes: {len(routes)}")
    for r in routes:
        print(f"  {r}")

    print("\n--- TSP Benchmarks (20 cities) ---")
    nodes = [depot_id] + [p[0] for p in points]
    
    # ACO
    start = time.time()
    tour_aco = engine.solve_tsp(nodes, method="aco")
    dur = time.time() - start
    print(f"ACO: {dur:.4f}s | Tour len: {len(tour_aco)}")
    
    # GA
    start = time.time()
    tour_ga = engine.solve_tsp(nodes, method="ga")
    dur = time.time() - start
    print(f"GA: {dur:.4f}s | Tour len: {len(tour_ga)}")

    # Christofides
    try:
        start = time.time()
        tour_chr = engine.solve_tsp(nodes, method="christofides")
        dur = time.time() - start
        print(f"Christofides: {dur:.4f}s | Tour len: {len(tour_chr)}")
    except Exception as e:
        print(f"Christofides failed (needs full matrix): {e}")

if __name__ == "__main__":
    run_benchmarks()
