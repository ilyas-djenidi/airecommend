import {
    Zone, FleetResources,
    DailyPlan, CollectorRoute
} from './models';
import { api, ApiOptimizationRequest, ApiRoute } from './services/api';

export class RealDecisionEngine {
    constructor(
        private zones: Zone[],
        private resources: FleetResources,
        // Schedule/Events/Seasons unused for API payload specifically as logic is in backend,
        // but kept for consistency if we want to send them later.
    ) { }

    public async generatePlan(startDateStr: string): Promise<DailyPlan> {
        // 1. Prepare Payload
        const depot = { id: 'DEPOT_MAIN', lat: 36.7525, lng: 3.0420 }; // Default Algiers Depot

        // Flatten containers from zones
        const containers = this.zones.flatMap(z =>
            (z.containers || []).map(c => ({
                id: c.id,
                lat: c.lat,
                lng: c.lng
            }))
        );

        // Generate collectors based on resources.daily_collectors
        const collectorCount = this.resources.daily_collectors || 10;
        const collectors = Array(collectorCount).fill(null).map((_, i) => ({
            id: `C${i + 1}`,
            start_lat: depot.lat,
            start_lng: depot.lng,
            shift_start: this.resources.shift_start || "08:00",
            shift_end: this.resources.shift_end || "16:00"
        }));

        const payload: ApiOptimizationRequest = {
            date: startDateStr,
            depot,
            collectors,
            containers
        };

        console.log(`[RealDecisionEngine] Sending optimization request for ${startDateStr}:`, {
            zonesCount: this.zones.length,
            containersCount: containers.length,
            collectorCount: collectors.length
        });

        // 2. Call API
        try {
            const response = await api.optimizeDay(payload);

            // 3. Map Response to DailyPlan
            return {
                date: response.date,
                decisions: [], // Backend currently doesn't return zone-level decisions (WPI), only routes. We'll leave empty.
                routes: response.routes.map(r => this.mapRoute(r)),
                traffic_advice: response.traffic_advice.map(t => ({
                    recommendation_ar: t.recommendation_ar,
                    recommendation_en: t.recommendation_en,
                    affected_legs: t.affected_legs.map(l => ({ ...l, traffic_level: l.traffic_level as any }))
                })),
                fleet_status: {
                    trucks_total: collectorCount,
                    trucks_used: response.routes.length,
                    roles_used: {}
                },
                warnings: response.warnings.map(w => w.message)
            };

        } catch (e: any) {
            console.error("Engine Error", e);
            // Return empty error plan
            return {
                date: startDateStr,
                decisions: [],
                routes: [],
                traffic_advice: [],
                fleet_status: { trucks_total: 0, trucks_used: 0, roles_used: {} },
                warnings: [`API Error: ${e.message}`]
            };
        }
    }

    private mapRoute(apiRoute: ApiRoute): CollectorRoute {
        return {
            collector_id: apiRoute.collector_id,
            stops: apiRoute.stops.map(s => ({
                seq: s.seq,
                container_id: s.container_id,
                lat: s.lat,
                lng: s.lng,
                eta: s.eta,
                travel_min: s.travel_min,
                service_min: s.service_min,
                traffic_level: s.traffic_level
            })),
            summary: {
                total_travel_min: apiRoute.summary.total_travel_min,
                total_service_min: apiRoute.summary.total_service_min,
                total_min: apiRoute.summary.total_min,
                distance_km: apiRoute.summary.distance_km,
                overflow_min: apiRoute.summary.overflow_min,
                finish_time: apiRoute.summary.finish_time || "N/A"
            }
        };
    }
}
