-- ============================================
-- AIRECOMMEND - Complete Supabase Schema
-- Waste Management System for Algeria
-- ============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================
-- 1. USERS & AUTHENTICATION
-- ============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'planner', 'collector', 'supervisor')),
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- ============================================
-- 2. ZONES (NEIGHBORHOODS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN (
        'RESIDENTIAL_DENSE',
        'RESIDENTIAL_SPARSE',
        'COMMERCIAL_MARKET',
        'COMMERCIAL_OFFICE',
        'INDUSTRIAL',
        'INSTITUTIONAL',
        'OTHER'
    )),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    priority_score INTEGER DEFAULT 3,
    boundary GEOMETRY(POLYGON, 4326), -- GeoJSON polygon for zone boundary
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    population INTEGER,
    area_km2 DOUBLE PRECISION,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for zones
CREATE INDEX IF NOT EXISTS idx_zones_category ON public.zones(category);
CREATE INDEX IF NOT EXISTS idx_zones_priority ON public.zones(priority);
CREATE INDEX IF NOT EXISTS idx_zones_boundary ON public.zones USING GIST(boundary);

-- RLS for zones
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view zones"
    ON public.zones FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and planners can insert zones"
    ON public.zones FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'planner')
        )
    );

CREATE POLICY "Only admins and planners can update zones"
    ON public.zones FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'planner')
        )
    );

-- ============================================
-- 3. CONTAINERS (BINS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.containers (
    id TEXT PRIMARY KEY,
    zone_id TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location GEOMETRY(POINT, 4326),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    capacity_liters INTEGER DEFAULT 1100,
    type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'recycling', 'organic', 'glass')),
    address TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'full')),
    last_collection TIMESTAMPTZ,
    fill_level_percent INTEGER DEFAULT 0 CHECK (fill_level_percent >= 0 AND fill_level_percent <= 100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for containers
CREATE INDEX IF NOT EXISTS idx_containers_zone ON public.containers(zone_id);
CREATE INDEX IF NOT EXISTS idx_containers_location ON public.containers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_containers_status ON public.containers(status);

-- Trigger to auto-populate location from lat/lng
CREATE OR REPLACE FUNCTION update_container_location()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER container_location_trigger
    BEFORE INSERT OR UPDATE ON public.containers
    FOR EACH ROW
    EXECUTE FUNCTION update_container_location();

-- RLS for containers
ALTER TABLE public.containers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view containers"
    ON public.containers FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and planners can modify containers"
    ON public.containers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'planner')
        )
    );

-- ============================================
-- 4. COLLECTORS (DRIVERS/TRUCKS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.collectors (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    phone TEXT,
    truck_id TEXT,
    truck_capacity_kg INTEGER DEFAULT 5000,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'on_route', 'off_duty', 'maintenance')),
    current_lat DOUBLE PRECISION,
    current_lng DOUBLE PRECISION,
    current_location GEOMETRY(POINT, 4326),
    shift_start TIME DEFAULT '08:00',
    shift_end TIME DEFAULT '16:00',
    avg_speed_kmh DOUBLE PRECISION DEFAULT 25.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for collectors
CREATE INDEX IF NOT EXISTS idx_collectors_status ON public.collectors(status);
CREATE INDEX IF NOT EXISTS idx_collectors_user ON public.collectors(user_id);
CREATE INDEX IF NOT EXISTS idx_collectors_location ON public.collectors USING GIST(current_location);

-- RLS for collectors
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view collectors"
    ON public.collectors FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Collectors can update their own status"
    ON public.collectors FOR UPDATE
    USING (user_id = auth.uid());

-- ============================================
-- 5. BASELINE SCHEDULES
-- ============================================

CREATE TABLE IF NOT EXISTS public.baseline_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    zone_id TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
    frequency TEXT DEFAULT 'once' CHECK (frequency IN ('once', 'twice', 'three_times')),
    preferred_time TIME,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(zone_id, day_of_week)
);

-- RLS for baseline_schedules
ALTER TABLE public.baseline_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view schedules"
    ON public.baseline_schedules FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and planners can modify schedules"
    ON public.baseline_schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'planner')
        )
    );

-- ============================================
-- 6. EVENTS (HOLIDAYS, SPECIAL EVENTS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('holiday', 'ramadan', 'friday_prayer', 'market_day', 'festival', 'other')),
    impact TEXT DEFAULT 'medium' CHECK (impact IN ('low', 'medium', 'high')),
    description TEXT,
    affects_collection BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for events
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- RLS for events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view events"
    ON public.events FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can modify events"
    ON public.events FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- 7. ROUTES (GENERATED DAILY ROUTES)
-- ============================================

CREATE TABLE IF NOT EXISTS public.routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    date DATE NOT NULL,
    collector_id TEXT REFERENCES public.collectors(id),
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    total_distance_km DOUBLE PRECISION DEFAULT 0,
    total_duration_min INTEGER DEFAULT 0,
    total_stops INTEGER DEFAULT 0,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for routes
CREATE INDEX IF NOT EXISTS idx_routes_date ON public.routes(date);
CREATE INDEX IF NOT EXISTS idx_routes_collector ON public.routes(collector_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON public.routes(status);

-- RLS for routes
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view routes"
    ON public.routes FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins and planners can create routes"
    ON public.routes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role IN ('admin', 'planner')
        )
    );

