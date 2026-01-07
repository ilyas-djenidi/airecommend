import { useState } from 'react';
import { useStore } from '../store';
import { Button, Input, Card } from '../components/ui';
import { DailyPlan } from '../models';
import { RealDecisionEngine } from '../realDecisionEngine';
import { Truck, MapPin, Navigation, Clock, AlertTriangle, Database } from 'lucide-react';
import { DEMO_ZONES, DEMO_SCHEDULE, DEMO_RESOURCES, DEMO_EVENTS, DEMO_SEASONS } from '../demoData';

export function CollectorDashboard() {
    const store = useStore();
    const [selectedCollectorId, setSelectedCollectorId] = useState<string>("C1");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [plans, setPlans] = useState<DailyPlan[]>([]);
    const [loading, setLoading] = useState(false);

    const loadDemoData = () => {
        if (confirm("This will load Algiers Demo Data. Continue?")) {
            store.setZones(DEMO_ZONES);
            store.setSchedule(DEMO_SCHEDULE);
            store.setResources(DEMO_RESOURCES);
            store.setEvents(DEMO_EVENTS);
            store.setSeasons(DEMO_SEASONS);
            runOptimization();
        }
    };

    const runOptimization = async () => {
        if (store.zones.length === 0) return;
        setLoading(true);

        try {
            const engine = new RealDecisionEngine(store.zones, store.resources);
            const result = await engine.generatePlan(startDate);
            setPlans([result]);
        } catch (e) {
            console.error(e);
            alert("Live AI optimization failed. Ensure backend is running at http://localhost:8000");
        } finally {
            setLoading(false);
        }
    };

    const currentPlan = plans.find(p => p.date === startDate);
    const myRoute = currentPlan?.routes.find(r => r.collector_id === selectedCollectorId);
    const trafficAdvice = currentPlan?.traffic_advice || [];

    const getZoneName = (containerId: string) => {
        const zone = store.zones.find(z => z.containers?.some(c => c.id === containerId));
        return zone ? zone.name : 'Unknown Zone';
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Truck className="text-blue-600" />
                        Collector Dashboard - Live AI
                    </h2>
                    <p className="text-slate-500">Real-time route optimization powered by AI backend.</p>
                    <div className="text-xs text-slate-400 mt-1">
                        Debug: {store.zones.length} Zones, {store.zones.reduce((acc, z) => acc + (z.containers?.length || 0), 0)} Containers.
                        Routes Found: {plans.find(p => p.date === startDate)?.routes.map(r => r.collector_id).join(', ') || 'None'}
                    </div>
                </div>

                <div className="flex flex-col gap-2 items-end">

                    <div className="flex items-center gap-2">
                        <select
                            className="border rounded px-2 py-1 text-sm bg-slate-50"
                            value={selectedCollectorId}
                            onChange={e => setSelectedCollectorId(e.target.value)}
                        >
                            <option value="C1">Collector 1 (C1)</option>
                            <option value="C2">Collector 2 (C2)</option>
                            <option value="C3">Collector 3 (C3)</option>
                        </select>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-auto"
                        />
                        <Button onClick={runOptimization} disabled={store.zones.length === 0 || loading}>
                            {loading ? 'Running...' : 'Update'}
                        </Button>
                    </div>
                    {store.zones.length === 0 && (
                        <Button onClick={loadDemoData} variant="secondary" className="w-full">
                            <Database size={14} className="mr-2 inline" /> Load Demo Data
                        </Button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            {plans.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded border border-dashed">
                    <p>No active shift data found for this date.</p>
                    <p className="text-sm mt-2">Please load data or select a valid date.</p>
                </div>
            ) : !myRoute ? (
                <div className="text-center py-12 text-slate-400 bg-slate-50 rounded border border-dashed">
                    <p>No route assigned to <strong>{selectedCollectorId}</strong> on {startDate}.</p>
                    <p className="text-sm mt-2">You may be off-duty or on standby.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Route Summary & Traffic */}
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <Card className="p-4 bg-blue-50 border-blue-100">
                            <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                <Clock size={18} /> Shift Overview
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Start Time:</span>
                                    <span className="font-mono font-bold">08:00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Est. Finish:</span>
                                    <span className="font-mono font-bold">{myRoute.summary.finish_time}</span>
                                </div>
                                <div className="border-t border-blue-200 my-2"></div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Stops:</span>
                                    <span className="font-bold">{myRoute.stops.length} Containers</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Total Distance:</span>
                                    <span className="font-bold">{myRoute.summary.distance_km} km</span>
                                </div>
                            </div>
                        </Card>



                        {/* AI Traffic Advice */}
                        <Card className="p-4 border-yellow-200 bg-yellow-50">
                            <h3 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                <AlertTriangle size={18} /> AI Traffic Advice
                            </h3>
                            {trafficAdvice.length > 0 ? (
                                <div className="space-y-3">
                                    {trafficAdvice.map((advice, i) => (
                                        <div key={i} className="text-sm bg-white p-3 rounded border border-yellow-100 shadow-sm">
                                            <p className="text-slate-800 font-medium mb-1">{advice.recommendation_en}</p>
                                            <p className="text-slate-500 text-xs" dir="rtl">{advice.recommendation_ar}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-yellow-700 italic">No specific traffic warnings for this route.</p>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Stop List (The Route) */}
                    <div className="lg:col-span-2">
                        <Card className="h-full">
                            <div className="p-4 border-b bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Navigation size={18} className="text-blue-600" />
                                    Route Navigation
                                </h3>
                            </div>
                            <div className="p-4 space-y-0">
                                {myRoute.stops.map((stop, index) => (
                                    <div key={stop.seq} className="flex gap-4 pb-6 relative last:pb-0">
                                        {/* Timeline Line */}
                                        {index !== myRoute.stops.length - 1 && (
                                            <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-slate-200"></div>
                                        )}

                                        {/* Timeline Dot */}
                                        <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-sm font-bold text-blue-600 text-sm">
                                            {index + 1}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-slate-800">
                                                        Container {stop.container_id} <span className="text-slate-500 font-normal text-sm">({getZoneName(stop.container_id)})</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                        <MapPin size={12} /> {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-mono font-bold text-blue-600">{stop.eta}</div>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide
                                                        ${stop.traffic_level === 'high' ? 'bg-red-100 text-red-600' :
                                                            stop.traffic_level === 'medium' ? 'bg-orange-100 text-orange-600' :
                                                                'bg-green-100 text-green-600'}`}>
                                                        {stop.traffic_level} Traffic
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
