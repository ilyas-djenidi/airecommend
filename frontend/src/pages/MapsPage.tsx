import { ProfessionalMapViewer } from '../components/visualization/ProfessionalMapViewer';
import { Card } from '../components/ui';
import { Map as MapIcon } from 'lucide-react';

export function MapsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MapIcon className="text-blue-600" />
                    Advanced Map Visualizations
                </h2>
                <p className="text-slate-500 mt-1">
                    Professional interactive maps with clustering, heatmaps, and animated routes
                </p>
            </div>

            <ProfessionalMapViewer />

            {/* Usage Guide */}
            <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <h3 className="font-bold text-lg mb-4 text-blue-900">How to Use Professional Maps</h3>
                <div className="space-y-3 text-sm text-blue-800">
                    <div>
                        <strong>1. Complete Map:</strong> Shows all zones, containers, routes, and tracking
                    </div>
                    <div>
                        <strong>2. WPI Heatmap:</strong> Visualizes waste pressure intensity across zones
                    </div>
                    <div>
                        <strong>3. Download:</strong> Save maps as standalone HTML files for reports
                    </div>
                    <div>
                        <strong>4. Fullscreen:</strong> Click fullscreen button (top-left) for presentation mode
                    </div>
                </div>
            </Card>
        </div>
    );
}
