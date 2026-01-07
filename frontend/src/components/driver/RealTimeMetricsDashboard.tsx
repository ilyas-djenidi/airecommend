import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const RealTimeMetricsDashboard: React.FC = () => {
    const data = [
        { time: '08:00', efficiency: 80 },
        { time: '09:00', efficiency: 85 },
        { time: '10:00', efficiency: 75 },
        { time: '11:00', efficiency: 90 },
        { time: '12:00', efficiency: 88 },
    ];

    return (
        <div className="p-4 bg-white rounded shadow text-right" dir="rtl">
            <h2 className="text-xl font-bold mb-4">لوحة القيادة والمؤشرات</h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded">
                    <div className="text-gray-600">الكفاءة</div>
                    <div className="text-2xl font-bold text-blue-600">88%</div>
                </div>
                <div className="bg-green-50 p-4 rounded">
                    <div className="text-gray-600">النفايات المجمعة</div>
                    <div className="text-2xl font-bold text-green-600">1,250 كغ</div>
                </div>
                <div className="bg-orange-50 p-4 rounded">
                    <div className="text-gray-600">استهلاك الوقود</div>
                    <div className="text-2xl font-bold text-orange-600">12 لتر</div>
                </div>
                <div className="bg-purple-50 p-4 rounded">
                    <div className="text-gray-600">المسافة</div>
                    <div className="text-2xl font-bold text-purple-600">45 كم</div>
                </div>
            </div>

            <div className="h-48 w-full">
                <h3 className="mb-2 font-bold">مؤشر الأداء</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="efficiency" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.2} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
