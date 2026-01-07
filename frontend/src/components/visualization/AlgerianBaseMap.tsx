import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, LayersControl, LayerGroup, Circle, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple } from 'leaflet';

// Algerian Administrative Constants
const ALGERIAN_CENTER: LatLngTuple = [28.0339, 1.6596]; // Geographic center
const NORTH_CENTER: LatLngTuple = [36.7538, 3.0588]; // Algiers (default focus)

interface AlgerianBaseMapProps {
    center?: LatLngTuple;
    zoom?: number;
    children?: React.ReactNode;
}

// Cultural & Religious Overlay Component
const CulturalOverlay = () => {
    // Mock locations for demonstration
    const mosques = [
        { name: "Djamaa el Djazaïr", coords: [36.7333, 3.1333] as LatLngTuple },
        { name: "Ketchaoua Mosque", coords: [36.785, 3.06] as LatLngTuple }
    ];

    return (
        <LayerGroup>
            {mosques.map((m, i) => (
                <Circle
                    key={i}
                    center={m.coords}
                    pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.2 }}
                    radius={500}
                >
                    <Popup>{m.name} (Silent Zone during Prayer)</Popup>
                </Circle>
            ))}
        </LayerGroup>
    );
};

// Market Day Overlay
const MarketDayOverlay = () => {
    // Mock markets
    const markets = [
        { name: "El Harrach Market", coords: [36.7167, 3.1333] as LatLngTuple, d: "Friday" }
    ];

    return (
        <LayerGroup>
            {markets.map((m, i) => (
                <Circle
                    key={i}
                    center={m.coords}
                    pathOptions={{ color: 'orange', dashArray: '5,5' }}
                    radius={300}
                >
                    <Popup>{m.name} - Traffic High on {m.d}</Popup>
                </Circle>
            ))}
        </LayerGroup>
    );
};

export const AlgerianBaseMap: React.FC<AlgerianBaseMapProps> = ({
    center = NORTH_CENTER,
    zoom = 10,
    children
}) => {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
        >
            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Simple Streets">
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="&copy; OpenStreetMap contributors"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Satellite Imagery">
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="&copy; ESRI"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Dark Matter (Night Mode)">
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        attribution="&copy; CARTO"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.Overlay name="Mosques & Prayer Zones">
                    <CulturalOverlay />
                </LayersControl.Overlay>

                <LayersControl.Overlay name="Market Zones">
                    <MarketDayOverlay />
                </LayersControl.Overlay>
            </LayersControl>

            {children}
        </MapContainer>
    );
};
