import React, { useState } from 'react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const FinancialSustainabilityPanel: React.FC = () => {
    const data = [
        { name: '2023', revenue: 4000, expenses: 5000 },
        { name: '2024', revenue: 4500, expenses: 5200 },
        { name: '2025 (توقع)', revenue: 6000, expenses: 5400 },
    ];

    return (
        <div className="bg-white p-6 rounded shadow mb-6 text-right" dir="rtl">
            <h2 className="text-xl font-bold mb-4">الاستدامة المالية وتحسين الميزانية</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded text-center">
                    <div className="text-gray-500">العجز/الفائض</div>
                    <div className="text-2xl font-bold text-red-500">-700 ألف دج</div>
                </div>
                <div className="p-4 bg-gray-50 rounded text-center">
                    <div className="text-gray-500">استرداد التكاليف</div>
                    <div className="text-2xl font-bold text-blue-600">35%</div>
                </div>
                <div className="p-4 bg-gray-50 rounded text-center">
                    <div className="text-gray-500">العائد من التدوير</div>
                    <div className="text-2xl font-bold text-green-600">12%</div>
                </div>
            </div>

            <div className="h-64 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="revenue" name="الإيرادات" fill="#4CAF50" />
                        <Bar dataKey="expenses" name="النفقات" fill="#F44336" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="border-t pt-4">
                <h3 className="font-bold mb-3">احتياجات الاستثمار (SNGID 2035)</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                        <span>💰 بنية تحتية للتدوير (عاجل)</span>
                        <span className="font-bold">15 مليون دج</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span>📱 التحول الرقمي</span>
                        <span className="font-bold">5 مليون دج</span>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-bold mb-2">مصادر التمويل المتاحة</h3>
                <button className="w-full text-center p-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50">
                    استعراض منح الصندوق الوطني للبيئة
                </button>
            </div>
        </div>
    );
};
