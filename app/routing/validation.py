import networkx as nx
import osmnx as ox
import geopandas as gpd
from pathlib import Path

# Coordinate bounds for Algeria
BOUNDS = {
    "north": 37.5,
    "south": 18.5,
    "east": 12.5,
    "west": -9.0
}

DATA_DIR = Path("data/algeria_networks")

def validate_connectivity(G, city_name):
    """
    Checks if the graph is strongly connected (for directed) or connected (for undirected).
    Driveable networks are directed.
    """
    if nx.is_strongly_connected(G):
        print(f"[{city_name}] Network is strongly connected.")
    elif nx.is_weakly_connected(G):
        print(f"[{city_name}] Network is weakly connected. Caution needed for routing.")
        # Calculate isolated subcomponents
        components = list(nx.weakly_connected_components(G))
        print(f"  - Number of components: {len(components)}")
        largest = max(components, key=len)
        print(f"  - Largest component size: {len(largest)} nodes ({len(largest)/len(G):.1%} of total)")
    else:
        print(f"[{city_name}] Network is disconnected.")

def validate_coordinates(G, city_name):
    """
    Checks if nodes fall within Algerian bounds.
    """
    nodes, _ = ox.graph_to_gdfs(G)
    
    # Check bounds
    invalid_lat = nodes[(nodes['y'] > BOUNDS['north']) | (nodes['y'] < BOUNDS['south'])]
    invalid_lon = nodes[(nodes['x'] > BOUNDS['east']) | (nodes['x'] < BOUNDS['west'])]
    
    if len(invalid_lat) > 0 or len(invalid_lon) > 0:
        print(f"[{city_name}] WARNING: Found nodes outside Algeria bounds!")
        print(f"  - Invalid Lats: {len(invalid_lat)}")
        print(f"  - Invalid Lons: {len(invalid_lon)}")
    else:
        print(f"[{city_name}] Coordinates valid within Algeria bounds.")

def main():
    if not DATA_DIR.exists():
        print(f"Directory {DATA_DIR} does not exist. Run extraction first.")
        return

    for graph_file in DATA_DIR.glob("*.graphml"):
        city_name = graph_file.stem.replace('_', ' ').title()
        print(f"\nValidating {city_name}...")
        try:
            G = ox.load_graphml(graph_file)
            validate_coordinates(G, city_name)
            validate_connectivity(G, city_name)
        except Exception as e:
            print(f"Error validating {graph_file}: {e}")

if __name__ == "__main__":
    main()
