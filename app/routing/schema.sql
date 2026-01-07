-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Road Nodes (Intersections)
CREATE TABLE road_nodes (
    id BIGINT PRIMARY KEY,
    osmid BIGINT, -- OpenStreetMap ID
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    geom GEOMETRY(Point, 4326)
);
CREATE INDEX idx_road_nodes_geom ON road_nodes USING GIST(geom);

-- 2. Road Edges (Segments)
CREATE TABLE road_edges (
    u BIGINT REFERENCES road_nodes(id), -- Start Node
    v BIGINT REFERENCES road_nodes(id), -- End Node
    key INT, -- Parallel edge key
    osmid BIGINT[],
    name TEXT,
    highway TEXT, -- primary, secondary, residential, etc.
    oneway BOOLEAN,
    length DOUBLE PRECISION, -- in meters
    speed_kph DOUBLE PRECISION,
    travel_time DOUBLE PRECISION, -- in seconds
    geom GEOMETRY(LineString, 4326),
    PRIMARY KEY (u, v, key)
);
CREATE INDEX idx_road_edges_geom ON road_edges USING GIST(geom);

-- 3. Administrative Zones (Wilayas, Communes)
CREATE TABLE admin_zones (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    admin_level INT, -- 4 for Wilaya, etc.
    geom GEOMETRY(MultiPolygon, 4326)
);
CREATE INDEX idx_admin_zones_geom ON admin_zones USING GIST(geom);

-- 4. Waste Collection Points / Bins
CREATE TABLE waste_points (
    id SERIAL PRIMARY KEY,
    location_name TEXT,
    capacity DOUBLE PRECISION,
    waste_type TEXT, -- plastic, organic, etc.
    geom GEOMETRY(Point, 4326),
    closest_node_id BIGINT REFERENCES road_nodes(id) -- Snap to nearest road node
);
CREATE INDEX idx_waste_points_geom ON waste_points USING GIST(geom);
