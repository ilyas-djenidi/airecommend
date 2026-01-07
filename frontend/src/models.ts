export type ZoneCategory = 'RESIDENTIAL_DENSE' | 'COMMERCIAL_MARKET' | 'INDUSTRIAL' | 'OTHER';
export type WeekDay = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

// Priority now maps to words for UI, but numbers for logic
export type PriorityLabel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export const PriorityValue: Record<PriorityLabel, number> = {
    'CRITICAL': 5,
    'HIGH': 4,
    'MEDIUM': 3,
    'LOW': 2
};

export interface Container {
    id: string;
    lat: number;
    lng: number;
    type: 'bac_a_ordures' | 'benne' | 'skip';
    priority: PriorityLabel;
    zone_id: string; // Parent connection
}

export interface Zone {
    id: string;
    name: string;
    category: ZoneCategory;
    priority: PriorityLabel; // Zone-level default priority
    market_day?: WeekDay;
    notes?: string;
    // Containers are now children of Zones in the input model
    containers: Container[];
}

export interface BaselineSchedule {
    zone_id: string;
    service_days: WeekDay[];
}


export interface FleetResources {
    daily_collectors: number; // Number of collectors/trucks available per day
    shift_start: string;      // HH:MM format (e.g., "06:00")
    shift_end: string;        // HH:MM format (e.g., "14:00")
}

// Events are now optional since we auto-detect, but user can still add custom ones
export type EventType = 'HOLIDAY' | 'RELIGIOUS' | 'SEASONAL_START' | 'SEASONAL_END' | 'OTHER';

export interface CalendarEvent {
    id: string;
    date: string; // YYYY-MM-DD
    label: string;
    type: EventType;
}

export interface SeasonalConfig {
    is_ramadan: boolean;
    is_summer: boolean;
    is_school_period: boolean;
}

// --- OUTPUT MODELS (Matching User JSON) ---

export interface Stop {
    seq: number;
    container_id: string;
    lat: number;
    lng: number;
    eta: string;      // "08:03"
    travel_min: number;
    service_min: number;
    traffic_level: 'low' | 'medium' | 'high';
}

export interface RouteSummary {
    total_travel_min: number;
    total_service_min: number;
    total_min: number;
    distance_km: number;
    overflow_min: number;
    finish_time: string;
}

export interface CollectorRoute {
    collector_id: string;
    stops: Stop[];
    summary: RouteSummary;
}

export interface TrafficLeg {
    from_id: string;
    to_id: string;
    traffic_level: 'low' | 'medium' | 'high';
}

export interface TrafficAdvice {
    recommendation_ar: string;
    recommendation_en: string;
    affected_legs: TrafficLeg[];
}

export interface DailyDecision {
    date: string;
    zone_id: string;
    action: 'SERVICE' | 'SKIP' | 'REINFORCE';
    wpi_score: number;
    explanation: {
        ar: string;
        en: string;
    };
    reasoning_trace: any;
}

export interface DailyPlan {
    date: string; // YYYY-MM-DD

    // High-level Decisions (Strategic)
    decisions: DailyDecision[];

    // Detailed Routing (Tactical) - New
    routes: CollectorRoute[];
    traffic_advice: TrafficAdvice[];

    fleet_status: {
        trucks_used: number;
        trucks_total: number;
        roles_used: Record<string, number>;
    };

    warnings: string[];
}
