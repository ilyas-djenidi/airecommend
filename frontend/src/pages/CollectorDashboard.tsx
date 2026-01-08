import { useState, useEffect, useRef } from 'react';
import { Truck, CheckCircle, Clock, Navigation, LogOut, LocateFixed, Maximize } from 'lucide-react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom CSS for Ant-style animation and Eco-theme
const mapStyles = `
  @keyframes dash {
    to {
      stroke-dashoffset: -20;
    }
  }
  .ant-path {
    stroke-dasharray: 12, 12;
    animation: dash 0.6s linear infinite;
    filter: drop-shadow(0 0 12px rgba(0, 255, 65, 0.9)) drop-shadow(0 0 4px rgba(0, 255, 65, 0.5));
  }
  .guidance-glow {
    filter: blur(6px);
    opacity: 0.8;
  }
  .map-legend {
    background: rgba(15, 23, 42, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    padding: 12px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    font-size: 11px;
    font-weight: 700;
    z-index: 1000;
    pointer-events: none;
  }
  .locate-me-btn {
    background: white;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    border: 1px solid #e2e8f0;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .locate-me-btn:hover {
    background: #f8fafc;
    transform: scale(1.05);
  }
  .locate-me-btn:active {
    transform: scale(0.95);
  }
  .glass-panel {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(16, 185, 129, 0.1);
  }
  .mission-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: white;
    border: 1px solid #e2e8f0;
  }
  .mission-card:hover {
    transform: translateX(4px);
    border-color: #10b981 !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
  }
  .stop-number {
     background: #f0fdf4;
     color: #059669;
     border: 1px solid #d1fae5;
  }
  .active-mission-card {
    border-color: #10b981 !important;
    background: #f0fdf4 !important;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
  }
`;

