import React, { useState } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from 'recharts';

interface WilayaPerformanceComparatorProps {
    currentWilaya: string;
}

export const WilayaPerformanceComparator: React.FC<WilayaPerformanceComparatorProps> = ({ currentWilaya }) => {
    const [comparisonMode, setComparisonMode] = useState('performance');

    const data = [
        { subject: 'تغطية الجمع', A: 80, B: 90, fullMark: 100 },
        { subject: 'استرداد التكاليف', A: 40, B: 60, fullMark: 100 },
        { subject: 'التدوير', A: 30, B: 45, fullMark: 100 },
        { subject: 'رضا المواطن', A: 70, B: 80, fullMark: 100 },
        { subject: 'الرقمنة', A: 50, B: 85, fullMark: 100 },
    ];

    return (
        <div className="bg-white p-6 rounded shadow mb-6 text-right" dir="rtl">
            <h2 className="text-xl font-bold mb-4">مقارنة أداء الولايات</h2>

            <div className="flex gap-4 mb-6">
                <select className="border p-2 rounded">
                    <option>المتوسط الوطني</option>
                    <option>أفضل أداء (الجزائر العاصمة)</option>
                    <option>ولايات الهضاب العليا</option>
                </select>
                <select
                    value={comparisonMode}
                    onChange={(e) => setComparisonMode(e.target.value)}
                    className="border p-2 rounded"
                >
                    <option value="performance">الأداء العام</option>
                    <option value="financial">المالية</option>
                </select>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                        <Radar name="ولايتك" dataKey="A" stroke="#2196F3" fill="#2196F3" fillOpacity={0.6} />
                        <Radar name="المعيار" dataKey="B" stroke="#FF9800" fill="#FF9800" fillOpacity={0.6} />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded">
                <h4 className="font-bold mb-2">رؤى وتحليلات</h4>
                <ul className="list-disc pr-6 space-y-2 text-sm">
                    <li>أداء ولايتك في <strong>تغطية الجمع</strong> يقارب المعيار الوطني.</li>
                    <li>يوجد تأخر ملحوظ في <strong>معدلات التدوير</strong> مقارنة بالولايات الرائدة.</li>
                    <li>مؤشر <strong>الرقمنة</strong> يحتاج إلى استثمارات إضافية للحاق بالركب.</li>
                </ul>
            </div>
        </div>
    );
};
