import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';

// Mock types
interface PerformanceMetrics {
    collectionCoverage: number;
    landfillDiversionRate: number;
    costRecoveryRate: number;
    citizenSatisfaction: number;
    digitalTransformation?: number;
}

interface GovernanceAlert {
    id: string;
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
}

interface SNGIDComplianceTrackerProps {
    metrics: PerformanceMetrics;
    alerts: GovernanceAlert[];
}

export const SNGIDComplianceTracker: React.FC<SNGIDComplianceTrackerProps> = ({ metrics, alerts }) => {
    const [selectedYear, setSelectedYear] = useState(2035);

    const data = [
        { name: 'On Track', value: 3, color: '#4CAF50' },
        { name: 'At Risk', value: 1, color: '#FF9800' },
        { name: 'Behind', value: 1, color: '#F44336' },
    ];

    return (
        <div className="bg-white p-6 rounded shadow mb-6 text-right" dir="rtl">
            <div className="flex justify-between items-center mb-6">
                <div className="flex gap-2 items-center">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="border p-2 rounded"
                    >
                        <option value={2025}>2025</option>
                        <option value={2030}>2030</option>
                        <option value={2035}>2035</option>
                    </select>
                    <label>السنة المستهدفة:</label>
                </div>
                <h2 className="text-xl font-bold">تتبع الامتثال للاستراتيجية الوطنية SNGID 2035</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col items-center">
                    <h3 className="mb-4 font-semibold">حالة الامتثال العام</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-[-100px] mb-[60px]">
                        <div className="text-3xl font-bold text-blue-600">65%</div>
                        <div className="text-sm text-gray-500">معدل الامتثال</div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-semibold mb-2">تنبيهات الامتثال</h3>
                    {alerts.map(alert => (
                        <div key={alert.id} className={`p-3 rounded border-r-4 ${alert.severity === 'critical' ? 'bg-red-50 border-red-500' :
                                alert.severity === 'medium' ? 'bg-orange-50 border-orange-500' : 'bg-blue-50 border-blue-500'
                            }`}>
                            <div className="font-bold">{alert.title}</div>
                            <div className="text-sm text-gray-600">{alert.message}</div>
                        </div>
                    ))}
                    {alerts.length === 0 && <div className="text-gray-500">لا يوجد تنبيهات حالية</div>}
                </div>
            </div>

            <div className="mt-8">
                <h3 className="font-semibold mb-4">تقدم المؤشرات الاستراتيجية</h3>
                <table className="w-full text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3">المؤشر</th>
                            <th className="p-3">الحالي</th>
                            <th className="p-3">هدف {selectedYear}</th>
                            <th className="p-3">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="border-b">
                            <td className="p-3">معدل جمع النفايات</td>
                            <td className="p-3 font-bold">{metrics.collectionCoverage}%</td>
                            <td className="p-3">90%</td>
                            <td className="p-3"><span className="text-green-600">على المسار</span></td>
                        </tr>
                        <tr className="border-b">
                            <td className="p-3">تحويل عن المطامر</td>
                            <td className="p-3 font-bold">{metrics.landfillDiversionRate}%</td>
                            <td className="p-3">65%</td>
                            <td className="p-3"><span className="text-red-500">متأخر</span></td>
                        </tr>
                        <tr className="border-b">
                            <td className="p-3">استرداد التكاليف</td>
                            <td className="p-3 font-bold">{metrics.costRecoveryRate}%</td>
                            <td className="p-3">40%</td>
                            <td className="p-3"><span className="text-orange-500">في خطر</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};
