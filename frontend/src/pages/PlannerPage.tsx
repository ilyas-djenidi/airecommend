import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { RealDecisionEngine } from '../realDecisionEngine';
import { Button, Input, Card } from '../components/ui';
import { DailyPlan } from '../models';
import { Download, Copy, RefreshCw, Database, AlertTriangle } from 'lucide-react';
import { DEMO_ZONES, DEMO_SCHEDULE, DEMO_RESOURCES, DEMO_EVENTS, DEMO_SEASONS } from '../demoData';

export function PlannerPage() {
    const store = useStore();
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [plans, setPlans] = useState<DailyPlan[]>([]);
    const [expandedDay, setExpandedDay] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [dbLoading, setDbLoading] = useState(false);

    // Load data from database on mount
    useEffect(() => {
        const syncWithDB = async () => {
            try {
                const { checkDatabaseAvailability, zonesApi, containersApi } = await import('../services/supabaseApi');
                const available = await checkDatabaseAvailability();

                if (available) {
                    setDbLoading(true);
                    const { collectorsApi } = await import('../services/supabaseApi');

                    const zones = await zonesApi.list();
                    const zonesWithContainers = await Promise.all(
                        zones.map(async (zone: any) => {
                            const containers = await containersApi.list(zone.id);
                            return { ...zone, containers };
                        })
                    );
                    store.setZones(zonesWithContainers);

                    const collectors = await collectorsApi.list();
                    store.setCollectors(collectors);
                }
            } catch (error) {
                console.error("Failed to sync planner with DB:", error);
            } finally {
                setDbLoading(false);
            }
        };

        syncWithDB();
    }, []);

    const loadDemoData = () => {
        if (confirm("This will load Algiers Demo Data. Continue?")) {
            store.setZones(DEMO_ZONES);
            store.setSchedule(DEMO_SCHEDULE);
            store.setResources(DEMO_RESOURCES);
            store.setEvents(DEMO_EVENTS);
            store.setSeasons(DEMO_SEASONS);
        }
    };

    const runPlanner = async () => {
        if (store.zones.length === 0) {
            alert("Please add zones first (or load demo data).");
            return;
        }

        setLoading(true);
        const generatedPlans: DailyPlan[] = [];

        try {
            // Generate plan for 7 days using Live AI backend
            for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
                const targetDate = new Date(startDate);
                targetDate.setDate(targetDate.getDate() + dayOffset);
                const dateStr = targetDate.toISOString().split('T')[0];

                const engine = new RealDecisionEngine(store.zones, { ...store.resources, collectors: store.collectors });
                const dailyPlan = await engine.generatePlan(dateStr);
                generatedPlans.push(dailyPlan);
            }

            setPlans(generatedPlans);

            // AUTO-SYNC: Sync to database immediately so drivers see it
            console.log("Auto-syncing plans to database...");
            for (const dayPlanned of generatedPlans) {
                if (dayPlanned.routes.length > 0) {
                    await publishPlan(dayPlanned, true);
                }
            }
        } catch (error) {
            console.error("AI Planning failed:", error);
            alert("Live AI optimization failed. Ensure backend is running at http://localhost:8000");
        } finally {
            setLoading(false);
        }
    };

    const copyJson = () => {
        navigator.clipboard.writeText(JSON.stringify(plans, null, 2));
        alert('JSON copied to clipboard!');
    };

    const downloadJson = () => {
        const blob = new Blob([JSON.stringify(plans, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `waste_collection_plan_${startDate}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const publishPlan = async (dayPlan: DailyPlan, silent: boolean = false) => {
        try {
            if (!silent) setLoading(true);
            const response = await fetch(`/api/planner/publish`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dayPlan.date,
                    routes: dayPlan.routes
                })
            });

            if (response.ok) {
                if (!silent) alert(`Plan for ${dayPlan.date} published to collector dashboards!`);
            } else {
                const err = await response.json();
                if (!silent) alert(`Failed to publish: ${err.detail || 'Unknown error'}`);
                else console.error(`Auto-publish failed for ${dayPlan.date}:`, err);
            }
        } catch (error) {
            console.error("Publish failed:", error);
            if (!silent) alert("Connection error while publishing.");
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const getZoneName = (containerId: string) => {
        const zone = store.zones.find(z => z.containers?.some(c => c.id === containerId));
        return zone ? zone.name : 'Unknown Zone';
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold">AI Planner - Live Optimization</h2>
                    <p className="text-slate-500">7-day route planning powered by AI backend (real TSP + composition WPI).</p>
                </div>
                <div className="flex item-center gap-2">
                    {dbLoading && <span className="text-xs text-blue-500 animate-pulse flex items-center mr-2">Syncing DB...</span>}
                    <Input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-auto"
                    />
                    <Button onClick={runPlanner} disabled={store.zones.length === 0 || loading || dbLoading}>
                        <RefreshCw size={16} className={`mr-2 inline ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Optimizing...' : 'Generate Plan'}
                    </Button>
                    <Button onClick={loadDemoData} variant="secondary" disabled={loading || dbLoading}>
                        <Database size={16} className="mr-2 inline" />
                        Load Demo Data
                    </Button>
                </div>
            </div>

            {plans.length > 0 && (
                <>
                    <div className="flex gap-2 mb-4">
                        <Button variant="secondary" onClick={copyJson} className="text-xs">
                            <Copy size={14} className="mr-2 inline" /> Copy JSON Output
                        </Button>
                        <Button variant="secondary" onClick={downloadJson} className="text-xs">
                            <Download size={14} className="mr-2 inline" /> Download JSON
                        </Button>
                    </div>


                </>
            )}

            <div className="space-y-4">
                {plans.map((day, idx) => (
                    <Card key={day.date} className="p-0 overflow-hidden">
                        <div
                            className={`p-4 border-b flex justify-between items-center cursor-pointer hover:bg-slate-100 ${day.warnings && day.warnings.length > 0 ? 'bg-red-50' : 'bg-slate-50'}`}
                            onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                        >
                            <div>
                                <span className="font-bold text-lg mr-3">{day.date}</span>
                                {/* Holiday Badge */}
                                {day.decisions.some(d => d.reasoning_trace.event) && (
                                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold mr-2">
                                        Holiday Detected
                                    </span>
                                )}
                                <span className="text-slate-500 text-sm">
                                    {day.routes.length} Active Routes
                                </span>
                            </div>
                            <div className="text-sm text-slate-500 flex items-center gap-4">
                                {day.routes.length > 0 && (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-8 text-[10px] bg-blue-600 text-white hover:bg-blue-700 border-none px-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            publishPlan(day);
                                        }}
                                        disabled={loading}
                                    >
                                        Publish to Dashboard
                                    </Button>
                                )}
                                {day.warnings && day.warnings.length > 0 ? (
                                    <span className="text-red-600 font-bold flex items-center whitespace-nowrap">
                                        <AlertTriangle size={16} className="mr-1" /> Error
                                    </span>
                                ) : (
                                    <span className="whitespace-nowrap">{day.decisions.filter(d => d.action !== 'SKIP').length} Zones Serviced</span>
                                )}
                            </div>
                        </div>

                        {(expandedDay === day.date || idx === 0) && (
                            <div className="p-4 bg-slate-50">
                                {/* WARNINGS SECTION */}
                                {day.warnings && day.warnings.length > 0 && (
                                    <div className="mb-6 bg-red-100 border border-red-200 text-red-700 p-3 rounded text-sm">
                                        <h4 className="font-bold mb-1">Optimization Failed:</h4>
                                        <ul className="list-disc pl-5">
                                            {day.warnings.map((w, i) => (
                                                <li key={i}>{w}</li>
                                            ))}
                                        </ul>
                                        <p className="mt-2 text-xs text-red-600">
                                            Please ensure the Backend is running and containers are added to zones.
                                        </p>
                                    </div>
                                )}

                                {/* TRAFFIC ADVICE SECTION */}
                                {day.traffic_advice.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <h4 className="text-xs font-bold uppercase text-slate-400">Traffic Intelligence</h4>
                                        {day.traffic_advice.map((advice, i) => (
                                            <div key={i} className="bg-yellow-50 border border-yellow-200 p-3 rounded-md flex gap-3 text-sm">
                                                <AlertTriangle className="text-yellow-600 shrink-0" size={18} />
                                                <div>
                                                    <div className="text-slate-800 font-medium">{advice.recommendation_en}</div>
                                                    <div className="text-slate-500 text-xs mt-1" dir="rtl">{advice.recommendation_ar}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* ROUTES DETAIL SECTION */}
                                {day.routes.length > 0 ? (
                                    <>
                                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Generated Routes</h4>
                                        <div className="space-y-3">
                                            {day.routes.map((route) => (
                                                <div key={route.collector_id} className="bg-white border rounded-md p-4 shadow-sm">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="font-bold text-blue-700">{route.collector_id}</div>
                                                        <div className="text-xs text-slate-500">
                                                            {route.summary.total_min} mins • {route.summary.distance_km} km • Ends {route.summary.finish_time}
                                                        </div>
                                                    </div>
                                                    <div className="relative border-l-2 border-slate-200 ml-2 space-y-4 py-2">
                                                        {route.stops.map((stop) => (
                                                            <div key={stop.seq} className="relative pl-6">
                                                                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></div>
                                                                <div className="flex justify-between text-sm">
                                                                    <div>
                                                                        <span className="font-semibold text-slate-800">
                                                                            Container {stop.container_id} <span className="text-slate-500 font-normal">({getZoneName(stop.container_id)})</span>
                                                                        </span>
                                                                        <div className="text-xs text-slate-400">
                                                                            {stop.lat}, {stop.lng}
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="font-mono font-bold">{stop.eta}</span>
                                                                        <div className={`text-[10px] px-1 rounded ${stop.traffic_level === 'high' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                                            {stop.traffic_level} traffic
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    !day.warnings?.length && <p className="text-slate-400 italic text-sm">No routes generated.</p>
                                )}
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
