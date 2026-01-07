import { useStore } from '../store';
import { Button, Card } from '../components/ui';
import { WeekDay } from '../models';

const DAYS: WeekDay[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export function SchedulePage() {
    const { zones, schedule, setSchedule } = useStore();

    const toggleDay = (zoneId: string, day: WeekDay) => {
        const existing = schedule.find(s => s.zone_id === zoneId);
        let newDays: WeekDay[] = [];

        if (existing) {
            if (existing.service_days.includes(day)) {
                newDays = existing.service_days.filter(d => d !== day);
            } else {
                newDays = [...existing.service_days, day];
            }

            const newSchedule = schedule.map(s => s.zone_id === zoneId ? { ...s, service_days: newDays } : s);
            setSchedule(newSchedule);
        } else {
            setSchedule([...schedule, { zone_id: zoneId, service_days: [day] }]);
        }
    };

    const isSelected = (zoneId: string, day: WeekDay) => {
        return schedule.find(s => s.zone_id === zoneId)?.service_days.includes(day);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Baseline Schedule</h2>
                <Button variant="secondary" onClick={() => setSchedule([])}>Reset All</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-semibold border-b">
                            <tr>
                                <th className="p-4">Zone</th>
                                {DAYS.map(d => <th key={d} className="p-4 text-center">{d.slice(0, 3)}</th>)}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {zones.map(zone => (
                                <tr key={zone.id} className="hover:bg-slate-50">
                                    <td className="p-4 font-medium">
                                        {zone.name}
                                        <div className="text-xs text-slate-500 font-normal">{zone.id}</div>
                                    </td>
                                    {DAYS.map(day => {
                                        const active = isSelected(zone.id, day);
                                        return (
                                            <td key={day} className="p-4 text-center">
                                                <button
                                                    onClick={() => toggleDay(zone.id, day)}
                                                    className={`w-8 h-8 rounded-full transition-colors ${active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                >
                                                    {active ? '✓' : ''}
                                                </button>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {zones.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        No zones available. Please configure Zones first.
                    </div>
                )}
            </Card>
        </div>
    );
}
