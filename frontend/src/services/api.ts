
const API_BASE_URL = 'http://localhost:8000';

export interface ApiOptimizationRequest {
    date: string;
    depot: { id: string; lat: number; lng: number };
    collectors: {
        id: string;
        start_lat: number;
        start_lng: number;
        shift_start: string;
        shift_end: string;
    }[];
    containers: {
        id: string;
        lat: number;
        lng: number;
    }[];
}

export interface ApiRouteSummary {
    total_travel_min: number;
    total_service_min: number;
    total_min: number;
    distance_km: number;
    overflow_min: number;
    finish_time: string | null;
}

export interface ApiRoute {
    collector_id: string;
    stops: {
        seq: number;
        container_id: string;
        lat: number;
        lng: number;
        eta: string;
        travel_min: number;
        service_min: number;
        traffic_level: 'low' | 'medium' | 'high';
    }[];
    summary: ApiRouteSummary;
    geometry?: { lat: number; lng: number }[];
}

export interface ApiTrafficLeg {
    from_id: string;
    to_id: string;
    traffic_level: string;
}

export interface ApiTrafficAdvice {
    recommendation_ar: string;
    recommendation_en: string;
    affected_legs: ApiTrafficLeg[];
}

export interface ApiResponse {
    status: 'ok' | 'error';
    date: string;
    routes: ApiRoute[];
    traffic_advice: ApiTrafficAdvice[];
    warnings: { code: string; message: string }[];
    error_message?: string;
}

export const api = {
    async optimizeDay(payload: ApiOptimizationRequest): Promise<ApiResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/optimize-day`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'API Request Failed');
            }

            return await response.json();
        } catch (error) {
            console.error("API Error:", error);
            throw error;
        }
    }
};
