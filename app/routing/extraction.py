import osmnx as ox
import pandas as pd
import geopandas as gpd
from pathlib import Path
import networkx as nx

# Configure ox
ox.settings.use_cache = True
ox.settings.log_console = True

CITIES = {
    "Algiers": "Algiers, Algeria",
    "Oran": "Oran, Algeria",
    "Constantine": "Constantine, Algeria",
    "Annaba": "Annaba, Algeria",
    "Batna": "Batna, Algeria",
    "Blida": "Blida, Algeria",
    "Setif": "Setif, Algeria",
    "Sidi Bel Abbes": "Sidi Bel Abbes, Algeria",
    "Tlemcen": "Tlemcen, Algeria",
    "Ghardaia": "Ghardaia, Algeria"
}

OUTPUT_DIR = Path("data/algeria_networks")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def extract_city_network(city_name, place_query):
    print(f"Extracting network for {city_name}...")
    try:
        # Extract driveable network
        G = ox.graph_from_place(place_query, network_type="drive", simplify=True)
        
        # Add edge speeds and travel times
        G = ox.add_edge_speeds(G)
        G = ox.add_edge_travel_times(G)
        
        # Save graph to GraphML
        output_path = OUTPUT_DIR / f"{city_name.lower().replace(' ', '_')}.graphml"
        ox.save_graphml(G, output_path)
        
        # Convert to GeoDataFrames for inspection/export
        nodes, edges = ox.graph_to_gdfs(G)
        
        print(f"  - Nodes: {len(nodes)}")
        print(f"  - Edges: {len(edges)}")
        print(f"  - Saved to {output_path}")
        
        return G
    except Exception as e:
        print(f"Error extracting {city_name}: {e}")
        return None

def main():
    for city, query in CITIES.items():
        extract_city_network(city, query)

if __name__ == "__main__":
    main()
