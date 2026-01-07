// Professional Map Integration Component
// Embeds Folium-generated maps and provides map selection UI

import React, { useState } from 'react';
import { Card } from '../ui';
import { Map, Download, Layers, Activity } from 'lucide-react';

interface MapViewerProps {
    date?: string;
    collectorId?: string;
}

export const ProfessionalMapViewer: React.FC<MapViewerProps> = ({ date, collectorId }) => {
    const [loading, setLoading] = useState(false);
    const [mapUrl, setMapUrl] = useState<string | null>(null);
    const [mapType, setMapType] = useState<'full' | 'heatmap' | 'routes'>('full');

    const generateMap = async (type: 'full' | 'heatmap' | 'routes') => {
        setLoading(true);
        setMapType(type);

        try {
            let endpoint = '';
            let body = {};

            if (type === 'full') {
                endpoint = '/api/maps/generate';
                body = {
                    date: date || new Date().toISOString().split('T')[0],
                    include_zones: true,
                    include_containers: true,
                    include_routes: true,
                    include_wpi: true,
                    include_tracking: true,
                    dark_mode: false,
                    collector_id: collectorId
                };
            } else if (type === 'heatmap') {
                endpoint = '/api/maps/heatmap';
            }

            const response = await fetch(`http://localhost:8000${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body)
            });

            const html = await response.text();

            // Create blob URL for iframe
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            setMapUrl(url);

        } catch (error) {
            console.error('Failed to generate map:', error);
            alert('Failed to generate map. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Control Panel */}
            <Card className="p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Map size={20} className="text-blue-600" />
                        <h3 className="font-bold text-lg">Professional Map Viewer</h3>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => generateMap('full')}
                            disabled={loading}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${mapType === 'full' && mapUrl
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Layers size={16} className="inline mr-2" />
                            Complete Map
                        </button>

                        <button
                            onClick={() => generateMap('heatmap')}
                            disabled={loading}
                            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${mapType === 'heatmap' && mapUrl
                                    ? 'bg-red-600 text-white'
                                    : 'bg-white border border-slate-300 hover:bg-slate-50'
                                }`}
                        >
                            <Activity size={16} className="inline mr-2" />
                            WPI Heatmap
                        </button>

                        {mapUrl && (
                            <a
                                href={mapUrl}
                                download="algerian_waste_map.html"
                                className="px-4 py-2 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                            >
                                <Download size={16} className="inline mr-2" />
                                Download
                            </a>
                        )}
                    </div>
                </div>

                <p className="text-sm text-slate-500 mt-2">
                    Generate advanced interactive maps with heatmaps, clustering, and animated routes
                </p>
            </Card>

            {/* Map Display */}
            {loading && (
                <Card className="p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-slate-600">Generating professional map...</p>
                </Card>
            )}

            {mapUrl && !loading && (
                <Card className="p-0 overflow-hidden">
                    <iframe
                        src={mapUrl}
                        className="w-full h-[700px] border-0"
                        title="Algerian Waste Map"
                    />

                    <div className="p-3 bg-slate-50 border-t text-xs text-slate-500 flex justify-between">
                        <span>✅ Map generated successfully • Fullscreen mode available</span>
                        <span>Powered by Folium + OpenStreetMap</span>
                    </div>
                </Card>
            )}

            {!mapUrl && !loading && (
                <Card className="p-12 text-center border-2 border-dashed">
                    <Map size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-600 mb-2">No Map Generated</h3>
                    <p className="text-sm text-slate-500">
                        Click "Complete Map" or "WPI Heatmap" to generate an interactive visualization
                    </p>
                </Card>
            )}

            {/* Features Legend */}
            <Card className="p-4 bg-blue-50 border-blue-200">
                <h4 className="font-bold text-sm text-blue-900 mb-3">Map Features</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                        <div className="font-semibold text-blue-800">✓ Clustering</div>
                        <div className="text-blue-600">Group nearby containers</div>
                    </div>
                    <div>
                        <div className="font-semibold text-blue-800">✓ Animated Routes</div>
                        <div className="text-blue-600">Moving route visualization</div>
                    </div>
                    <div>
                        <div className="font-semibold text-blue-800">✓ Heatmaps</div>
                        <div className="text-blue-600">WPI pressure zones</div>
                    </div>
                    <div>
                        <div className="font-semibold text-blue-800">✓ Live Tracking</div>
                        <div className="text-blue-600">Real-time truck positions</div>
                    </div>
                </div>
            </Card>
        </div>
    );
};
