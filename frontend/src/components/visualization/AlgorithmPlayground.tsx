import React from 'react';

interface AlgorithmPlaygroundProps {
    onAlgoChange: (algo: any) => void;
    onParamChange: (param: string, val: number) => void;
    activeAlgo: string;
}

export const AlgorithmPlayground: React.FC<AlgorithmPlaygroundProps> = ({
    onAlgoChange,
    onParamChange,
    activeAlgo
}) => {
    return (
        <div className="absolute top-4 left-4 z-[1000] bg-white p-4 rounded shadow-lg w-80 max-h-[80vh] overflow-y-auto" dir="rtl">
            <h3 className="font-bold text-lg mb-4 text-gray-800">مختبر الخوارزميات (Playground)</h3>

            <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">اختر الخوارزمية:</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => onAlgoChange('dijkstra')}
                        className={`p-2 rounded text-sm ${activeAlgo === 'dijkstra' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        Dijkstra
                    </button>
                    <button
                        onClick={() => onAlgoChange('astar')}
                        className={`p-2 rounded text-sm ${activeAlgo === 'astar' ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        A* Heuristic
                    </button>
                    <button
                        onClick={() => onAlgoChange('ant_colony')}
                        className={`p-2 rounded text-sm ${activeAlgo === 'ant_colony' ? 'bg-purple-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        Ant Colony
                    </button>
                    <button
                        onClick={() => onAlgoChange('genetic')}
                        className={`p-2 rounded text-sm ${activeAlgo === 'genetic' ? 'bg-orange-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                        Genetic
                    </button>
                </div>
            </div>

            <div className="mb-6">
                <h4 className="font-semibold text-sm mb-3">ضبط المعاملات (Parameters)</h4>

                {activeAlgo === 'astar' && (
                    <div className="mb-3">
                        <label className="block text-xs text-gray-600 mb-1">A* Heuristic Weight (w)</label>
                        <input
                            type="range" min="0" max="5" step="0.1"
                            className="w-full"
                            onChange={(e) => onParamChange('heuristic_weight', parseFloat(e.target.value))}
                        />
                    </div>
                )}

                {activeAlgo === 'ant_colony' && (
                    <div className="mb-3">
                        <label className="block text-xs text-gray-600 mb-1">Evaporation Rate (rho)</label>
                        <input
                            type="range" min="0" max="1" step="0.05"
                            className="w-full"
                            onChange={(e) => onParamChange('evaporation', parseFloat(e.target.value))}
                        />
                    </div>
                )}

                <div className="mb-3">
                    <label className="block text-xs text-gray-600 mb-1">عدد الجسيمات (Particles)</label>
                    <input
                        type="range" min="10" max="200" step="10"
                        className="w-full"
                        onChange={(e) => onParamChange('particles', parseFloat(e.target.value))}
                    />
                </div>
            </div>

            <div className="border-t pt-4">
                <h4 className="font-semibold text-sm mb-3">القيود الجزائرية</h4>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" defaultChecked />
                        <span className="text-sm">تجنب وقت الصلاة</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" defaultChecked />
                        <span className="text-sm">أسواق يومية (Market Days)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4" />
                        <span className="text-sm">وضع رمضان (Ramadan Mode)</span>
                    </label>
                </div>
            </div>

            <div className="mt-4 p-2 bg-yellow-50 text-xs text-yellow-800 rounded">
                💡 جرب تغيير المعاملات لرؤية تأثيرها على سرعة الخوارزمية وجودة المسار.
            </div>
        </div>
    );
};
