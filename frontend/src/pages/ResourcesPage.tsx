import { useStore } from '../store';
import { Input, Card, Label } from '../components/ui';
import { Truck, Clock } from 'lucide-react';

export function ResourcesPage() {
    const { resources, setResources } = useStore();

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Truck className="text-blue-600" />
                    Fleet Resources
                </h2>
                <p className="text-slate-600 text-sm mt-1">Configure daily operational parameters for collection fleet.</p>
            </div>

            <Card className="p-6">
                <div className="space-y-6">
                    {/* Daily Collectors */}
                    <div>
                        <Label className="text-base font-semibold">Daily Collectors</Label>
                        <Input
                            type="number"
                            min="1"
                            max="50"
                            value={resources.daily_collectors}
                            onChange={e => setResources({ ...resources, daily_collectors: parseInt(e.target.value) || 1 })}
                            className="mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-2">
                            Number of collectors/trucks available per day. The AI will distribute collection zones among these collectors for optimal routing.
                            <strong> Note: To manage specific drivers and their starting locations, use the <a href="/collectors" className="text-blue-600 underline">Manage Collectors</a> page.</strong>
                        </p>
                    </div>

                    {/* Shift Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                            <Label className="flex items-center gap-2">
                                <Clock size={16} className="text-blue-600" />
                                Shift Start Time
                            </Label>
                            <Input
                                type="time"
                                value={resources.shift_start}
                                onChange={e => setResources({ ...resources, shift_start: e.target.value })}
                                className="mt-2"
                            />
                            <p className="text-xs text-slate-500 mt-1">Beginning of daily collection shift (24-hour format)</p>
                        </div>
                        <div>
                            <Label className="flex items-center gap-2">
                                <Clock size={16} className="text-blue-600" />
                                Shift End Time
                            </Label>
                            <Input
                                type="time"
                                value={resources.shift_end}
                                onChange={e => setResources({ ...resources, shift_end: e.target.value })}
                                className="mt-2"
                            />
                            <p className="text-xs text-slate-500 mt-1">End of daily collection shift (24-hour format)</p>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                        <h4 className="font-semibold text-blue-900 text-sm mb-1">How This Works</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• AI backend automatically distributes containers to collectors using optimization algorithms</li>
                            <li>• Routes are calculated with real TSP (Traveling Salesman Problem) solving</li>
                            <li>• Traffic-aware ETAs are generated based on time of day</li>
                            <li>• Shift overflow warnings appear if routes exceed working hours</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
}
