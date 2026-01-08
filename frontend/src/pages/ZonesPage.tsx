import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Button, Input, Card, cn } from '../components/ui';
import { ZoneCategory, PriorityLabel, Container } from '../models';
import { Trash2, MapPin, Plus, Box, Settings } from 'lucide-react';
import { zonesApi, containersApi, checkDatabaseAvailability } from '../services/supabaseApi';

export function ZonesPage() {
    const store = useStore();
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState<ZoneCategory>('RESIDENTIAL_DENSE');
    const [priority, setPriority] = useState<PriorityLabel>('MEDIUM');
    const [notes, setNotes] = useState('');

    // Database state
    const [dbAvailable, setDbAvailable] = useState(false);

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
                // Done loading
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

    // Auto-sync is handled per-action now

    return (
        <div className="space-y-8">
            {/* ADD ZONE FORM */}
            <Card className="p-10 border-slate-100 shadow-xl shadow-black/[0.02] rounded-[2rem] bg-slate-50/50">
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <Plus className="text-[var(--primary)]" size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-2xl text-slate-800 tracking-tighter">Add Intelligence Area</h3>
                        <p className="text-slate-500 text-sm font-medium">Initialize a new administrative zone for AI dispatch.</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Universal ID</label>
                        <Input
                            placeholder="e.g. MS-01"
                            className="bg-white rounded-xl border-slate-100 h-12 px-4 focus:ring-[var(--primary)]"
                            value={id}
                            onChange={e => setId(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Strategic Name</label>
                        <Input
                            placeholder="e.g. M'sila Center"
                            className="bg-white rounded-xl border-slate-100 h-12 px-4 focus:ring-[var(--primary)]"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Zone Category</label>
                        <select
                            className="w-full h-12 px-4 border border-slate-100 rounded-xl text-sm bg-white focus:ring-[var(--primary)] outline-none font-bold text-slate-700"
                            value={category}
                            onChange={e => setCategory(e.target.value as ZoneCategory)}
                        >
                            <option value="RESIDENTIAL_DENSE">Residential (Dense)</option>
                            <option value="COMMERCIAL_MARKET">Commercial / Market</option>
                            <option value="INDUSTRIAL">Industrial</option>
                            <option value="OTHER">Other (Hospital/Gov)</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mission Priority</label>
                        <select
                            className="w-full h-12 px-4 border border-slate-100 rounded-xl text-sm bg-white focus:ring-[var(--primary)] outline-none font-bold text-slate-700"
                            value={priority}
                            onChange={e => setPriority(e.target.value as PriorityLabel)}
                        >
                            <option value="CRITICAL">CRITICAL (Real-time)</option>
                            <option value="HIGH">HIGH (Standard High)</option>
                            <option value="MEDIUM">MEDIUM (Standard)</option>
                            <option value="LOW">LOW (Optimized Delay)</option>
                        </select>
                    </div>
                    <div className="md:col-span-2 pt-2">
                        <Button
                            onClick={addZone}
                            disabled={!id || !name}
                            className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--primary)]/10"
                        >
                            <Plus size={18} className="mr-2" /> Initialize Zone
                        </Button>
                    </div>
                </div>
            </Card>

            {/* ZONES LIST */}
            <div className="grid grid-cols-1 gap-6">
                {store.zones.map(zone => (
                    <div key={zone.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-8 flex justify-between items-center bg-slate-50/50">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black",
                                    zone.priority === 'CRITICAL' ? "bg-rose-500 shadow-lg shadow-rose-200" :
                                        zone.priority === 'HIGH' ? "bg-orange-500 shadow-lg shadow-orange-200" :
                                            "bg-blue-500 shadow-lg shadow-blue-200"
                                )}>
                                    {zone.id.substring(0, 2)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-black text-xl text-slate-800 tracking-tight">{zone.name}</h4>
                                        <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full tracking-tighter
                                            ${zone.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-600' :
                                                zone.priority === 'HIGH' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-blue-100 text-blue-600'}`}>
                                            {zone.priority}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold">
                                        <span className="uppercase tracking-widest">{zone.category}</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span>{zone.containers?.length || 0} Assets</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => removeZone(zone.id)}
                                className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        {/* CONTAINER MANAGER SECTION */}
                        <div className="p-8 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-6">
                                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                    <Box size={14} className="text-[var(--primary)]" /> Infrastructure Assets
                                </h5>
                                <button
                                    onClick={() => setActiveZoneForContainer(activeZoneForContainer === zone.id ? null : zone.id)}
                                    className="text-[10px] font-black uppercase tracking-widest text-[var(--primary)] bg-[var(--primary)]/5 px-4 py-2 rounded-xl hover:bg-[var(--primary)]/10 transition-colors"
                                >
                                    {activeZoneForContainer === zone.id ? 'Discard' : '+ Monitor Unit'}
                                </button>
                            </div>

                            {/* ADD CONTAINER FORM INLINE */}
                            {activeZoneForContainer === zone.id && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6 animate-in zoom-in-95 duration-200">
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                                        <div className="col-span-1 space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit ID</label>
                                            <Input className="h-10 text-xs rounded-xl" placeholder="B-101" value={contId} onChange={e => setContId(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weighting</label>
                                            <select className="h-10 w-full border border-slate-100 rounded-xl text-xs font-bold px-2 bg-white outline-none" value={contPrio} onChange={e => setContPrio(e.target.value as any)}>
                                                <option value="CRITICAL">Critical</option>
                                                <option value="HIGH">High</option>
                                                <option value="MEDIUM">Medium</option>
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Latitude</label>
                                            <Input className="h-10 text-xs rounded-xl" value={contLat} onChange={e => setContLat(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Longitude</label>
                                            <Input className="h-10 text-xs rounded-xl" value={contLng} onChange={e => setContLng(e.target.value)} />
                                        </div>
                                        <Button onClick={() => addContainer(zone.id)} size="sm" className="h-10 rounded-xl font-black uppercase tracking-widest text-[10px]">Deploy</Button>
                                    </div>
                                </div>
                            )}

                            {/* CONTAINER LIST */}
                            {zone.containers && zone.containers.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {zone.containers.map(cont => (
                                        <div key={cont.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex justify-between items-center group hover:border-[var(--primary)]/30 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[var(--primary)]">
                                                    <MapPin size={14} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-xs tracking-tight">{cont.id}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{cont.lat.toFixed(3)}, {cont.lng.toFixed(3)}</p>
                                                </div>
                                            </div>
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter ${cont.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {cont.priority}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-10 text-slate-300 font-bold italic text-sm border-2 border-dashed border-slate-50 rounded-2xl">
                                    <Box size={32} className="mb-2 opacity-20" />
                                    No infrastructure monitoring units detected.
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {store.zones.length === 0 && (
                    <div className="text-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-200">
                            <Settings size={32} />
                        </div>
                        <div className="max-w-xs">
                            <h5 className="font-black text-slate-800 text-lg tracking-tight mb-1">Architecture Empty</h5>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed">No zones configured for this municipality. Initialize your first intelligence area above.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
