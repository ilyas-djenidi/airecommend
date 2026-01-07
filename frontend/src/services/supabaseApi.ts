// Supabase API Service
// Handles all backend communication for database operations

const API_BASE = 'http://localhost:8000/api';

import { Container as StoreContainer, PriorityLabel } from '../models';

export interface Zone {
    id: string;
    name: string;
    category: string;
    priority: string;
    priority_score?: number;
    center_lat?: number;
    center_lng?: number;
    population?: number;
    area_km2?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Container extends Omit<StoreContainer, 'type'> {
    type?: string;
    fill_level_percent?: number;
    status?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Collector {
    id: string;
    name: string;
    phone?: string;
    truck_id?: string;
    truck_capacity_kg?: number;
    status?: string;
    current_lat?: number;
    current_lng?: number;
    shift_start?: string;
    shift_end?: string;
    avg_speed_kmh?: number;
    created_at?: string;
    updated_at?: string;
}

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(error.detail || `API Error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API call failed: ${endpoint}`, error);
        throw error;
    }
}

// ============================================
// ZONES API
// ============================================

export const zonesApi = {
    async list(): Promise<Zone[]> {
        return apiCall<Zone[]>('/zones');
    },

    async get(zoneId: string): Promise<Zone> {
        return apiCall<Zone>(`/zones/${zoneId}`);
    },

    async create(zone: Omit<Zone, 'created_at' | 'updated_at'>): Promise<Zone> {
        return apiCall<Zone>('/zones', {
            method: 'POST',
            body: JSON.stringify(zone),
        });
    },

    async update(zoneId: string, zone: Partial<Zone>): Promise<Zone> {
        return apiCall<Zone>(`/zones/${zoneId}`, {
            method: 'PUT',
            body: JSON.stringify(zone),
        });
    },

    async delete(zoneId: string): Promise<void> {
        return apiCall<void>(`/zones/${zoneId}`, {
            method: 'DELETE',
        });
    },

    async getContainers(zoneId: string): Promise<Container[]> {
        return apiCall<Container[]>(`/zones/${zoneId}/containers`);
    },
};

// ============================================
// CONTAINERS API
// ============================================

export const containersApi = {
    async list(zoneId?: string): Promise<Container[]> {
        const query = zoneId ? `?zone_id=${zoneId}` : '';
        return apiCall<Container[]>(`/containers${query}`);
    },

    async get(containerId: string): Promise<Container> {
        return apiCall<Container>(`/containers/${containerId}`);
    },

    async create(container: Omit<Container, 'created_at' | 'updated_at' | 'last_collection'>): Promise<Container> {
        return apiCall<Container>('/containers', {
            method: 'POST',
            body: JSON.stringify(container),
        });
    },

    async update(containerId: string, container: Partial<Container>): Promise<Container> {
        return apiCall<Container>(`/containers/${containerId}`, {
            method: 'PUT',
            body: JSON.stringify(container),
        });
    },

    async delete(containerId: string): Promise<void> {
        return apiCall<void>(`/containers/${containerId}`, {
            method: 'DELETE',
        });
    },

    async updateStatus(containerId: string, status: string, fillLevel?: number): Promise<Container> {
        const query = fillLevel !== undefined ? `?status_val=${status}&fill_level=${fillLevel}` : `?status_val=${status}`;
        return apiCall<Container>(`/containers/${containerId}/status${query}`, {
            method: 'PATCH',
        });
    },
};

// ============================================
// COLLECTORS API
// ============================================

export const collectorsApi = {
    async list(status?: string): Promise<Collector[]> {
        const query = status ? `?status_filter=${status}` : '';
        return apiCall<Collector[]>(`/collectors${query}`);
    },

    async get(collectorId: string): Promise<Collector> {
        return apiCall<Collector>(`/collectors/${collectorId}`);
    },

    async create(collector: Omit<Collector, 'created_at' | 'updated_at' | 'current_lat' | 'current_lng'>): Promise<Collector> {
        return apiCall<Collector>('/collectors', {
            method: 'POST',
            body: JSON.stringify(collector),
        });
    },

    async update(collectorId: string, collector: Partial<Collector>): Promise<Collector> {
        return apiCall<Collector>(`/collectors/${collectorId}`, {
            method: 'PUT',
            body: JSON.stringify(collector),
        });
    },

    async delete(collectorId: string): Promise<void> {
        return apiCall<void>(`/collectors/${collectorId}`, {
            method: 'DELETE',
        });
    },

    async updateLocation(collectorId: string, lat: number, lng: number): Promise<{ status: string }> {
        return apiCall<{ status: string }>(`/collectors/${collectorId}/location?lat=${lat}&lng=${lng}`, {
            method: 'PATCH',
        });
    },

    async getRoutes(collectorId: string, date?: string): Promise<any[]> {
        const query = date ? `?date_filter=${date}` : '';
        return apiCall<any[]>(`/collectors/${collectorId}/routes${query}`);
    },

    async getTodayRoute(collectorId: string): Promise<any> {
        return apiCall<any>(`/collectors/${collectorId}/today`);
    },
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Sync local store data to database
 */
export async function syncZonesToDatabase(zones: any[]): Promise<void> {
    for (const zone of zones) {
        try {
            // Try to create the zone. We catch the error so sync can continue with containers
            await zonesApi.create({
                id: zone.id,
                name: zone.name,
                category: zone.category,
                priority: zone.priority,
                priority_score: zone.priority_score,
            }).catch(err => {
                console.info(`Zone ${zone.id} already exists or failed, moving to containers...`);
            });

            // Sync containers
            if (zone.containers && zone.containers.length > 0) {
                for (const container of zone.containers) {
                    try {
                        await containersApi.create({
                            id: container.id,
                            zone_id: zone.id,
                            lat: container.lat,
                            lng: container.lng,
                            priority: container.priority,
                        }).catch(err => {
                            if (err.message?.includes('already exists')) {
                                console.info(`Container ${container.id} already exists`);
                            } else {
                                console.warn(`Failed to create container ${container.id}:`, err);
                            }
                        });
                    } catch (error) {
                        console.warn(`Failed to sync container ${container.id}:`, error);
                    }
                }
            }
        } catch (error) {
            console.warn(`Unexpected sync error for zone ${zone.id}:`, error);
        }
    }
}

/**
 * Check if database is available
 */
export async function checkDatabaseAvailability(): Promise<boolean> {
    try {
        await fetch('http://localhost:8000/health');
        return true;
    } catch {
        return false;
    }
}
