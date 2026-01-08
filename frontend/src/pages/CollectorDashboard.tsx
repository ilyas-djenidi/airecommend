import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    Truck,
    Navigation,
    CheckCircle2,
    LocateFixed,
    Maximize,
    Compass,
    MapPin,
    Zap,
    Clock,
    BarChart3,
    Trophy,
    TrendingUp,
    Shield
} from 'lucide-react';
import { Button, cn } from '../components/ui';
import { collectorService } from '../services/collectorService';

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const CENTER: [number, number] = [36.75, 3.05];

const mapStyles = `
    .leaflet-container { background: #020617 !important; }
    .guidance-glow { filter: drop-shadow(0 0 12px rgba(37, 99, 235, 0.8)); }
    .marker-pulse { animation: pulse 2s infinite; }
    @keyframes pulse {
        0% { transform: scale(0.95); opacity: 0.5; }
        70% { transform: scale(1.1); opacity: 0; }
        100% { transform: scale(0.95); opacity: 0; }
    }
`;

function MapController({ centerOn, fitRoute }: { centerOn: [number, number] | null, fitRoute: any }) {
    const map = useMap();
    useEffect(() => {
        if (centerOn) map.setView(centerOn, 17, { animate: true });
    }, [centerOn, map]);

    useEffect(() => {
        if (fitRoute?.stops?.length > 0) {
            const bounds = L.latLngBounds(fitRoute.stops.map((s: any) => [s.lat, s.lng]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [fitRoute, map]);
    return null;
}

export function CollectorDashboard() {
    const [collector, setCollector] = useState<any>(null);
    const [route, setRoute] = useState<any>(null);
    const [routeStep, setRouteStep] = useState(0);
    const [missionStarted, setMissionStarted] = useState(false);
    const [completedStops, setCompletedStops] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculatingPath, setCalculatingPath] = useState(false);
    const [centerTrigger, setCenterTrigger] = useState<[number, number] | null>(null);
    const [fitTrigger, setFitTrigger] = useState<any>(null);
    const [guidanceGeometry, setGuidanceGeometry] = useState<any[]>([]);

    const routeID = 101; // Mock or from context

    useEffect(() => {
        const init = async () => {
            try {
                const c = await collectorService.getCollectorProfile();
                setCollector(c);
                const r = await collectorService.getAssignedRoute(routeID);
                setRoute(r);
                if (r) setFitTrigger(r);
            } catch (err) {
                console.error("Initialization failed", err);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Calculate dynamic guidance path
    useEffect(() => {
        if (!missionStarted || !route) return;

        const fetchGuidance = async () => {
            setCalculatingPath(true);
            try {
                // Simulate road-aware path calculation
                const start = route.stops[routeStep] || route.stops[0];
                const end = route.stops[routeStep + 1] || start;
                const path = await collectorService.getNavPath(start, end);
                setGuidanceGeometry(path);
            } catch (e) {
                console.error("Nav failed", e);
            } finally {
                setCalculatingPath(false);
            }
        };
        fetchGuidance();
    }, [routeStep, missionStarted, route]);

    const handleStartMission = () => {
        setMissionStarted(true);
        if (route?.stops[0]) setCenterTrigger([route.stops[0].lat, route.stops[0].lng]);
    };

    const handleCompleteStop = async () => {
        if (!route) return;
        const currentStop = route.stops[routeStep];
        setCompletedStops(prev => [...prev, currentStop.id]);

        if (routeStep < route.stops.length - 1) {
            setRouteStep(prev => prev + 1);
            const next = route.stops[routeStep + 1];
            setCenterTrigger([next.lat, next.lng]);
        } else {
            setMissionStarted(false);
            alert("Mission Accomplished. All nodes serviced.");
        }
    };

    const handleLogout = () => {
        collectorService.logout();
        window.location.href = '/';
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[var(--background)]">
            <div className="flex flex-col items-center gap-4">
                <Truck size={48} className="text-[var(--primary)] animate-bounce" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--muted-foreground)] animate-pulse">Initializing Urban HUD...</p>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen bg-[var(--background)] font-sans antialiased overflow-hidden">
            <style>{mapStyles}</style>

            {/* Tactical Header */}
            <header className="h-16 bg-[var(--background)] border-b border-[var(--border)] flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-[var(--primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[var(--primary)]/20 rotate-3">
                        <Truck size={22} />
                    </div>
                    <div>
                        <h1 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)] leading-none mb-1">Mandate 0{routeID}</h1>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-[var(--foreground)] tracking-tight">Urban Collector Dashboard</p>
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex flex-col items-end">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Collector Profile</p>
                        <p className="text-xs font-bold text-[var(--foreground)] uppercase tracking-tighter">{collector?.name || 'Authorized User'}</p>
                    </div>
                    <div className="h-8 w-px bg-[var(--border)]" />
                    <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-xl font-black text-[10px] uppercase tracking-widest px-4 border-[var(--border)]">
                        Exit session
                    </Button>
                </div>
            </header>

            <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
                {/* Left: Map Intelligence */}
                <div className="flex-1 relative border-r border-[var(--border)]">
                    <MapContainer
                        center={CENTER}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" subdomains={['mt0', 'mt1', 'mt2', 'mt3']} attribution="Google Hybrid" />

                        {/* Map HUD Overlay */}
                        <div className="absolute top-4 left-4 z-[1000] p-4 bg-[var(--card)]/80 backdrop-blur-md rounded-2xl border border-[var(--border)] shadow-2xl flex items-center gap-4 min-w-[200px]">
                            <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] flex items-center justify-center text-[var(--primary)]">
                                <Compass size={24} className={missionStarted ? "animate-spin-slow" : ""} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)]">Navigation Status</p>
                                <p className="text-sm font-black text-[var(--foreground)]">
                                    {calculatingPath ? "Recalculating..." : missionStarted ? `Heading to Node ${routeStep + 1}` : "Standby for Signal"}
                                </p>
                            </div>
                        </div>

                        {/* Map Controls */}
                        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                            <button onClick={() => setCenterTrigger(CENTER)} className="w-12 h-12 bg-[var(--card)]/90 backdrop-blur-md rounded-xl border border-[var(--border)] shadow-xl flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all">
                                <LocateFixed size={20} />
                            </button>
                            <button onClick={() => setFitTrigger({ ...route })} className="w-12 h-12 bg-[var(--card)]/90 backdrop-blur-md rounded-xl border border-[var(--border)] shadow-xl flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--secondary)] transition-all">
                                <Maximize size={20} />
                            </button>
                        </div>

                        {/* Map Legend */}
                        <div className="absolute bottom-6 left-6 z-[1000] bg-[var(--card)]/95 backdrop-blur-md border border-[var(--border)] p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[180px]">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Visual Legend</p>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-1 bg-[#2563eb] rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                <span className="text-[10px] font-bold text-[var(--foreground)] uppercase">Optimal Trajectory</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-4 h-1 bg-[#2563eb] rounded-full opacity-30" />
                                <span className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase">Secondary Path</span>
                            </div>
                        </div>

                        {route && (
                            <>
                                <MapController centerOn={centerTrigger} fitRoute={fitTrigger} />
                                <Polyline
                                    positions={route.geometry.map((p: any) => [p.lat, p.lng])}
                                    pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.3, dashArray: '10, 10' }}
                                />
                                {guidanceGeometry.length > 0 && (
                                    <Polyline
                                        positions={guidanceGeometry.map(p => [p.lat, p.lng])}
                                        pathOptions={{ color: '#2563eb', weight: 6, lineCap: 'round', lineJoin: 'round' }}
                                        className="guidance-glow"
                                    />
                                )}
                                {route.stops.map((stop: any, idx: number) => {
                                    const isCompleted = completedStops.includes(stop.id);
                                    const isCurrent = routeStep === idx;
                                    return (
                                        <Marker
                                            key={stop.id}
                                            position={[stop.lat, stop.lng]}
                                            icon={L.divIcon({
                                                className: 'custom-div-icon',
                                                html: `
                                                    <div class="relative flex items-center justify-center">
                                                        ${isCurrent ? '<div class="absolute w-full h-full bg-blue-500/20 rounded-full marker-pulse scale-[2.5]"></div>' : ''}
                                                        <div class="w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-xl ${isCompleted ? 'bg-emerald-500 border-emerald-200 text-white' :
                                                        isCurrent ? 'bg-blue-600 border-blue-200 text-white scale-125' :
                                                            'bg-white border-slate-200 text-slate-400'
                                                    } transition-all duration-500">
                                                            <span class="text-[10px] font-black italic">${idx + 1}</span>
                                                        </div>
                                                    </div>
                                                `,
                                                iconSize: [32, 32],
                                                iconAnchor: [16, 16]
                                            })}
                                        >
                                            <Popup>
                                                <div className="p-2">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Node {idx + 1}</p>
                                                    <p className="text-sm font-black text-slate-900">{stop.address}</p>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                })}
                            </>
                        )}
                    </MapContainer>
                </div>

                {/* Right: Mission Control Panel */}
                <div className="w-full md:w-[450px] flex flex-col bg-[var(--background)] shrink-0 z-40 border-l border-[var(--border)] overflow-hidden">
                    <div className="p-8 flex-1 overflow-y-auto space-y-8 no-scrollbar">
                        {/* Driver Performance Matrix */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted-foreground)] flex items-center gap-2">
                                    <BarChart3 size={12} className="text-[var(--primary)]" /> Performance Matrix
                                </h3>
                                <div className="flex items-center gap-2 p-1 px-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <Shield size={10} className="text-emerald-500" />
                                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Active Link</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 mb-4 group-hover:scale-110 transition-transform">
                                        <Trophy size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rank</p>
                                    <div className="flex items-baseline gap-1">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter">Gold</h4>
                                        <span className="text-[10px] font-bold text-amber-500">#04</span>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow group">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4 group-hover:scale-110 transition-transform">
                                        <TrendingUp size={20} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Efficiency</p>
                                    <div className="flex items-baseline gap-1">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tighter">94%</h4>
                                        <span className="text-[10px] font-bold text-emerald-500">+2.4%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Zap size={60} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Mandate Progress</p>
                                <div className="flex justify-between items-end mb-4">
                                    <h4 className="text-3xl font-black tracking-tighter italic">Alpha-0{routeStep + 1}</h4>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black uppercase text-slate-400">Time Elapsed</p>
                                        <p className="font-mono text-sm font-bold tracking-tight">02:24:15</p>
                                    </div>
                                </div>
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[var(--primary)] transition-all duration-1000"
                                        style={{ width: `${(completedStops.length / (route?.stops.length || 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="h-px bg-slate-100" />
                        {!missionStarted ? (
                            <section className="h-full flex flex-col items-center justify-center text-center space-y-8 py-12">
                                <div className="w-24 h-24 bg-[var(--primary)]/10 rounded-[2.5rem] flex items-center justify-center text-[var(--primary)] animate-pulse">
                                    <Zap size={48} />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-black text-[var(--foreground)] tracking-tighter">Engagement Ready</h2>
                                    <p className="text-[var(--muted-foreground)] text-sm max-w-[280px] font-medium leading-relaxed">
                                        Mandate successfully synthesized. Optimal trajectories locked for {route?.stops.length || 0} collection nodes.
                                    </p>
                                </div>
                                <Button size="lg" className="w-full h-16 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-[var(--primary)]/20" onClick={handleStartMission}>
                                    Engage Mandate
                                </Button>
                                <div className="flex items-center gap-2 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-widest">
                                    <Clock size={12} /> Syncing with Central IQ...
                                </div>
                            </section>
                        ) : (
                            <>
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted-foreground)] flex items-center gap-2">
                                            <Navigation size={12} className="text-[var(--primary)]" /> Tactical Objective
                                        </h3>
                                        <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest">
                                            {Math.round((routeStep / (route?.stops.length || 1)) * 100)}% Match
                                        </span>
                                    </div>

                                    <div className="bg-[var(--card)] rounded-[2.5rem] border border-[var(--border)] p-10 shadow-2xl shadow-black/5 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <MapPin size={100} />
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--muted-foreground)] mb-3">Active Destination</p>
                                        <h2 className="text-4xl font-black text-[var(--foreground)] tracking-tighter mb-6 leading-none">
                                            {route?.stops[routeStep]?.address.split(',')[0] || "SYNTHESIZING..."}
                                        </h2>
                                        <div className="flex items-center gap-2 p-3 bg-[var(--secondary)] rounded-xl border border-[var(--border)] w-fit">
                                            <Compass size={14} className="text-[var(--primary)]" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[var(--foreground)]">Node {routeStep + 1} • Alpha Zone</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCompleteStop}
                                        disabled={calculatingPath}
                                        className="w-full h-16 mt-8 rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-[var(--primary)]/20"
                                    >
                                        Mark Synchronized
                                    </Button>
                                </section>

                                <section>
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--muted-foreground)] mb-6">Mission Feed</h3>
                                    <div className="space-y-4">
                                        {route?.stops.map((stop: any, idx: number) => {
                                            const isCompleted = completedStops.includes(stop.id);
                                            const isCurrent = routeStep === idx;
                                            return (
                                                <div
                                                    key={stop.id}
                                                    className={cn(
                                                        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                                                        isCurrent ? "bg-[var(--card)] border-[var(--primary)] translate-x-1 shadow-lg shadow-[var(--primary)]/5" :
                                                            isCompleted ? "bg-[var(--secondary)]/50 border-transparent opacity-60" :
                                                                "bg-transparent border-[var(--border)]"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black",
                                                        isCompleted ? "bg-emerald-500 text-white" :
                                                            isCurrent ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" :
                                                                "bg-[var(--secondary)] text-[var(--muted-foreground)]"
                                                    )}>
                                                        {isCompleted ? <CheckCircle2 size={16} /> : idx + 1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-[10px] font-bold uppercase tracking-widest mb-0.5",
                                                            isCurrent ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"
                                                        )}>Node Trace {idx + 1}</p>
                                                        <p className="text-xs font-black text-[var(--foreground)] truncate">{stop.address}</p>
                                                    </div>
                                                    {isCurrent && <Zap size={14} className="text-yellow-500 animate-pulse" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