-- ============================================
-- 8. ROUTE STOPS (INDIVIDUAL STOPS IN A ROUTE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.route_stops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    route_id UUID REFERENCES public.routes(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    container_id TEXT REFERENCES public.containers(id),
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    location GEOMETRY(POINT, 4326),
    eta TIME,
    actual_arrival TIMESTAMPTZ,
    travel_time_min INTEGER,
    service_time_min INTEGER DEFAULT 5,
    traffic_level TEXT CHECK (traffic_level IN ('low', 'medium', 'high')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for route_stops
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON public.route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_container ON public.route_stops(container_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_location ON public.route_stops USING GIST(location);

-- Trigger to auto-populate location from lat/lng
CREATE TRIGGER route_stop_location_trigger
    BEFORE INSERT OR UPDATE ON public.route_stops
    FOR EACH ROW
    EXECUTE FUNCTION update_container_location();

-- RLS for route_stops
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view route stops"
    ON public.route_stops FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================
-- 9. WASTE INTELLIGENCE (WPI PREDICTIONS)
-- ============================================

CREATE TABLE IF NOT EXISTS public.waste_predictions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    zone_id TEXT REFERENCES public.zones(id) ON DELETE CASCADE,
    container_id TEXT REFERENCES public.containers(id),
    prediction_date DATE NOT NULL,
    wpi_score DOUBLE PRECISION NOT NULL CHECK (wpi_score >= 0 AND wpi_score <= 1),
    predicted_fill_level INTEGER CHECK (predicted_fill_level >= 0 AND predicted_fill_level <= 100),
    composition JSONB, -- {plastic: 30, organic: 50, paper: 20}
    factors JSONB, -- {ramadan: true, market_day: false, holiday: false}
    confidence DOUBLE PRECISION CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for waste_predictions
CREATE INDEX IF NOT EXISTS idx_waste_pred_zone ON public.waste_predictions(zone_id);
CREATE INDEX IF NOT EXISTS idx_waste_pred_date ON public.waste_predictions(prediction_date);

-- RLS for waste_predictions
ALTER TABLE public.waste_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view predictions"
    ON public.waste_predictions FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================
-- 10. TRAFFIC DATA
-- ============================================

CREATE TABLE IF NOT EXISTS public.traffic_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    from_lat DOUBLE PRECISION NOT NULL,
    from_lng DOUBLE PRECISION NOT NULL,
    to_lat DOUBLE PRECISION NOT NULL,
    to_lng DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    traffic_level TEXT CHECK (traffic_level IN ('low', 'medium', 'high')),
    multiplier DOUBLE PRECISION DEFAULT 1.0,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'osrm', 'api', 'historical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for traffic_data
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON public.traffic_data(timestamp);

-- ============================================
-- 11. ACTIVITY LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id),
    entity_type TEXT NOT NULL, -- 'zone', 'container', 'route', etc.
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'view')),
    changes JSONB,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for activity_logs
CREATE INDEX IF NOT EXISTS idx_activity_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON public.activity_logs(created_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zones_updated_at
    BEFORE UPDATE ON public.zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_containers_updated_at
    BEFORE UPDATE ON public.containers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collectors_updated_at
    BEFORE UPDATE ON public.collectors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at
    BEFORE UPDATE ON public.routes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- INITIAL DATA (OPTIONAL)
-- ============================================

-- Insert default admin user (requires manual password setup in Supabase Auth)
-- This is just a placeholder - actual user creation happens via Supabase Auth UI

-- Sample events (Algerian holidays)
INSERT INTO public.events (name, name_ar, date, type, impact) VALUES
    ('Eid al-Fitr', 'عيد الفطر', '2026-04-10', 'holiday', 'high'),
    ('Eid al-Adha', 'عيد الأضحى', '2026-06-16', 'holiday', 'high'),
    ('Independence Day', 'عيد الاستقلال', '2026-07-05', 'holiday', 'medium'),
    ('Revolution Day', 'ذكرى اندلاع الثورة', '2026-11-01', 'holiday', 'medium')
ON CONFLICT DO NOTHING;

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Active routes with collector info
CREATE OR REPLACE VIEW public.active_routes_view AS
SELECT 
    r.id,
    r.date,
    r.collector_id,
    c.name as collector_name,
    r.status,
    r.total_distance_km,
    r.total_duration_min,
    r.total_stops,
    COUNT(rs.id) as completed_stops
FROM public.routes r
LEFT JOIN public.collectors c ON r.collector_id = c.id
LEFT JOIN public.route_stops rs ON r.id = rs.route_id AND rs.status = 'completed'
WHERE r.status IN ('planned', 'in_progress')
GROUP BY r.id, c.name;

-- View: Container status with zone info
CREATE OR REPLACE VIEW public.container_status_view AS
SELECT 
    c.id,
    c.zone_id,
    z.name as zone_name,
    c.lat,
    c.lng,
    c.priority,
    c.status,
    c.fill_level_percent,
    c.last_collection,
    EXTRACT(DAY FROM NOW() - c.last_collection) as days_since_collection
FROM public.containers c
LEFT JOIN public.zones z ON c.zone_id = z.id;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant access to tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- END OF SCHEMA
-- ============================================

-- To apply this schema:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Copy and paste this entire file
-- 3. Click "Run"
-- 4. Verify tables are created in Table Editor
