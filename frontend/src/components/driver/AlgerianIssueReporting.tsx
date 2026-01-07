import React, { useState } from 'react';
import { AlertTriangle, MapPin, Mic, Camera } from 'lucide-react';

export const AlgerianIssueReporting: React.FC = () => {
    const [issue, setIssue] = useState('');

    return (
        <div className="p-4 bg-white rounded shadow text-right" dir="rtl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500" />
                تبليغ عن مشكلة
            </h2>

            <div className="grid grid-cols-2 gap-2 mb-4">
                <button className="p-2 border rounded hover:bg-red-50">طريق مسدود</button>
                <button className="p-2 border rounded hover:bg-red-50">حاوية مكسورة</button>
                <button className="p-2 border rounded hover:bg-red-50">نفايات خطيرة</button>
                <button className="p-2 border rounded hover:bg-red-50">عطل ميكانيكي</button>
            </div>

            <textarea
                className="w-full border p-2 rounded mb-2"
                rows={3}
                placeholder="وصف المشكلة..."
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
            />

            <div className="flex gap-2 mb-4">
                <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-100 rounded">
                    <Camera size={18} /> صورة
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 p-2 bg-gray-100 rounded">
                    <Mic size={18} /> صوت
                </button>
            </div>

            <button className="w-full bg-red-600 text-white p-3 rounded font-bold">
                إرسال التبليغ
            </button>
        </div>
    );
};
