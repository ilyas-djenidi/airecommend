import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { collectorsApi } from '../services/supabaseApi';
import { Collector } from '../models';
import { Input, Button, Card, Label, cn } from '../components/ui';
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
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Premium Header */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-12 text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Truck size={180} className="rotate-12" />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10 backdrop-blur-md">
                        Institutional Fleet Registry
                    </div>
                    <div className="flex justify-between items-end">
                        <div className="space-y-4">
                            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">
                                Collector <span className="text-[var(--primary)]">Management</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                                Curate and monitor the human intelligence nodes of your collection matrix.
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={fetchCollectors}
                            disabled={loading}
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-xs"
                        >
                            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Sync Registry
                        </Button>
                    </div>
                </div>
            </div>

            {message && (
                <div className={cn(
                    "p-6 rounded-[2rem] flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300",
                    message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                )}>
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        message.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
                    )}>
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <User size={20} />}
                    </div>
                    <div className="flex-1">
                        <p className="font-bold tracking-tight">{message.text}</p>
                    </div>
                    <button className="text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity" onClick={() => setMessage(null)}>Dismiss</button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Registration Form Area */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-8 border-slate-100 shadow-xl shadow-black/[0.02] rounded-[2rem] bg-slate-50/50 sticky top-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-white rounded-2xl shadow-sm">
                                <Plus className="text-[var(--primary)]" size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-slate-800 tracking-tighter">New Node Registry</h3>
                                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Enlist personnel</p>
                            </div>
                        </div>

                        <form onSubmit={handleAddCollector} className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset Identifier</Label>
                                <div className="relative group">
                                    <Truck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <Input
                                        placeholder="COL-00X"
                                        className="pl-12 h-14 bg-white rounded-2xl border-slate-100 focus:ring-[var(--primary)]"
                                        value={newCollector.id}
                                        onChange={e => setNewCollector({ ...newCollector, id: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Designation</Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <Input
                                        placeholder="Full Name"
                                        className="pl-12 h-14 bg-white rounded-2xl border-slate-100 focus:ring-[var(--primary)]"
                                        value={newCollector.name}
                                        onChange={e => setNewCollector({ ...newCollector, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Credentials</Label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12 h-14 bg-white rounded-2xl border-slate-100 focus:ring-[var(--primary)]"
                                        value={newCollector.password}
                                        onChange={e => setNewCollector({ ...newCollector, password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Comms Protocol</Label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--primary)] transition-colors" size={18} />
                                    <Input
                                        placeholder="+213..."
                                        className="pl-12 h-14 bg-white rounded-2xl border-slate-100 focus:ring-[var(--primary)]"
                                        value={newCollector.phone}
                                        onChange={e => setNewCollector({ ...newCollector, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[var(--primary)]/10" disabled={actionLoading === 'add'}>
                                {actionLoading === 'add' ? 'Integrating...' : 'Add Collector'}
                            </Button>
                        </form>
                    </Card>
                </div>

                {/* Registry View Area */}
                <div className="lg:col-span-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border border-slate-100 space-y-4">
                            <div className="w-12 h-12 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
                            <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Accessing Fleet Matrix</p>
                        </div>
                    ) : collectors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 space-y-4">
                            <div className="p-6 bg-slate-50 rounded-full text-slate-200">
                                <User size={48} />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-slate-800 text-lg tracking-tighter">No Personnel Found</p>
                                <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Enlist your first collector node to begin operations</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {collectors.map(c => (
                                <div key={c.id} className="group bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-black/[0.05] hover:-translate-y-1 transition-all">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--primary)] group-hover:text-white transition-all overflow-hidden relative">
                                                <span className="font-black text-lg uppercase">{c.name.substring(0, 2)}</span>
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xl text-slate-800 tracking-tighter mb-1">{c.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black bg-slate-50 px-2 py-0.5 rounded-full text-slate-400 uppercase tracking-tighter group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)] transition-colors">{c.id}</span>
                                                    {c.phone && <span className="text-[10px] font-bold text-slate-300">{c.phone}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteCollector(c.id)}
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-200 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                            disabled={actionLoading === c.id}
                                        >
                                            {actionLoading === c.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={18} />}
                                        </button>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-2 h-2 rounded-full",
                                                c.status === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                                                    c.status === 'on_route' ? 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]' :
                                                        'bg-slate-300'
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest",
                                                c.status === 'available' ? 'text-emerald-600' :
                                                    c.status === 'on_route' ? 'text-sky-600' :
                                                        'text-slate-400'
                                            )}>
                                                {c.status?.replace('_', ' ') || 'UNKNOWN'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-slate-300">
                                            <CheckCircle2 size={14} className={c.status === 'available' ? 'text-emerald-400' : ''} />
                                            <span className="text-[10px] font-black uppercase tracking-tighter">Verified</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
