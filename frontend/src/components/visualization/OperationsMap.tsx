import React, { useState, useEffect } from 'react';
import { AlgerianBaseMap } from './AlgerianBaseMap';
import { AlgorithmVisualizer } from './AlgorithmVisualizer';
import { AlgorithmPlayground } from './AlgorithmPlayground';
import { ContainerMarkers } from './ContainerMarkers';
import { Legend } from './Legend';
import { useStore } from '../../store';
import { containersApi, checkDatabaseAvailability } from '../../services/supabaseApi';
import { Container } from '../../models';

export const OperationsMap: React.FC = () => {
    const store = useStore();
    const [algorithm, setAlgorithm] = useState<any>('none');
    const [params, setParams] = useState<any>({});
    const [showParticles, setShowParticles] = useState(false);
    const [allContainers, setAllContainers] = useState<Container[]>([]);

    // Fetch all containers from DB to populate map and legend
    useEffect(() => {
        const loadAllData = async () => {
            try {
                const dbAvailable = await checkDatabaseAvailability();
                if (dbAvailable) {
                    const data = await containersApi.list();
                    setAllContainers(data as any); // Cast to any to bridge the subtle enum differences
                } else {
                    // Fallback to store data if DB is down
                    const storeContainers = store.zones.flatMap(z => z.containers || []);
                    setAllContainers(storeContainers);
                }
            } catch (error) {
                console.error("Failed to load map data:", error);
            }
        };

        loadAllData();
        const interval = setInterval(loadAllData, 30000); // Auto-refresh every 30s
        return () => clearInterval(interval);
    }, [store.zones]);

    const handleAlgoChange = (algo: string) => {
        setAlgorithm(algo);
    };

    const handleParamChange = (key: string, val: number) => {
        setParams((prev: any) => ({ ...prev, [key]: val }));
        if (key === 'particles') {
            setShowParticles(val > 0);
        }
    };

    return (
        <div className="relative w-full h-[700px] border rounded-xl shadow-lg overflow-hidden bg-slate-50">
            {/* Controls */}
            <AlgorithmPlayground
                onAlgoChange={handleAlgoChange}
                onParamChange={handleParamChange}
                activeAlgo={algorithm}
            />

            {/* Map Overlay Components */}
            <Legend containers={allContainers} />

            {/* Map */}
            <AlgerianBaseMap>
                <ContainerMarkers containers={allContainers} />

                <AlgorithmVisualizer
                    activeAlgorithm={algorithm}
                    showParticles={showParticles}
                />
            </AlgerianBaseMap>

            {/* Overlay Status */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-md p-3 rounded-lg shadow-md border border-slate-200 text-xs" dir="rtl">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <strong className="text-slate-700">حالة النظام:</strong>
                    <span className="text-green-600 font-bold">متصل بـ Supabase</span>
                </div>
                <div className="text-slate-500">
                    <strong>الحاويات المحملة:</strong> {allContainers.length} <br />
                    <strong>تحديث تلقائي:</strong> كل 30 ثانية
                </div>
            </div>
        </div>
    );
};
