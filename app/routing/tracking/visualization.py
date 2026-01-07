try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None
from typing import List, Dict

class MapMatchingVisualizer:
    def __init__(self):
        pass
        
    def visualize(self, gps_trace: List[Dict], matched_path: List[Dict], road_graph=None):
        if plt is None:
            print("Matplotlib not installed.")
            return

        fig, ax = plt.subplots(figsize=(10, 10))
        
        # Plot raw
        rx = [p['lon'] for p in gps_trace]
        ry = [p['lat'] for p in gps_trace]
        ax.scatter(rx, ry, c='red', s=20, label='Raw GPS', alpha=0.6)
        
        # Plot matched
        mx = [p['lon'] for p in matched_path]
        my = [p['lat'] for p in matched_path]
        ax.plot(mx, my, 'b-', linewidth=2, label='Matched Path')
        
        ax.legend()
        plt.title("Map Matching Result")
        plt.show()