// Static Map Manager - Only fits bounds once
function StaticMapViewManager({ route }: { route: any }) {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (route && route.stops && route.stops.length > 0 && !hasCentered.current) {
            const bounds = L.latLngBounds(route.stops.map((s: any) => [s.lat, s.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
            hasCentered.current = true;
        }
    }, [route, map]);
    return null;
}

// Map Controller for dynamic movement and bounds
function MapController({ centerOn, fitRoute }: { centerOn: [number, number] | null, fitRoute: any }) {
    const map = useMap();

    useEffect(() => {
        if (centerOn) {
            map.setView(centerOn, 16, { animate: true });
        }
    }, [centerOn, map]);

    useEffect(() => {
        if (fitRoute && fitRoute.stops && fitRoute.stops.length > 0) {
            const bounds = L.latLngBounds(fitRoute.stops.map((s: any) => [s.lat, s.lng]));
            map.fitBounds(bounds, { padding: [80, 80], animate: true });
        }
    }, [fitRoute, map]);

    return null;
}

export function CollectorDashboard() {
    const [collector, setCollector] = useState<any>(null);
    const [route, setRoute] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [calculatingPath, setCalculatingPath] = useState(false);
    const [completedStops, setCompletedStops] = useState<Set<number>>(new Set());
    const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
    const [centerTrigger, setCenterTrigger] = useState<[number, number] | null>(null);
    const [fitTrigger, setFitTrigger] = useState<any>(null);
    const [missionStarted, setMissionStarted] = useState(false);
    const [guidanceGeometry, setGuidanceGeometry] = useState<any[]>([]);

    const lastGuidanceFetch = useRef<number>(0);

    useEffect(() => {
        // Track collector's geolocation
        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => setCurrentPos([pos.coords.latitude, pos.coords.longitude]),
                (err) => console.error("Geo error:", err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, []);

    // Fetch Road Guidance ONLY when mission is started
    useEffect(() => {
        if (!missionStarted || !route?.stops) {
            if (!missionStarted) setGuidanceGeometry([]);
            return;
        }

        // Professional GPS Fallback for guidance
        const activeLat = currentPos ? currentPos[0] : 36.75;
        const activeLng = currentPos ? currentPos[1] : 3.05;

        const now = Date.now();
        const isInitialStart = missionStarted && lastGuidanceFetch.current === 0;
        if (!isInitialStart && now - lastGuidanceFetch.current < 3000) return; // 3s throttle for active mission

        const nextStop = route.stops.find((s: any) => !completedStops.has(s.seq));
        let targetLat, targetLng;

        if (nextStop) {
            targetLat = nextStop.lat;
            targetLng = nextStop.lng;
        } else if (completedStops.size === route.stops.length && route.geometry) {
            // Mission Return
            targetLat = route.geometry[0].lat;
            targetLng = route.geometry[0].lng;
        }

        if (targetLat && targetLng) {
            fetch(`/api/maps/route?start_lat=${activeLat}&start_lng=${activeLng}&end_lat=${targetLat}&end_lng=${targetLng}`)
                .then(res => res.json())
                .then(data => {
                    if (data.geometry) {
                        console.log("Guidance path updated:", data.geometry.length, "points");
                        setGuidanceGeometry(data.geometry);
                        lastGuidanceFetch.current = now;
                    }
                });
        }
    }, [currentPos, route, completedStops, missionStarted]);

    useEffect(() => {
        const info = localStorage.getItem('collector_info');
        if (info) {
            const parsed = JSON.parse(info);
            setCollector(parsed);
            fetchRoute(parsed.id);
        } else {
            window.location.href = '/collector/login';
        }
    }, []);

    const fetchRoute = async (id: string) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/collectors/${id}/today`);
            const data = await response.json();
            if (response.ok) {
                setCalculatingPath(true);
                setTimeout(() => {
                    setRoute(data);
                    setCalculatingPath(false);
                }, 1500);
            }
        } catch (error) {
            console.error("Failed to fetch collector route:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleStartMission = async () => {
        if (!collector) return;

        // Ensure we have a start location for AI sequence logic (GPS or fallback)
        const startLat = currentPos?.[0] || 36.75;
        const startLng = currentPos?.[1] || 3.05;

        try {
            setCalculatingPath(true);
            // AI Pro Choice: Re-fetch current route with dynamic positioning for nearest-first logic
            const response = await fetch(`/api/collectors/${collector.id}/today?lat=${startLat}&lng=${startLng}`);
            const data = await response.json();

            if (response.ok) {
                setRoute(data);
                console.log("AI Re-optimization successful");
            } else {
                console.warn("AI Re-optimization failed, proceeding with original route");
            }
        } catch (error) {
            console.error("AI Re-optimization logic error:", error);
        } finally {
            setMissionStarted(true);
            setCalculatingPath(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('collector_token');
        localStorage.removeItem('collector_info');
        window.location.href = '/collector/login';
    };

    const toggleStop = (seq: number) => {
        setCompletedStops(prev => {
            const next = new Set(prev);
            if (next.has(seq)) next.delete(seq);
            else next.add(seq);
            return next;
        });
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
            <div className="text-emerald-900 text-xl font-black uppercase tracking-tighter italic">Initializing Portal...</div>
            <div className="text-emerald-600 text-xs font-bold animate-pulse">Syncing Road Network & Mission Parameters (First load may take a minute)</div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-white font-sans overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-emerald-100 p-4 flex items-center justify-between shadow-sm z-50">
                <div className="flex items-center space-x-3">
                    <div className="bg-emerald-600 p-2 rounded-lg shadow-md shadow-emerald-200">
                        <Truck className="text-white w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-emerald-900 font-bold leading-tight uppercase tracking-wide text-sm">Collector Operations</h1>
                        <p className="text-emerald-600 text-[10px] font-bold">ID: {collector?.id} | {collector?.name}</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="text-emerald-400 hover:text-red-500 transition-colors bg-emerald-50 p-2 rounded-full">
                    <LogOut className="w-5 h-5" />
                </button>
            </header>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden divide-x divide-emerald-50">
                {/* Map Section */}
                <div className="flex-1 relative bg-slate-50 overflow-hidden">
                    {route ? (
                        <MapContainer
                            center={[36.75, 3.05]}
                            zoom={13}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <style>{mapStyles}</style>
                            <TileLayer
                                url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                                attribution="&copy; Google"
                            />

                            {/* Priority Legend Overlay */}
                            <div className="absolute bottom-6 left-6 map-legend flex flex-col space-y-2">
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                                    <span className="uppercase tracking-widest leading-none">Critical Priority (3)</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
                                    <span className="uppercase tracking-widest leading-none">High Priority (1)</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                                    <span className="uppercase tracking-widest leading-none">Medium Priority (3)</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-full bg-slate-300 shadow-[0_0_8px_rgba(255,255,255,0.8)]"></div>
                                    <span className="uppercase tracking-widest leading-none">Low Priority (0)</span>
                                </div>
                                <div className="h-px bg-white/10 my-1"></div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-3 h-3 rounded-[2px] bg-[#00ff41] shadow-[0_0_8px_rgba(0,255,65,0.8)]"></div>
                                    <span className="uppercase tracking-widest leading-none">Active Guidance</span>
                                </div>
                            </div>

                            {/* Map Control Overlays */}
                            <div className="absolute top-24 right-4 z-[1000] flex flex-col space-y-2">
                                <button
                                    onClick={() => setCenterTrigger(currentPos || [36.75, 3.05])}
                                    className="w-10 h-10 p-0 rounded-lg locate-me-btn"
                                    title="Locate Me"
                                >
                                    <LocateFixed className="w-5 h-5 text-emerald-600" />
                                </button>
                                <button
                                    onClick={() => setFitTrigger({ ...route })}
                                    className="w-10 h-10 p-0 rounded-lg locate-me-btn shadow-md"
                                    title="Show Full Path"
                                >
                                    <Maximize className="w-5 h-5 text-emerald-600" />
                                </button>
                            </div>

                            <StaticMapViewManager route={route} />
                            <MapController centerOn={centerTrigger} fitRoute={fitTrigger} />

                            {/* High-Contrast Mission Route */}
                            {route.geometry && (
                                <Polyline
                                    positions={route.geometry.map((p: any) => [p.lat, p.lng])}
                                    color="#022c22"
                                    weight={8}
                                    opacity={0.8}
                                    lineJoin="round"
                                />
                            )}

                            {/* High-Visibility Neon Guidance Path */}
                            {guidanceGeometry.length > 0 && missionStarted && (
                                <>
                                    {/* Outer Glow Layer */}
                                    <Polyline
                                        positions={guidanceGeometry.map((p: any) => [p.lat, p.lng])}
                                        color="#22c55e"
                                        weight={12}
                                        opacity={0.4}
                                        className="guidance-glow"
                                        lineJoin="round"
                                    />
                                    {/* Main Neon Path */}
                                    <Polyline
                                        positions={guidanceGeometry.map((p: any) => [p.lat, p.lng])}
                                        color="#00ff41"
                                        weight={6}
                                        opacity={1}
                                        className="ant-path shadow-2xl"
                                        lineJoin="round"
                                    />
                                </>
                            )}

                            {/* Current Position Marker */}
                            {currentPos && (
                                <Marker
                                    position={currentPos}
                                    icon={L.divIcon({
                                        className: '',
                                        html: `
                                            <div class="relative flex items-center justify-center w-6 h-6">
                                                <div class="absolute w-6 h-6 bg-emerald-500 rounded-full animate-ping opacity-25"></div>
                                                <div class="w-3 h-3 bg-emerald-600 rounded-full border-2 border-white shadow-lg"></div>
                                            </div>
                                        `,
                                        iconAnchor: [12, 12]
                                    })}
                                />
                            )}

                            {/* Start/End Landmarks */}
                            {route.geometry && route.geometry.length > 0 && (
                                <>
                                    <Marker
                                        position={[route.geometry[0].lat, route.geometry[0].lng]}
                                        icon={L.divIcon({
                                            className: '',
                                            html: `
                                                <div class="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 border-2 border-white shadow-xl text-white">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                                                </div>
                                            `,
                                            iconSize: [40, 40],
                                            iconAnchor: [20, 20]
                                        })}
                                    />
                                    <Marker
                                        position={[route.geometry[route.geometry.length - 1].lat, route.geometry[route.geometry.length - 1].lng]}
                                        icon={L.divIcon({
                                            className: '',
                                            html: `
                                                <div class="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-900 border-2 border-emerald-400 shadow-xl text-emerald-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                                                </div>
                                            `,
                                            iconSize: [40, 40],
                                            iconAnchor: [20, 20]
                                        })}
                                    />
                                </>
                            )}

                            {/* Interactive Stop Markers with High-Contrast Neon Styling */}
                            {route.stops?.map((stop: any) => (
                                <Marker
                                    key={stop.seq}
                                    position={[stop.lat, stop.lng]}
                                    icon={L.divIcon({
                                        className: '',
                                        html: `
                                            <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-[0_0_10px_rgba(0,0,0,0.5)] ${completedStops.has(stop.seq) ? 'bg-emerald-500 opacity-60' : 'bg-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.6)]'} text-black font-black text-xs">
                                                ${stop.seq}
                                            </div>
                                        `,
                                        iconSize: [32, 32],
                                        iconAnchor: [16, 16]
                                    })}
                                />
                            ))}
                        </MapContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-emerald-500 text-lg bg-white italic font-medium">
                            Synthesizing Mission Parameters...
                        </div>
                    )}
                </div>

                {/* Mission Control Section */}
                <div className="flex-1 bg-white overflow-y-auto z-20 flex flex-col shadow-inner">
                    <div className="p-6 flex-1 space-y-6">
                        <div className="flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-emerald-900 text-2xl font-black uppercase tracking-tighter flex items-center">
                                    <Navigation className="w-6 h-6 mr-2 text-emerald-600" />
                                    Mission Control
                                </h2>
                                <div className="flex items-center">
                                    {missionStarted && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping mr-2"></div>}
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border-2 shadow-sm transition-all duration-500 ${missionStarted ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-slate-400 border-slate-100'}`}>
                                        {missionStarted ? 'Mission In Progress' : 'Optimal Path Secured'}
                                    </span>
                                </div>
                            </div>

                            {!missionStarted && (
                                <button
                                    onClick={handleStartMission}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black py-4 rounded-2xl shadow-xl shadow-emerald-200/50 flex items-center justify-center transition-all transform active:scale-[0.98] group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                    <Navigation className="w-5 h-5 mr-3 group-hover:rotate-45 transition-transform relative z-10" />
                                    <span className="relative z-10">START SUGGESTED OPTIMAL PATH</span>
                                </button>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 transition-colors hover:bg-emerald-50">
                                    <p className="text-emerald-500 text-[10px] uppercase font-black mb-1">Est. Duration</p>
                                    <p className="text-emerald-900 text-2xl font-black">{(route?.total_duration_min || route?.summary?.total_min) || 50} <span className="text-xs font-bold text-emerald-600">min</span></p>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 transition-colors hover:bg-emerald-50">
                                    <p className="text-emerald-500 text-[10px] uppercase font-black mb-1">Total Distance</p>
                                    <p className="text-emerald-900 text-2xl font-black">{(route?.total_distance_km || route?.summary?.distance_km || 6.2).toFixed(1)} <span className="text-xs font-bold text-emerald-600">km</span></p>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 transition-colors hover:bg-emerald-50">
                                    <p className="text-emerald-500 text-[10px] uppercase font-black mb-1">Total Stops</p>
                                    <p className="text-emerald-900 text-2xl font-black">{route?.stops?.length || 6}</p>
                                </div>
                                <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 transition-colors hover:bg-emerald-50">
                                    <p className="text-emerald-500 text-[10px] uppercase font-black mb-1">Completed</p>
                                    <p className="text-emerald-600 text-2xl font-black">{completedStops.size} / {route?.stops?.length || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Stop List with Conditional Highlighting */}
                        <div className="space-y-4">
                            <h3 className="text-emerald-900/40 text-[10px] font-black uppercase tracking-[0.2em] px-1">Active Route Progression</h3>
                            <div className="space-y-2">
                                {route?.stops?.map((stop: any) => {
                                    const isNext = !completedStops.has(stop.seq) &&
                                        (completedStops.size === 0 ? stop.seq === 1 : !completedStops.has(stop.seq) && Array.from(completedStops).every(s => s < stop.seq));
                                    const isActiveHighlight = missionStarted && isNext;

                                    return (
                                        <div
                                            key={stop.seq}
                                            onClick={() => toggleStop(stop.seq)}
                                            className={`mission-card p-5 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between ${completedStops.has(stop.seq)
                                                ? 'bg-emerald-50/50 border-emerald-200 opacity-60'
                                                : isActiveHighlight ? 'active-mission-card border-emerald-500 border-2 shadow-emerald-200/50 transform scale-[1.02]' : 'bg-white shadow-sm border-slate-100'
                                                }`}
                                        >
                                            <div className="flex items-center space-x-5">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg transition-colors ${completedStops.has(stop.seq) ? 'bg-emerald-100 text-emerald-700' : 'stop-number shadow-sm'
                                                    }`}>
                                                    {stop.seq}
                                                </div>
                                                <div>
                                                    <p className={`font-black tracking-tight text-base ${completedStops.has(stop.seq) ? 'text-emerald-900/40 line-through' : 'text-emerald-900'}`}>
                                                        {stop.container_id}
                                                    </p>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <div className="flex items-center text-emerald-500 text-[10px] font-black uppercase italic">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            <span>Arrival: {stop.eta}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            {completedStops.has(stop.seq) ? (
                                                <CheckCircle className="text-emerald-500 w-7 h-7" />
                                            ) : isActiveHighlight ? (
                                                <div className="flex flex-col items-end">
                                                    <div className="bg-emerald-600 text-white text-[9px] font-black px-3 py-1 rounded-full animate-bounce uppercase tracking-tighter">Navigate</div>
                                                    <div className="text-[10px] text-emerald-600 font-bold mt-1">Shortest Path</div>
                                                </div>
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-emerald-100"></div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading Animation */}
            {calculatingPath && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-xl">
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-8">
                            <div className="absolute inset-0 border-8 border-emerald-50 rounded-full"></div>
                            <div className="absolute inset-0 border-8 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            <div className="absolute inset-4 bg-emerald-600/10 rounded-full flex items-center justify-center">
                                <Truck className="text-emerald-600 w-12 h-12" />
                            </div>
                        </div>
                        <h2 className="text-emerald-900 text-3xl font-black mb-3 tracking-tighter uppercase font-sans">AI Logic Sync</h2>
                        <div className="flex items-center justify-center space-y-1">
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-0"></div>
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-150"></div>
                            <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-300"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
