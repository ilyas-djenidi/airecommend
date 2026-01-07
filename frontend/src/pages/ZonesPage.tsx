import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Button, Input, Card } from '../components/ui';
import { ZoneCategory, PriorityLabel, Container } from '../models';
import { Trash2, MapPin, Plus, Box, Database, RefreshCw } from 'lucide-react';
import { zonesApi, containersApi, checkDatabaseAvailability, syncZonesToDatabase } from '../services/supabaseApi';

export function ZonesPage() {
    const store = useStore();
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState<ZoneCategory>('RESIDENTIAL_DENSE');
    const [priority, setPriority] = useState<PriorityLabel>('MEDIUM');
    const [notes, setNotes] = useState('');

    // Database state
    const [dbAvailable, setDbAvailable] = useState(false);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Container Form State
    const [activeZoneForContainer, setActiveZoneForContainer] = useState<string | null>(null);
    const [contId, setContId] = useState('');
    const [contLat, setContLat] = useState('36.75');
    const [contLng, setContLng] = useState('3.05');
    const [contType] = useState<any>('bac_a_ordures');
    const [contPrio, setContPrio] = useState<PriorityLabel>('MEDIUM');

    // Load zones from database on mount
    useEffect(() => {
        const loadZones = async () => {
            try {
                const available = await checkDatabaseAvailability();
                setDbAvailable(available);

                if (available) {
                    setLoading(true);
                    const zones = await zonesApi.list();

                    // Load containers for each zone
                    const zonesWithContainers = await Promise.all(
                        zones.map(async (zone: any) => {
                            const containers = await containersApi.list(zone.id);
                            return { ...zone, containers };
                        })
                    );

                    // Update store
                    store.setZones(zonesWithContainers);
                }
            } catch (error) {
                console.error('Failed to load zones:', error);
            } finally {
                setLoading(false);
            }
        };

        loadZones();
    }, []);

    const addZone = async () => {
        if (!id || !name) return;

        const newZone = {
            id, name, category, priority, notes,
            containers: [],
            priority_score: priority === 'CRITICAL' ? 5 : priority === 'HIGH' ? 4 : priority === 'MEDIUM' ? 3 : 2
        };

        // Add to local store
        store.addZone(newZone);

        // Default Schedule
        store.addSchedule({
            zone_id: id,
            service_days: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        });

        // Sync to database
        if (dbAvailable) {
            try {
                await zonesApi.create(newZone);
            } catch (error) {
                console.error('Failed to save zone to database:', error);
                alert('Zone saved locally but failed to sync to database');
            }
        }

        setId(''); setName(''); setNotes('');
    };

    const addContainer = async (zoneId: string) => {
        if (!contId) return;
        const newContainer: Container = {
            id: contId,
            lat: parseFloat(contLat),
            lng: parseFloat(contLng),
            type: contType,
            priority: contPrio,
            zone_id: zoneId
        };

        // Add to local store
        store.addContainerToZone(zoneId, newContainer);

        // Sync to database
        if (dbAvailable) {
            try {
                // Ensure zone exists in DB first
                const zone = store.zones.find(z => z.id === zoneId);
                if (zone) {
                    await zonesApi.create({
                        id: zone.id,
                        name: zone.name,
                        category: zone.category,
                        priority: zone.priority,
                        priority_score: zone.priority_score || 3
                    }).catch(() => {
                        // Ignore if zone already exists
                    });
                }

                await containersApi.create(newContainer);
            } catch (error) {
                console.error('Failed to save container to database:', error);
                // We'll show a more helpful message
                console.info('Individual sync failed, but data is saved locally and can be synced globally.');
            }
        }

        setContId(''); // Clear ID but keep lat/lng for convenience
    };

    const removeZone = async (zoneId: string) => {
        store.removeZone(zoneId);

        if (dbAvailable) {
            try {
                await zonesApi.delete(zoneId);
            } catch (error) {
                console.error('Failed to delete zone from database:', error);
            }
        }
    };

    const syncToDatabase = async () => {
        if (!dbAvailable) {
            alert('Database not available');
            return;
        }

        setSyncing(true);
        try {
            await syncZonesToDatabase(store.zones);
            alert('Data synced successfully!');
        } catch (error) {
            console.error('Sync failed:', error);
            alert('Sync failed - check console for details');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* DATABASE STATUS BANNER */}
            <div className={`p-3 rounded-lg border text-sm flex items-center justify-between ${dbAvailable ? 'bg-green-50 border-green-200 text-green-700' : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                }`}>
                <div className="flex items-center gap-2">
                    <Database size={16} />
                    <span>
                        {loading ? 'Loading zones from database...' :
                            dbAvailable ? `Database connected (${store.zones.length} zones loaded)` :
                                'Database unavailable - using local storage only'}
                    </span>
                </div>
                {dbAvailable && store.zones.length > 0 && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={syncToDatabase}
                        disabled={syncing}
                        className="text-xs h-7"
                    >
                        <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                        {syncing ? 'Syncing...' : 'Sync to DB'}
                    </Button>
                )}
            </div>

            {/* ADD ZONE FORM */}
            <Card className="p-6 bg-slate-50 border-slate-200">
                <h3 className="font-bold text-lg mb-4 text-slate-700">Add New Zone</h3>
                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Zone ID</label>
                        <Input placeholder="e.g. ZN-01" value={id} onChange={e => setId(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Friendly Name</label>
                        <Input placeholder="e.g. Casbah Center" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Category</label>
                        <select
                            className="w-full p-2 border rounded-md text-sm bg-white"
                            value={category}
                            onChange={e => setCategory(e.target.value as ZoneCategory)}
                        >
                            <option value="RESIDENTIAL_DENSE">Residential (Dense)</option>
                            <option value="COMMERCIAL_MARKET">Commercial / Market</option>
                            <option value="INDUSTRIAL">Industrial</option>
                            <option value="OTHER">Other (Hospital/Gov)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Priority</label>
                        <select
                            className="w-full p-2 border rounded-md text-sm bg-white"
                            value={priority}
                            onChange={e => setPriority(e.target.value as PriorityLabel)}
                        >
                            <option value="CRITICAL">CRITICAL (Must Serve)</option>
                            <option value="HIGH">HIGH (Market/VIP)</option>
                            <option value="MEDIUM">MEDIUM (Standard)</option>
                            <option value="LOW">LOW (Deferrable)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <Button onClick={addZone} disabled={!id || !name} className="w-full">
                            <Plus size={16} className="mr-2" /> Add Zone
                        </Button>
                    </div>
                </div>
            </Card>

            {/* ZONES LIST */}
            <div className="space-y-4">
                {store.zones.map(zone => (
                    <Card key={zone.id} className="p-0 overflow-hidden border-l-4 border-l-blue-500">
                        <div className="p-4 flex justify-between items-start bg-white">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg">{zone.name}</h4>
                                    <span className="text-xs font-mono bg-slate-100 px-1 rounded text-slate-500">{zone.id}</span>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded
                                        ${zone.priority === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                                            zone.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                'bg-blue-100 text-blue-600'}`}>
                                        {zone.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500">{zone.category}</p>
                            </div>
                            <Button
                                variant="secondary"
                                onClick={() => removeZone(zone.id)}
                                className="text-red-500 hover:bg-red-50"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>

                        {/* CONTAINER MANAGER SECTION */}
                        <div className="bg-slate-50 p-4 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <h5 className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                                    <Box size={14} /> Containers ({zone.containers?.length || 0})
                                </h5>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setActiveZoneForContainer(activeZoneForContainer === zone.id ? null : zone.id)}
                                    className="h-7 text-xs"
                                >
                                    {activeZoneForContainer === zone.id ? 'Close' : 'Add Container'}
                                </Button>
                            </div>

                            {/* ADD CONTAINER FORM INLINE */}
                            {activeZoneForContainer === zone.id && (
                                <div className="bg-white p-3 rounded border border-blue-200 mb-3 animate-in fade-in slide-in-from-top-2">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
                                        <div className="col-span-1">
                                            <label className="text-[10px] text-slate-400">ID</label>
                                            <Input className="h-8 text-xs" placeholder="B-101" value={contId} onChange={e => setContId(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400">Priority</label>
                                            <select className="h-8 w-full border text-xs rounded" value={contPrio} onChange={e => setContPrio(e.target.value as any)}>
                                                <option value="CRITICAL">Critical</option>
                                                <option value="HIGH">High</option>
                                                <option value="MEDIUM">Medium</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400">Lat</label>
                                            <Input className="h-8 text-xs" value={contLat} onChange={e => setContLat(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-slate-400">Lng</label>
                                            <Input className="h-8 text-xs" value={contLng} onChange={e => setContLng(e.target.value)} />
                                        </div>
                                        <Button onClick={() => addContainer(zone.id)} size="sm" className="h-8">Add</Button>
                                    </div>
                                </div>
                            )}

                            {/* CONTAINER LIST */}
                            {zone.containers && zone.containers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {zone.containers.map(cont => (
                                        <div key={cont.id} className="bg-white border text-sm p-2 rounded flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-slate-400" />
                                                <span className="font-mono font-bold">{cont.id}</span>
                                                <span className="text-xs text-slate-400">({cont.lat}, {cont.lng})</span>
                                            </div>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${cont.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {cont.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-400 italic pl-1">No containers added. Please add containers to enable routing for this zone.</div>
                            )}
                        </div>
                    </Card>
                ))}

                {store.zones.length === 0 && (
                    <div className="text-center p-8 text-slate-400 border-2 border-dashed rounded-xl">
                        No zones configured. Add one manually or load demo data in the "AI Output" tab.
                    </div>
                )}
            </div>
        </div>
    );
}
