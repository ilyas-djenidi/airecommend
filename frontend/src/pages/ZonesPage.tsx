import { useState } from 'react';
import { useStore } from '../store';
import { Button, Input, Card } from '../components/ui';
import { Zone, ZoneCategory, PriorityLabel, Container } from '../models';
import { Trash2, MapPin, Plus, Box } from 'lucide-react';

export function ZonesPage() {
    const store = useStore();
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState<ZoneCategory>('RESIDENTIAL_DENSE');
    const [priority, setPriority] = useState<PriorityLabel>('MEDIUM');
    const [notes, setNotes] = useState('');

    // Container Form State
    const [activeZoneForContainer, setActiveZoneForContainer] = useState<string | null>(null);
    const [contId, setContId] = useState('');
    const [contLat, setContLat] = useState('36.75');
    const [contLng, setContLng] = useState('3.05');
    const [contType, setContType] = useState<any>('bac_a_ordures');
    const [contPrio, setContPrio] = useState<PriorityLabel>('MEDIUM');

    const addZone = () => {
        if (!id || !name) return;
        store.addZone({
            id, name, category, priority, notes,
            containers: []
        });
        // Default Schedule: Service every day for new manual zones to ensure they appear
        store.addSchedule({
            zone_id: id,
            service_days: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
        });
        setId(''); setName(''); setNotes('');
    };

    const addContainer = (zoneId: string) => {
        if (!contId) return;
        const newContainer: Container = {
            id: contId,
            lat: parseFloat(contLat),
            lng: parseFloat(contLng),
            type: contType,
            priority: contPrio,
            zone_id: zoneId
        };
        store.addContainerToZone(zoneId, newContainer);
        setContId(''); // Clear ID but keep lat/lng for convenience
    };

    return (
        <div className="space-y-8">
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
                                onClick={() => store.removeZone(zone.id)}
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
