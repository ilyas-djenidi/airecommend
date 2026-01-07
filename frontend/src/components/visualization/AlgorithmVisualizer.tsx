import React, { useEffect, useState } from 'react';
import { Polyline, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';

interface AlgorithmVisualizerProps {
    activeAlgorithm: 'dijkstra' | 'astar' | 'ant_colony' | 'none';
    showParticles?: boolean;
}

// Mock Data Generators for Visualization
const generateExploredNodes = (start: LatLngTuple, end: LatLngTuple, count: number) => {
    const nodes: { coords: LatLngTuple; cost: number }[] = [];
    for (let i = 0; i < count; i++) {
        const lat = start[0] + (Math.random() - 0.5) * 0.05;
        const lon = start[1] + (Math.random() - 0.5) * 0.05;
        nodes.push({ coords: [lat, lon], cost: Math.random() });
    }
    return nodes;
};

const generateHypotheticalParticles = (center: LatLngTuple, count: number) => {
    const particles: LatLngTuple[] = [];
    for (let i = 0; i < count; i++) {
        const lat = center[0] + (Math.random() - 0.5) * 0.005;
        const lon = center[1] + (Math.random() - 0.5) * 0.005;
        particles.push([lat, lon]);
    }
    return particles;
};

export const AlgorithmVisualizer: React.FC<AlgorithmVisualizerProps> = ({
    activeAlgorithm,
    showParticles
}) => {
    const [exploredNodes, setExploredNodes] = useState<{ coords: LatLngTuple; cost: number }[]>([]);
    const [particles, setParticles] = useState<LatLngTuple[]>([]);
    const [progressPath, setProgressPath] = useState<LatLngTuple[]>([]);

    // Animation Loop for Algorithms
    useEffect(() => {
        if (activeAlgorithm === 'none') {
            setExploredNodes([]);
            setProgressPath([]);
            return;
        }

        // Simulate Algorithm Progress
        const interval = setInterval(() => {
            // Dijkstra / A* Expansion Animation
            if (activeAlgorithm === 'dijkstra' || activeAlgorithm === 'astar') {
                const newNodes = generateExploredNodes([36.75, 3.05], [36.78, 3.08], 5);
                setExploredNodes(prev => [...prev.slice(-50), ...newNodes]);
            }
        }, 500);

        return () => clearInterval(interval);
    }, [activeAlgorithm]);

    // Particle Filter Simulation
    useEffect(() => {
        if (!showParticles) {
            setParticles([]);
            return;
        }

        const interval = setInterval(() => {
            // Move particles slightly
            const center: LatLngTuple = [36.7538, 3.0588]; // Mock truck center
            setParticles(generateHypotheticalParticles(center, 20));
        }, 200);
        return () => clearInterval(interval);
    }, [showParticles]);

    const getNodeColor = (cost: number) => {
        if (activeAlgorithm === 'astar') {
            // Heuristic coloring (Green is good)
            return cost > 0.5 ? 'red' : 'green';
        }
        // Dijkstra (Blue flood fill)
        return '#3388ff';
    };

    return (
        <>
            {/* Explored Nodes (Search Space) */}
            {exploredNodes.map((node, idx) => (
                <CircleMarker
                    key={idx}
                    center={node.coords}
                    radius={2}
                    pathOptions={{
                        color: getNodeColor(node.cost),
                        opacity: 0.6,
                        fillOpacity: 0.6
                    }}
                />
            ))}

            {/* Particle Filter Cloud */}
            {particles.map((p, idx) => (
                <CircleMarker
                    key={`p-${idx}`}
                    center={p}
                    radius={1}
                    pathOptions={{ color: 'purple', opacity: 0.4 }}
                />
            ))}
        </>
    );
};
