import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Container, PriorityLabel } from '../models';

// Map priority labels to Leaflet colors
const PRIORITY_COLORS: Record<string, string> = {
    CRITICAL: '#ff0000',    // Red
    HIGH: '#ff6b00',        // Orange
    MEDIUM: '#2563eb',      // Blue (Adjusted to match your system's medium color)
    LOW: '#16a34a'          // Green
};

// Custom icon creator for containers
const createPriorityIcon = (priority: string) => {
    const color = PRIORITY_COLORS[priority.toUpperCase()] || PRIORITY_COLORS.MEDIUM;
    return L.divIcon({
        html: `<div style="
      background-color: ${color};
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 5px rgba(0,0,0,0.5);
    "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: 'priority-marker'
    });
};

interface ContainerMarkersProps {
    containers: Container[];
}

export const ContainerMarkers: React.FC<ContainerMarkersProps> = ({ containers }) => {
    return (
        <>
            {containers.map((container) => {
                if (!container.lat || !container.lng) return null;

                return (
                    <Marker
                        key={`container-${container.id}`}
                        position={[container.lat, container.lng]}
                        icon={createPriorityIcon(container.priority || 'MEDIUM')}
                    >
                        <Popup>
                            <div className="p-1">
                                <h3 className="font-bold border-b mb-1">Container {container.id}</h3>
                                <div className="text-xs space-y-1">
                                    <p><strong>Priority:</strong> <span className={container.priority === 'CRITICAL' ? 'text-red-600 font-bold' : ''}>{container.priority}</span></p>
                                    <p><strong>Fill Level:</strong> {container.fill_level_percent || 0}%</p>
                                    <p><strong>Location:</strong> {container.lat.toFixed(4)}, {container.lng.toFixed(4)}</p>
                                    {container.zone_id && <p><strong>Zone:</strong> {container.zone_id}</p>}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
};
