import React, { useState } from 'react';
import { Camera, Barcode, AlertTriangle, PenTool } from 'lucide-react';

export const DigitalManifestSystem: React.FC = () => {
    const [tasks, setTasks] = useState([
        { id: 1, location: 'Point A', status: 'pending', weight: 0 },
        { id: 2, location: 'Point B', status: 'pending', weight: 0 }
    ]);

    const handleComplete = (id: number) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    };

    return (
        <div className="p-4 bg-white rounded shadow text-right" dir="rtl">
            <h2 className="text-xl font-bold mb-4">بيان الشحن الرقمي</h2>
            <div className="space-y-4">
                {tasks.map(task => (
                    <div key={task.id} className="border p-4 rounded flex justify-between items-center">
                        <div>
                            <div className="font-bold">{task.location}</div>
                            <div className="text-sm text-gray-500">الحالة: {task.status === 'completed' ? 'تم' : 'قيد الانتظار'}</div>
                        </div>
                        {task.status !== 'completed' && (
                            <div className="flex gap-2">
                                <button onClick={() => handleComplete(task.id)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                                    إتمام
                                </button>
                                <button className="p-2 bg-gray-100 rounded"><Camera size={18} /></button>
                                <button className="p-2 bg-gray-100 rounded"><Barcode size={18} /></button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
