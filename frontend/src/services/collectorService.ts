import { collectorsApi } from './supabaseApi';

export const collectorService = {
    // Current logged in collector ID
    getCurrentCollectorId(): string {
        return localStorage.getItem('collector_id') || 'COL-001';
    },

    async getCollectorProfile() {
        try {
            const id = this.getCurrentCollectorId();
            return await collectorsApi.get(id);
        } catch (error) {
            console.warn("Failed to fetch profile from DB, using mock:", error);
            return {
                id: 'COL-001',
                name: 'Ahmed Al-Houssi',
                phone: '+213 555 123 456',
                status: 'available'
            };
        }
    },

    async getAssignedRoute(routeId: number) {
        try {
            const id = this.getCurrentCollectorId();
            const route = await collectorsApi.getTodayRoute(id);
            if (route) return route;

            // Fallback mock route if none assigned in DB
            return this.getMockRoute();
        } catch (error) {
            console.warn("Failed to fetch route from DB, using mock:", error);
            return this.getMockRoute();
        }
    },

    async getNavPath(start: any, end: any) {
        // Mock road-aware path (just a line between points for now)
        // In a real app, this would call OSRM or Google Routes API
        return [
            { lat: start.lat, lng: start.lng },
            { lat: (start.lat + end.lat) / 2 + 0.001, lng: (start.lng + end.lng) / 2 + 0.001 },
            { lat: end.lat, lng: end.lng }
        ];
    },

    logout() {
        localStorage.removeItem('collector_id');
        localStorage.removeItem('collector_token');
    },

    getMockRoute() {
        return {
            id: 101,
            collector_id: 'COL-001',
            geometry: [
                { lat: 36.75, lng: 3.05 },
                { lat: 36.752, lng: 3.055 },
                { lat: 36.755, lng: 3.06 }
            ],
            stops: [
                { id: 'S1', address: 'Place des Martyrs, Algiers', lat: 36.75, lng: 3.05 },
                { id: 'S2', address: 'Rue Didouche Mourad, Algiers', lat: 36.752, lng: 3.055 },
                { id: 'S3', address: 'Grand Poste, Algiers', lat: 36.755, lng: 3.06 }
            ]
        };
    }
};
