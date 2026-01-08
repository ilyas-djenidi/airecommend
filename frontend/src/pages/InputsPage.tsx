import { useState } from 'react';
import { ZonesPage } from './ZonesPage';
import { SchedulePage } from './SchedulePage';
import { ResourcesPage } from './ResourcesPage';
import { EventsPage } from './EventsPage';
import { cn } from '../components/ui';
import { Settings } from 'lucide-react';

type Tab = 'zones' | 'schedule' | 'resources' | 'events';

export function InputsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('zones');

    const tabs: { id: Tab, label: string, description: string }[] = [
        { id: 'zones', label: 'Zones', description: 'Neighborhood mapping & prioritization' },
        { id: 'schedule', label: 'Schedule', description: 'Weekly collection cadence logic' },
        { id: 'resources', label: 'Fleet', description: 'Operational bandwidth control' },
        { id: 'events', label: 'Calendar', description: 'Cultural & climate adjustments' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-12 text-white">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Settings size={180} className="animate-spin-slow" />
                </div>
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-white/10 backdrop-blur-md">
                        Institutional Grid Controller
                    </div>
                    <h2 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-4">
                        System <span className="text-[var(--primary)]">Architect</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                        Orchestrate the structural parameters of your municipal grid with precision-grade AI synthesis.
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                {/* Navigation Sidebar */}
                <aside className="w-full lg:w-72 shrink-0 space-y-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "w-full text-left p-4 rounded-2xl border transition-all group",
                                activeTab === tab.id
                                    ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20"
                                    : "bg-white border-slate-100 hover:border-slate-300 text-slate-600"
                            )}
                        >
                            <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest mb-1",
                                activeTab === tab.id ? "text-white/60" : "text-slate-400 group-hover:text-slate-600"
                            )}>{tab.label}</p>
                            <p className="text-sm font-bold tracking-tight">{tab.description}</p>
                        </button>
                    ))}
                </aside>

                {/* Content Area */}
                <main className="flex-1 bg-white rounded-[2rem] border border-slate-100 p-8 lg:p-12 shadow-sm">
                    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                        {activeTab === 'zones' && <ZonesPage />}
                        {activeTab === 'schedule' && <SchedulePage />}
                        {activeTab === 'resources' && <ResourcesPage />}
                        {activeTab === 'events' && <EventsPage />}
                    </div>
                </main>
            </div>
        </div>
    );
}
