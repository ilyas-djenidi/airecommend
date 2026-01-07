import { useState } from 'react';
import { ZonesPage } from './ZonesPage';
import { SchedulePage } from './SchedulePage';
import { ResourcesPage } from './ResourcesPage';
import { EventsPage } from './EventsPage';
import { cn } from '../components/ui';

type Tab = 'zones' | 'schedule' | 'resources' | 'events';

export function InputsPage() {
    const [activeTab, setActiveTab] = useState<Tab>('zones');

    const tabs: { id: Tab, label: string }[] = [
        { id: 'zones', label: '1. Zones (Neighborhoods)' },
        { id: 'schedule', label: '2. Baseline Schedule' },
        { id: 'resources', label: '3. Fleet Resources' },
        { id: 'events', label: '4. Calendar System (Auto)' },
    ];

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-800">System Inputs</h2>
                <p className="text-slate-500">Configure the parameters for the Daily Decision Engine.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-full md:w-fit overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all",
                            activeTab === tab.id
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm min-h-[500px]">
                {activeTab === 'zones' && <ZonesPage />}
                {activeTab === 'schedule' && <SchedulePage />}
                {activeTab === 'resources' && <ResourcesPage />}
                {activeTab === 'events' && <EventsPage />}
            </div>
        </div>
    );
}
