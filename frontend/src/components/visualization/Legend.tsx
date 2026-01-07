import React from 'react';
import { Container } from '../../models';

interface LegendProps {
    containers: Container[];
}

export const Legend: React.FC<LegendProps> = ({ containers }) => {
    // Calculate counts dynamically from actual containers
    const counts = containers.reduce(
        (acc, container) => {
            const p = (container.priority || 'MEDIUM').toUpperCase();
            if (acc[p] !== undefined) {
                acc[p]++;
            } else {
                acc['MEDIUM']++;
            }
            return acc;
        },
        { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<string, number>
    );

    const legendItems = [
        { label: 'Critical Priority', key: 'CRITICAL', color: '#ff0000' },
        { label: 'High Priority', key: 'HIGH', color: '#ff6b00' },
        { label: 'Medium Priority', key: 'MEDIUM', color: '#2563eb' },
        { label: 'Low Priority', key: 'LOW', color: '#16a34a' },
    ];

    return (
        <div className="absolute top-4 right-4 z-[1000] bg-white p-4 rounded-lg shadow-xl border border-slate-200 min-w-[180px]">
            <h4 className="text-sm font-bold text-slate-700 mb-3 border-b pb-2">Priority Legend</h4>
            <div className="space-y-2">
                {legendItems.map((item) => (
                    <div key={item.key} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.color }}
                            ></div>
                            <span className="text-xs font-medium text-slate-600">{item.label}</span>
                        </div>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${counts[item.key] > 0 ? 'bg-slate-100 text-slate-700' : 'text-slate-300'
                            }`}>
                            ({counts[item.key]})
                        </span>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-2 border-t text-[10px] text-slate-400 italic">
                Showing {containers.length} containers from DB
            </div>
        </div>
    );
};
