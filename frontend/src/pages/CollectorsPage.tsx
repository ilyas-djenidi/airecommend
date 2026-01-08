import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { collectorsApi } from '../services/supabaseApi';
import { Collector } from '../models';
import { Input, Button, Card, Label } from '../components/ui';
import { Truck, Plus, Trash2, Phone, Lock, User, RefreshCw, CheckCircle2 } from 'lucide-react';

export function CollectorsPage() {
    const { collectors, setCollectors } = useStore();
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form state
    const [newCollector, setNewCollector] = useState<Partial<Collector>>({
        id: '',
        name: '',
        password: '',
        phone: '',
        status: 'available',
        shift_start: '08:00',
        shift_end: '16:00'
    });

    const fetchCollectors = async () => {
        setLoading(true);
        try {
            const data = await collectorsApi.list();
            setCollectors(data);
        } catch (error) {
            console.error("Failed to fetch collectors:", error);
            setMessage({ type: 'error', text: 'Failed to load collectors from database.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollectors();
    }, []);

    const handleAddCollector = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollector.id || !newCollector.name || !newCollector.password) {
            setMessage({ type: 'error', text: 'ID, Name, and Password are required.' });
            return;
        }

        setActionLoading('add');
        try {
            await collectorsApi.create(newCollector as any);
            setMessage({ type: 'success', text: `Collector ${newCollector.name} added successfully!` });
            setNewCollector({
                id: '',
                name: '',
                password: '',
                phone: '',
                status: 'available',
                shift_start: '08:00',
                shift_end: '16:00'
            });
            fetchCollectors();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to add collector.' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteCollector = async (id: string) => {
        if (!confirm(`Are you sure you want to delete collector ${id}?`)) return;

        setActionLoading(id);
        try {
            await collectorsApi.delete(id);
            setMessage({ type: 'success', text: 'Collector deleted successfully.' });
            fetchCollectors();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete collector.' });
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Collector Management</h2>
                    <p className="text-slate-500">Manage your collection fleet and individual driver accounts.</p>
                </div>
                <Button variant="secondary" onClick={fetchCollectors} disabled={loading}>
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {message && (
                <div className={`p-4 rounded-md flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={18} /> : <User size={18} />}
                    <span className="text-sm font-medium">{message.text}</span>
                    <button className="ml-auto text-xs font-bold" onClick={() => setMessage(null)}>Close</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Add Form */}
                <Card className="p-6 h-fit lg:col-span-1 border-blue-100 bg-blue-50/30">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <Plus className="text-blue-600" size={20} />
                        Add New Collector
                    </h3>
                    <form onSubmit={handleAddCollector} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500">Collector ID (Unique)</Label>
                            <div className="relative">
                                <Truck className="absolute left-3 top-3 text-slate-400" size={16} />
                                <Input
                                    id="c-id"
                                    placeholder="e.g. COL-001"
                                    className="pl-10"
                                    value={newCollector.id}
                                    onChange={e => setNewCollector({ ...newCollector, id: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={16} />
                                <Input
                                    id="c-name"
                                    placeholder="Ahmed Al-Houssi"
                                    className="pl-10"
                                    value={newCollector.name}
                                    onChange={e => setNewCollector({ ...newCollector, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-slate-400" size={16} />
                                <Input
                                    id="c-pass"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    value={newCollector.password}
                                    onChange={e => setNewCollector({ ...newCollector, password: e.target.value })}
                                />
                            </div>
                        </div>


                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500">Phone (Optional)</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-slate-400" size={16} />
                                <Input
                                    id="c-phone"
                                    placeholder="+213..."
                                    className="pl-10"
                                    value={newCollector.phone}
                                    onChange={e => setNewCollector({ ...newCollector, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full mt-2" disabled={actionLoading === 'add'}>
                            {actionLoading === 'add' ? 'Adding...' : 'Add Collector'}
                        </Button>
                    </form>
                </Card>

                {/* List Table */}
                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden min-h-[400px]">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Collector</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {loading ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400">
                                            <RefreshCw size={24} className="mx-auto animate-spin mb-2" />
                                            Loading collectors...
                                        </td>
                                    </tr>
                                ) : collectors.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">
                                            No collectors found. Add one on the left.
                                        </td>
                                    </tr>
                                ) : (
                                    collectors.map(c => (
                                        <tr key={c.id} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{c.name}</div>
                                                <div className="text-xs text-slate-500 font-mono">{c.id}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${c.status === 'available' ? 'bg-green-100 text-green-700' :
                                                    c.status === 'on_route' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDeleteCollector(c.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                                                    disabled={actionLoading === c.id}
                                                >
                                                    {actionLoading === c.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </Card>
                </div>
            </div>
        </div>
    );
}
