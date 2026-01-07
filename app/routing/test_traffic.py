import datetime
from app.routing.graph import RoadGraph
from app.routing.traffic.router import DynamicTrafficAwareRouter

def run_test():
    print("Initializing Graph...")
    g = RoadGraph()
    # A->B->C
    g.add_node(1, 0, 0)
    g.add_node(2, 0, 0.01)
    g.add_node(3, 0, 0.02)
    
    # Edge 1-2: Normal
    g.add_edge(1, 2, length_meters=1000, max_speed_kmh=50)
    # Edge 2-3: Normal
    g.add_edge(2, 3, length_meters=1000, max_speed_kmh=50)
    
    router = DynamicTrafficAwareRouter(g)
    
    # Test during Peak Hour (08:00)
    peak_time = datetime.datetime(2025, 1, 1, 8, 0, 0)
    print(f"\nPlanning route at {peak_time} (Peak Hour)...")
    route_peak = router.find_optimal_route(1, 3, peak_time)
    print(f"Route: {route_peak}")
    
    # Test during Friday Prayer (13:00 Friday)
    # Weekday 4 is Friday
    fri_time = datetime.datetime(2025, 1, 3, 13, 0, 0) 
    print(f"\nPlanning route at {fri_time} (Friday Prayer)...")
    route_fri = router.find_optimal_route(1, 3, fri_time)
    print(f"Route: {route_fri}")
    
    print("\nTraffic Routing Test Complete.")

if __name__ == "__main__":
    run_test()
