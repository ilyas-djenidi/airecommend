import { useState } from 'react';
import { ZonesPage } from './ZonesPage';
import { SchedulePage } from './SchedulePage';
import { ResourcesPage } from './ResourcesPage';
import { EventsPage } from './EventsPage';
import { cn } from '../components/ui';
import { Settings, Map, Calendar, Truck, Clock, LucideIcon } from 'lucide-react';

type Tab = 'zones' | 'schedule' | 'resources' | 'events';

export function InputsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('zones');

    const tabs: { id: Tab, label: string, icon: LucideIcon, description: string }[] = [
        { id: 'zones', label: 'Zones', icon: Map, description: 'Neighborhood mapping & prioritization' },
        { id: 'schedule', label: 'Schedule', icon: Calendar, description: 'Weekly collection cadence logic' },
        { id: 'resources', label: 'Fleet', icon: Truck, description: 'Operational bandwidth control' },
        { id: 'events', label: 'Calendar', icon: Clock, description: 'Cultural & climate adjustments' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-10">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-12 text-white shadow-2xl shadow-slate-200">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Settings size={180} className="animate-spin-slow" />
                </div>
                <div className="relative z-10">
                    <div className="flex justify-between items-end">
                        <div className="space-y-4">
                            <h2 className="text-5xl lg:text-6xl font-black tracking-tighter leading-none">
                                System <span className="text-[var(--primary)]">Architect</span>
                            </h2>
                            <p className="text-slate-400 font-medium text-lg max-w-2xl leading-relaxed">
                                Orchestrate the structural parameters of your municipal grid with precision-grade AI synthesis.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Horizontal Tabs Shell */}
            <div className="space-y-8">
                <div className="flex items-center gap-2 p-2 bg-slate-100/50 rounded-[2rem] border border-slate-100 overflow-x-auto no-scrollbar">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as Tab)}
                            className={cn(
                                "flex-1 min-w-[200px] flex flex-col items-start p-6 rounded-[1.5rem] transition-all duration-500 relative group",
                                activeTab === tab.id
                                    ? "bg-white shadow-xl shadow-black/[0.03] scale-[1.02]"
                                    : "hover:bg-white/50"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    activeTab === tab.id ? "bg-[var(--primary)] text-white" : "bg-slate-200/50 text-slate-400 group-hover:bg-slate-200"
                                )}>
                                    <tab.icon size={18} />
                                </div>
                                <span className={cn(
                                    "font-black text-sm uppercase tracking-widest",
                                    activeTab === tab.id ? "text-slate-900" : "text-slate-400"
                                )}>
                                    {tab.label}
                                </span>
                            </div>
                            <p className={cn(
                                "text-[11px] font-medium leading-tight text-left",
                                activeTab === tab.id ? "text-slate-500" : "text-slate-400"
                            )}>
                                {tab.description}
                            </p>
                            {activeTab === tab.id && (
                                <div className="absolute bottom-2 right-6 w-1 h-1 rounded-full bg-[var(--primary)]" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content Rendering */}
                <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {activeTab === 'zones' && <ZonesPage />}
                    {activeTab === 'schedule' && <SchedulePage />}
                    {activeTab === 'resources' && <ResourcesPage />}
                    {activeTab === 'events' && <EventsPage />}
                </div>
            </div>
        </div>
    );
}
