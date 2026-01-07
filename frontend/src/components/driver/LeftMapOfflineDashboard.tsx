import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AlgerianMapTileLayer } from './AlgerianMapTiles';
import { DigitalManifestSystem } from './DigitalManifestSystem';
import { AlgerianIssueReporting } from './AlgerianIssueReporting';
import { RealTimeMetricsDashboard } from './RealTimeMetricsDashboard';
import { AlgerianVoiceNavigation } from './AlgerianVoiceNavigation';

export const LeftMapOfflineDashboard: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const voiceNav = new AlgerianVoiceNavigation('algiers');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Simulate turn announcement on load
    useEffect(() => {
        // voiceNav.announceTurn('straight'); 
    }, []);

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar / Left Panel */}
            <div className="w-1/3 p-4 overflow-y-auto space-y-4">
                <div className={`p-2 rounded text-center text-white ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}>
                    {isOnline ? 'متصل بالإنترنت' : 'وضع غير متصل (Offline)'}
                </div>

                <RealTimeMetricsDashboard />
                <DigitalManifestSystem />
                <AlgerianIssueReporting />
            </div>

            {/* Map Area */}
            <div className="w-2/3 h-full relative">
                <MapContainer
                    center={[36.7538, 3.0588]} // Algiers
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                >
                    <AlgerianMapTileLayer isOnline={isOnline} />
                    <Marker position={[36.7538, 3.0588]}>
                        <Popup>
                            الجزائر العاصمة
                        </Popup>
                    </Marker>
                </MapContainer>

                {/* Overlay Controls */}
                <div className="absolute top-4 right-4 z-[1000] bg-white p-2 rounded shadow">
                    <button onClick={() => voiceNav.announceTurn('left')} className="block mb-2 p-2 bg-blue-100 rounded hover:bg-blue-200">
                        تجربة الصوت (يسار)
                    </button>
                    <button onClick={() => voiceNav.announceTurn('right')} className="block p-2 bg-blue-100 rounded hover:bg-blue-200">
                        تجربة الصوت (يمين)
                    </button>
                </div>
            </div>
        </div>
    );
};
