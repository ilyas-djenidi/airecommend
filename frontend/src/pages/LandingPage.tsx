import { BarChart3, TrendingUp, Users, MapPin, Zap, Shield, ArrowRight } from 'lucide-react';
import { Card, cn } from '../components/ui';

export function LandingPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-16 py-8">
            {/* Premium Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[3rem] p-16 text-white shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-20 opacity-10">
                    <Zap size={240} className="rotate-12 animate-pulse" />
                </div>
                <div className="relative z-10 max-w-3xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-emerald-500/20 backdrop-blur-md">
                        <Shield size={12} /> Live Intelligence Network
                    </div>
                    <h1 className="text-6xl lg:text-7xl font-black tracking-tighter leading-[1.1] mb-8">
                        State of <span className="text-[var(--primary)]">M'sila</span> Intelligence Hub
                    </h1>
                    <p className="text-slate-400 font-medium text-xl leading-relaxed mb-10">
                        Synthesizing urban waste dynamics into actionable operational intelligence. Orchestrate your municipal grid with precision-grade AI synthesis.
                    </p>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-3 px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-all cursor-default">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-widest text-slate-300">System Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Network Efficiency', value: '94.2%', icon: BarChart3, color: 'text-emerald-500', trend: '+2.4%', bg: 'bg-emerald-50' },
                    { label: 'Active Collectors', value: '128', icon: Users, color: 'text-blue-500', trend: 'Live', bg: 'bg-blue-50' },
                    { label: 'Zones Managed', value: '24', icon: MapPin, color: 'text-amber-500', trend: 'Global', bg: 'bg-amber-50' },
                    { label: 'AI Optimization', value: '99.9%', icon: TrendingUp, color: 'text-purple-500', trend: 'Max', bg: 'bg-purple-50' },
                ].map((stat, i) => (
                    <Card key={i} className="p-8 border-slate-100 shadow-xl shadow-black/[0.02] rounded-[2.5rem] hover:-translate-y-2 transition-all duration-500 group">
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform", stat.bg, stat.color)}>
                            <stat.icon size={28} />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-50", stat.color)}>{stat.trend}</span>
                            </div>
                            <h4 className="text-4xl font-black text-slate-800 tracking-tighter">{stat.value}</h4>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Quick Actions / Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 p-10 border-slate-100 shadow-xl shadow-black/[0.02] rounded-[3rem] bg-slate-50/50">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tighter mb-2 text-balance leading-none">Operational Bandwidth</h3>
                            <p className="text-sm font-medium text-slate-500 uppercase tracking-tight">Real-time municipal capacity monitoring</p>
                        </div>
                        <div className="p-4 bg-white rounded-2xl shadow-sm">
                            <BarChart3 className="text-[var(--primary)]" size={24} />
                        </div>
                    </div>

                    <div className="space-y-8">
                        {[
                            { zone: 'District Alpha', fill: 'w-[85%]', status: 'Peak' },
                            { zone: 'Sector Bravo', fill: 'w-[62%]', status: 'Stable' },
                            { zone: 'Urban Gamma', fill: 'w-[44%]', status: 'Optimal' }
                        ].map((item, i) => (
                            <div key={i} className="space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-black text-slate-700 uppercase tracking-widest">{item.zone}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.status}</span>
                                </div>
                                <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-slate-100">
                                    <div className={cn("h-full bg-[var(--primary)] rounded-full transition-all duration-1000", item.fill)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-10 border-slate-100 shadow-xl shadow-black/[0.02] rounded-[3rem] bg-[var(--primary)] text-white relative overflow-hidden flex flex-col justify-between group cursor-pointer">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                        <ArrowRight size={120} className="-rotate-45" />
                    </div>
                    <div className="relative z-10">
                        <TrendingUp size={40} className="mb-8" />
                        <h3 className="text-3xl font-black tracking-tighter leading-none mb-4">Run Matrix Simulation</h3>
                        <p className="text-white/70 font-medium text-sm leading-relaxed">Execute predictive analysis on current urban dynamics using second-order AI synthesis.</p>
                    </div>
                    <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex items-center gap-2 group-hover:gap-4 transition-all">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Enter Analysis Probe</span>
                        <ArrowRight size={14} />
                    </div>
                </Card>
            </div>
        </div>
    );
}
