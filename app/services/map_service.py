"""
Professional Algerian Waste Management Map Service
Generates advanced visualizations using Folium
"""

import folium
from folium import plugins
from typing import List, Dict, Any, Optional
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Algerian Geographic Constants
ALGERIA_CENTER = [28.0339, 1.6596]
ALGIERS_CENTER = [36.7538, 3.0588]
ALGERIA_BOUNDS = [[18.9, -8.7], [37.1, 12.0]]  # Southwest, Northeast

class AlgerianWasteMapService:
    """
    Professional waste management map generator for Algeria
    Supports multiple visualization types and export formats
    """
    
    def __init__(self, center: List[float] = None, zoom: int = 6):
        """Initialize the map service"""
        self.center = center or ALGERIA_CENTER
        self.zoom = zoom
        self.map = None
        
    def create_base_map(
        self, 
        tile_layer: str = 'OpenStreetMap',
        dark_mode: bool = False
    ) -> folium.Map:
        """
        Create base map with Algerian styling
        
        Args:
            tile_layer: Map tile provider
            dark_mode: Use dark theme
        """
        # Create map
        self.map = folium.Map(
            location=self.center,
            zoom_start=self.zoom,
            tiles=None,  # We'll add custom tiles
            control_scale=True,
            prefer_canvas=True,
            max_bounds=True,
            min_zoom=5,
            max_zoom=18
        )
        
        # Add tile layers
        if dark_mode:
            folium.TileLayer(
                tiles='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
                attr='&copy; CARTO',
                name='Dark Mode',
                overlay=False,
                control=True
            ).add_to(self.map)
        else:
            folium.TileLayer(
                tiles='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attr='&copy; OpenStreetMap',
                name='Street Map',
                overlay=False,
                control=True
            ).add_to(self.map)
        
        # Add satellite layer
        folium.TileLayer(
            tiles='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attr='&copy; ESRI',
            name='Satellite',
            overlay=False,
            control=True
        ).add_to(self.map)
        
        # Add fullscreen button
        plugins.Fullscreen(
            position='topleft',
            force_separate_button=True
        ).add_to(self.map)
        
        # Add measure control
        plugins.MeasureControl(
            position='topleft',
            primary_length_unit='kilometers',
            primary_area_unit='square kilometers'
        ).add_to(self.map)
        
        return self.map
    
    def add_zones(self, zones: List[Dict[str, Any]]) -> None:
        """
        Add waste collection zones with styling
        
        Args:
            zones: List of zone dictionaries with id, name, boundary, priority
        """
        if not self.map:
            self.create_base_map()
        
        # Create feature group for zones
        zone_group = folium.FeatureGroup(name='Zones (مناطق الجمع)')
        
        for zone in zones:
            # Determine color by priority
            color_map = {
                'CRITICAL': '#dc2626',  # Red
                'HIGH': '#ea580c',      # Orange
                'MEDIUM': '#2563eb',    # Blue
                'LOW': '#16a34a'        # Green
            }
            color = color_map.get(zone.get('priority', 'MEDIUM'), '#2563eb')
            
            # Create polygon if boundary exists
            if zone.get('boundary'):
                folium.GeoJson(
                    zone['boundary'],
                    name=zone.get('name', zone['id']),
                    style_function=lambda x, c=color: {
                        'fillColor': c,
                        'color': c,
                        'weight': 2,
                        'fillOpacity': 0.2,
                        'opacity': 0.8
                    },
                    highlight_function=lambda x: {
                        'weight': 4,
                        'fillOpacity': 0.4
                    },
                    tooltip=folium.Tooltip(
                        f"""
                        <div dir="rtl" style="font-family: Arial; font-size: 14px;">
                            <b>{zone.get('name', zone['id'])}</b><br>
                            الأولوية: {zone.get('priority', 'MEDIUM')}<br>
                            الفئة: {zone.get('category', 'N/A')}
                        </div>
                        """,
                        sticky=True
                    )
                ).add_to(zone_group)
            else:
                # Create circle marker if no boundary
                if zone.get('center_lat') and zone.get('center_lng'):
                    folium.CircleMarker(
                        location=[zone['center_lat'], zone['center_lng']],
                        radius=15,
                        color=color,
                        fill=True,
                        fillColor=color,
                        fillOpacity=0.3,
                        popup=folium.Popup(
                            f"<b>{zone.get('name', zone['id'])}</b>",
                            max_width=200
                        )
                    ).add_to(zone_group)
        
        zone_group.add_to(self.map)
    
    def add_containers(
        self, 
        containers: List[Dict[str, Any]],
        cluster: bool = True
    ) -> None:
        """
        Add waste containers to map
        
        Args:
            containers: List of container dictionaries
            cluster: Use marker clustering for performance
        """
        if not self.map:
            self.create_base_map()
        
        if cluster:
            # Use marker cluster for better performance
            marker_cluster = plugins.MarkerCluster(
                name='Containers (حاويات النفايات)',
                overlay=True,
                control=True,
                icon_create_function="""
                function(cluster) {
                    var count = cluster.getChildCount();
                    var size = count < 10 ? 'small' : count < 50 ? 'medium' : 'large';
                    return L.divIcon({
                        html: '<div><span>' + count + '</span></div>',
                        className: 'marker-cluster marker-cluster-' + size,
                        iconSize: L.point(40, 40)
                    });
                }
                """
            )
            
            for container in containers:
                # Icon color by priority
                priority = str(container.get('priority', 'MEDIUM')).upper()
                if priority == 'CRITICAL':
                    icon_color = 'red'
                elif priority == 'HIGH':
                    icon_color = 'orange'
                elif priority == 'LOW':
                    icon_color = 'green'
                else:
                    icon_color = 'blue'  # MEDIUM
                
                # Create marker
                folium.Marker(
                    location=[container['lat'], container['lng']],
                    icon=folium.Icon(
                        color=icon_color,
                        icon='trash',
                        prefix='fa'
                    ),
                    popup=folium.Popup(
                        f"""
                        <div dir="rtl" style="font-family: Arial;">
                            <h4>{container['id']}</h4>
                            <p><b>نسبة الامتلاء:</b> {container.get('fill_level_percent', 0)}%</p>
                            <p><b>الأولوية:</b> {container.get('priority', 'MEDIUM')}</p>
                            <p><b>الحالة:</b> {container.get('status', 'active')}</p>
                        </div>
                        """,
                        max_width=250
                    ),
                    tooltip=f"Container {container['id']} ({container.get('fill_level_percent', 0)}%)"
                ).add_to(marker_cluster)
            
            marker_cluster.add_to(self.map)
        else:
            # Add individual markers
            container_group = folium.FeatureGroup(name='Containers')
            
            for container in containers:
                fill = container.get('fill_level_percent', 0)
                
                folium.CircleMarker(
                    location=[container['lat'], container['lng']],
                    radius=8,
                    color='red' if fill >= 90 else 'orange' if fill >= 70 else 'green',
                    fill=True,
                    fillOpacity=0.7,
                    popup=f"Container {container['id']}"
                ).add_to(container_group)
            
            container_group.add_to(self.map)
    
    def add_routes(
        self, 
        routes: List[Dict[str, Any]],
        animated: bool = True
    ) -> None:
        """
        Add collection routes to map
        
        Args:
            routes: List of route dictionaries
            animated: Use animated polylines
        """
        if not self.map:
            self.create_base_map()
        
        route_group = folium.FeatureGroup(name='Routes (مسارات الشاحنات)')
        
        colors = ['blue', 'red', 'green', 'purple', 'orange', 'darkblue', 'darkred']
        
        for idx, route in enumerate(routes):
            color = colors[idx % len(colors)]
            
            # Extract coordinates from stops
            coordinates = [[stop['lat'], stop['lng']] for stop in route.get('stops', [])]
            
            if not coordinates:
                continue
            
            if animated:
                # Animated route
                plugins.AntPath(
                    coordinates,
                    color=color,
                    weight=4,
                    opacity=0.8,
                    delay=800,
                    dash_array=[10, 20],
                    pulse_color='white',
                    popup=folium.Popup(
                        f"""
                        <div dir="rtl">
                            <h4>الشاحنة: {route.get('collector_id', 'N/A')}</h4>
                            <p>عدد المحطات: {len(route.get('stops', []))}</p>
                            <p>المسافة: {route.get('summary', {}).get('distance_km', 0)} كم</p>
                        </div>
                        """,
                        max_width=200
                    )
                ).add_to(route_group)
            else:
                # Regular polyline
                folium.PolyLine(
                    coordinates,
                    color=color,
                    weight=3,
                    opacity=0.8,
                    popup=f"Route: {route.get('collector_id', 'N/A')}"
                ).add_to(route_group)
            
            # Add numbered markers for stops
            for seq, stop in enumerate(route.get('stops', []), 1):
                folium.Marker(
                    location=[stop['lat'], stop['lng']],
                    icon=folium.DivIcon(
                        html=f"""
                        <div style="
                            background-color: {color};
                            color: white;
                            border-radius: 50%;
                            width: 24px;
                            height: 24px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            font-size: 12px;
                            border: 2px solid white;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
                        ">{seq}</div>
                        """
                    ),
                    tooltip=f"Stop {seq}: {stop.get('container_id', 'N/A')}"
                ).add_to(route_group)
        
        route_group.add_to(self.map)
    
    def add_wpi_heatmap(
        self, 
        wpi_data: List[Dict[str, Any]],
        radius: int = 25
    ) -> None:
        """
        Add Waste Pressure Index (WPI) heatmap
        
        Args:
            wpi_data: List of dictionaries with lat, lng, wpi_score
            radius: Heatmap radius in pixels
        """
        if not self.map:
            self.create_base_map()
        
        # Prepare heat data
        heat_data = [
            [point['lat'], point['lng'], point.get('wpi_score', 0.5)]
            for point in wpi_data
        ]
        
        # Create heatmap
        plugins.HeatMap(
            heat_data,
            name='WPI Heatmap (خريطة الضغط)',
            min_opacity=0.3,
            max_zoom=13,
            radius=radius,
            blur=15,
            gradient={
                0.0: 'blue',
                0.3: 'cyan',
                0.5: 'lime',
                0.7: 'yellow',
                1.0: 'red'
            },
            overlay=True,
            control=True
        ).add_to(self.map)
    
    def add_real_time_tracking(
        self, 
        collectors: List[Dict[str, Any]]
    ) -> None:
        """
        Add real-time collector tracking markers
        
        Args:
            collectors: List of collector dictionaries with current_lat, current_lng
        """
        if not self.map:
            self.create_base_map()
        
        truck_group = folium.FeatureGroup(name='Live Tracking (تتبع حي)')
        
        for collector in collectors:
            if not collector.get('current_lat') or not collector.get('current_lng'):
                continue
            
            # Truck icon with pulsing effect
            folium.Marker(
                location=[collector['current_lat'], collector['current_lng']],
                icon=folium.Icon(
                    color='blue',
                    icon='truck',
                    prefix='fa'
                ),
                popup=folium.Popup(
                    f"""
                    <div dir="rtl">
                        <h4>🚛 {collector.get('name', collector['id'])}</h4>
                        <p><b>الحالة:</b> {collector.get('status', 'unknown')}</p>
                        <p><b>السرعة:</b> {collector.get('avg_speed_kmh', 25)} كم/س</p>
                    </div>
                    """,
                    max_width=200
                )
            ).add_to(truck_group)
            
            # Add circle around truck for visibility
            folium.Circle(
                location=[collector['current_lat'], collector['current_lng']],
                radius=100,
                color='blue',
                fill=True,
                fillOpacity=0.2,
                opacity=0.5
            ).add_to(truck_group)
        
        truck_group.add_to(self.map)
    
    def add_legend(self, items: Dict[str, str]) -> None:
        """
        Add custom legend to map
        
        Args:
            items: Dictionary of label -> color
        """
        if not self.map:
            self.create_base_map()
        
        # Create HTML legend
        legend_html = '''
        <div style="
            position: fixed;
            bottom: 50px; right: 50px;
            width: 200px;
            background-color: white;
            border: 2px solid grey;
            z-index: 9999;
            font-size: 14px;
            padding: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        ">
        <h4 style="margin-top: 0;">Legend</h4>
        '''
        
        for label, color in items.items():
            legend_html += f'''
            <p style="margin: 5px 0;">
                <i style="background:{color};width:20px;height:20px;display:inline-block;border-radius:3px;"></i> 
                {label}
            </p>
            '''
        
        legend_html += '</div>'
        
        self.map.get_root().html.add_child(folium.Element(legend_html))
    
    def save(self, filepath: str = 'algerian_waste_map.html') -> str:
        """
        Save map to HTML file
        """
        if not self.map:
            raise ValueError("No map created. Call create_base_map() first.")
        
        # Add layer control
        logger.info("Adding layer control...")
        folium.LayerControl(position='topright', collapsed=False).add_to(self.map)
        
        # Save map
        logger.info(f"Saving Folium map to {filepath}...")
        self.map.save(filepath)
        logger.info("Folium map saved successfully.")
        
        return filepath
    
    def to_html(self) -> str:
        """
        Get map as HTML string
        
        Returns:
            HTML string
        """
        if not self.map:
            raise ValueError("No map created. Call create_base_map() first.")
        
        return self.map._repr_html_()


