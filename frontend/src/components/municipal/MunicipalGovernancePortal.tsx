import React, { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SNGIDComplianceTracker } from './SNGIDComplianceTracker';
import { WilayaPerformanceComparator } from './WilayaPerformanceComparator';
import { FinancialSustainabilityPanel } from './FinancialSustainabilityPanel';
import { AlgerianMunicipalLayers } from './AlgerianMunicipalLayers';

export const MunicipalGovernancePortal: React.FC = () => {
    const [selectedTab, setSelectedTab] = useState('dashboard');

    // Mock Data
    const metrics = {
        collectionCoverage: 78,
        landfillDiversionRate: 35,
        costRecoveryRate: 25,
        citizenSatisfaction: 60
    };

    const alerts = [
        { id: '1', title: 'انخفاض التحويل', severity: 'medium' as const, message: 'معدل التحويل أقل من هدف 2025' }
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-100 font-sans">
            {/* Header */}
            <div className="bg-green-700 text-white p-4 shadow-md flex justify-between items-center" dir="rtl">
                <div>
                    <h1 className="text-2xl font-bold">بوابة الحوكمة البلدية</h1>
                    <div className="text-sm opacity-80">ولاية الجزائر - بلدية الجزائر الوسطى</div>
                </div>
                <div className="space-x-4 space-x-reverse">
                    <button className={`px-4 py-2 rounded ${selectedTab === 'dashboard' ? 'bg-green-800' : 'hover:bg-green-600'}`} onClick={() => setSelectedTab('dashboard')}>اللوحة الرئيسية</button>
                    <button className={`px-4 py-2 rounded ${selectedTab === 'analytics' ? 'bg-green-800' : 'hover:bg-green-600'}`} onClick={() => setSelectedTab('analytics')}>التحليلات</button>
                    <button className={`px-4 py-2 rounded ${selectedTab === 'finance' ? 'bg-green-800' : 'hover:bg-green-600'}`} onClick={() => setSelectedTab('finance')}>المالية</button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Right Column: Panels */}
                <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
                    <SNGIDComplianceTracker metrics={metrics} alerts={alerts} />
                    <FinancialSustainabilityPanel />
                </div>

                {/* Left Column: Map & Comparator */}
                <div className="lg:col-span-8 flex flex-col gap-6 order-1 lg:order-2">
                    <div className="bg-white p-2 rounded shadow h-96 relative">
                        <div className="absolute top-4 right-4 z-[400] bg-white p-2 text-right rounded shadow opacity-90">
                            <h3 className="font-bold text-sm">خريطة المؤشرات الحية</h3>
                            <div className="text-xs">طبقة: ضغط النفايات</div>
                        </div>
                        <MapContainer
                            center={[36.7538, 3.0588]}
                            zoom={12}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
                            <AlgerianMunicipalLayers wilayaCode="16" />
                        </MapContainer>
                    </div>

                    <WilayaPerformanceComparator currentWilaya="16" />
                </div>
            </div>
        </div>
    );
};
