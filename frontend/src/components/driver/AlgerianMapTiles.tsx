import React from 'react';
import { TileLayer } from 'react-leaflet';

interface AlgerianMapTileLayerProps {
    isOnline: boolean;
    cachedTilesAvailable?: boolean;
}

export const AlgerianMapTileLayer: React.FC<AlgerianMapTileLayerProps> = ({ isOnline }) => {
    // Using OpenStreetMap for demo, in real offline scenario would use local blob URLs
    const tileUrl = isOnline
        ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        : '/offline-tiles/{z}/{x}/{y}.png'; // Mock offline path

    return (
        <TileLayer
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
    );
};