# Convenience function for quick map generation
def generate_algerian_waste_map(
    zones: List[Dict] = None,
    containers: List[Dict] = None,
    routes: List[Dict] = None,
    wpi_data: List[Dict] = None,
    collectors: List[Dict] = None,
    output_file: str = 'waste_map.html',
    dark_mode: bool = False
) -> str:
    """
    Quick map generation function
    
    Args:
        zones: Zone data
        containers: Container data
        routes: Route data
        wpi_data: WPI heatmap data
        collectors: Collector tracking data
        output_file: Output HTML file path
        dark_mode: Use dark theme
        
    Returns:
        Path to generated HTML file
    """
    # Initialize map service
    logger.info("Quick map generation started")
    map_service = AlgerianWasteMapService(center=ALGIERS_CENTER, zoom=10)
    map_service.create_base_map(dark_mode=dark_mode)
    
    # Add layers if provided
    if zones:
        logger.info(f"Adding {len(zones)} zones to map")
        map_service.add_zones(zones)
    
    if containers:
        logger.info(f"Adding {len(containers)} containers to map")
        map_service.add_containers(containers, cluster=True)
    
    if routes:
        logger.info(f"Adding {len(routes)} routes to map")
        map_service.add_routes(routes, animated=True)
    
    if wpi_data:
        logger.info(f"Adding {len(wpi_data)} WPI data points to map")
        map_service.add_wpi_heatmap(wpi_data)
    
    if collectors:
        logger.info(f"Adding {len(collectors)} collector positions to map")
        map_service.add_real_time_tracking(collectors)
    
    # Add legend
    map_service.add_legend({
        'Critical Priority': '#dc2626',
        'High Priority': '#ea580c',
        'Medium Priority': '#2563eb',
        'Low Priority': '#16a34a'
    })
    
    # Save and return
    result = map_service.save(output_file)
    logger.info("Quick map generation finished")
    return result
