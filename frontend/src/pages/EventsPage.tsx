import { Card } from '../components/ui';
import { Calendar, Info } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { getHoliday } from '../services/holidays';

export function EventsPage() {
    // Generate upcoming 30 days of calendar to show detected holidays
    const upcomingDays = Array.from({ length: 30 }, (_, i) => addDays(new Date(), i));
    const detectedHolidays = upcomingDays
        .map(date => ({ date, holiday: getHoliday(format(date, 'yyyy-MM-dd')) }))
        .filter(item => item.holiday !== null);

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
                <Info className="shrink-0" />
                <div>
                    <h4 className="font-bold">Automatic Calendar System Active</h4>
                    <p>
                        Manual calibration is no longer required. The System automatically detects:
                    </p>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                        <li>Algerian National Holidays (Revolution Day, Independence Day...)</li>
                        <li>Islamic Holidays (Eid Al-Fitr, Eid Al-Adha, Muharram...)</li>
                        <li>Seasonal Context (Ramadan, Summer School Holidays)</li>
                    </ul>
                </div>
            </div>

            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Calendar className="text-slate-400" />
                Upcoming Detected Holidays (Next 30 Days)
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
                {detectedHolidays.length > 0 ? (
                    detectedHolidays.map((item, idx) => (
                        <Card key={idx} className="p-4 border-l-4 border-l-purple-500 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg">{item.holiday?.name}</div>
                                <div className="text-slate-500 text-sm">{format(item.date, 'EEEE, dd MMMM yyyy')}</div>
                            </div>
                            <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded uppercase">
                                {item.holiday?.type}
                            </span>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-2 text-center p-8 text-slate-400 italic bg-white rounded border border-dashed">
                        No holidays detected in the next 30 days.
                    </div>
                )}
            </div>

            <div className="mt-8 text-xs text-slate-400 text-center">
                * Calendar data is sourced from the `src/services/holidays.ts` micro-service.
            </div>
        </div>
    );
}
