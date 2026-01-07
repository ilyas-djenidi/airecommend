import random
from app.routing.graph import RoadGraph
from app.routing.tracking.matching import HMMMapMatcher
from app.routing.tracking.visualization import MapMatchingVisualizer

def run_test():
    print("Initializing Graph...")
    g = RoadGraph()
    # Mock linear road: (0,0)->(0,1)->(0,2)
    g.add_node(0, 0, 0)
    g.add_node(1, 0, 0.01)
    g.add_node(2, 0, 0.02)
    g.add_edge(0, 1, length_meters=1000)
    g.add_edge(1, 2, length_meters=1000)
    g.build_spatial_index()
    
    # Generate noisy GPS trace along the road
    true_path = []
    gps_trace = []
    
    for i in range(10):
        lat = 0
        lon = 0 + i * 0.002
        true_path.append({'lat': lat, 'lon': lon})
        
        # Add noise
        noise_lat = random.gauss(0, 0.0001) # ~10m
        noise_lon = random.gauss(0, 0.0001)
        gps_trace.append({'lat': lat + noise_lat, 'lon': lon + noise_lon})
        
    print(f"Generated {len(gps_trace)} GPS points with noise.")
    
    matcher = HMMMapMatcher(g)
    matched_path = matcher.viterbi_map_match(gps_trace)
    
    print(f"Matched Path Length: {len(matched_path)}")
    
    # vis = MapMatchingVisualizer()
    # vis.visualize(gps_trace, matched_path)
    print("Test Complete.")

if __name__ == "__main__":
    run_test()
