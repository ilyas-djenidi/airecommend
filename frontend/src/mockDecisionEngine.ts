import {
    Zone, BaselineSchedule, FleetResources, CalendarEvent, SeasonalConfig,
    DailyPlan, DailyDecision, WeekDay, CollectorRoute, Stop, TrafficAdvice,
    PriorityValue, PriorityLabel
} from './models';
import { format, addDays, getDay } from 'date-fns';
import { getHoliday } from './services/holidays';

const WEEKDAYS: WeekDay[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function getDayName(date: Date): WeekDay {
    return WEEKDAYS[date.getDay()];
}

// Simulate routing math
function generateEta(startTime: string, minutesToAdd: number): string {
    const [h, m] = startTime.split(':').map(Number);
    const totalM = h * 60 + m + minutesToAdd;
    const newH = Math.floor(totalM / 60) % 24;
    const newM = totalM % 60;
    return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
}

export class MockDecisionEngine {
    constructor(
        private zones: Zone[],
        private schedule: BaselineSchedule[],
        private resources: FleetResources,
        private events: CalendarEvent[],
        private seasons: SeasonalConfig
    ) { }

    public generatePlan(startDateStr: string, daysCount: number): DailyPlan[] {
        const plans: DailyPlan[] = [];
        let currentDate = new Date(startDateStr);

        // Mock history tracking
        const daysSinceService: Record<string, number> = {};
        this.zones.forEach(z => daysSinceService[z.id] = 1);

        for (let i = 0; i < daysCount; i++) {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const dayName = getDayName(currentDate);

            const plan = this.planDay(dateStr, dayName, daysSinceService);
            plans.push(plan);

            // Update history
            plan.decisions.forEach(d => {
                if (d.action !== 'SKIP') {
                    daysSinceService[d.zone_id] = 1;
                } else {
                    daysSinceService[d.zone_id] += 1;
                }
            });

            currentDate = addDays(currentDate, 1);
        }
        return plans;
    }

    private planDay(dateStr: string, dayName: WeekDay, history: Record<string, number>): DailyPlan {
        const decisions: DailyDecision[] = [];
        const routes: CollectorRoute[] = [];
        const trafficAdvice: TrafficAdvice[] = [];

        // 1. Auto-detect Holiday
        const autoHoliday = getHoliday(dateStr);

        // 2. Score and Sort
        const candidates = this.zones.map(zone => {
            const isScheduled = this.isScheduled(zone.id, dayName);
            const wpi = this.calculateWPI(zone, dateStr, dayName, history[zone.id], isScheduled, autoHoliday);
            return { zone, wpi, isScheduled };
        });

        candidates.sort((a, b) => b.wpi.score - a.wpi.score);

        // 3. Allocate Resources & Generate Routes
        // Default to 10 trucks if resources invalid/missing
        let trucksAvailable = (this.resources?.total_trucks || 10);
        let collectorIdCounter = 1;
        let currentShiftTime = this.resources.shift_start;

        // Traffic Simulation Context
        const isRushHour = (time: string) => {
            const h = parseInt(time.split(':')[0]);
            return (h >= 8 && h <= 9) || (h >= 16 && h <= 18);
        };

        for (const cand of candidates) {
            const { zone, wpi } = cand;
            let action: 'SERVICE' | 'SKIP' | 'REINFORCE' = 'SKIP';

            // Advanced Thresholding
            if (wpi.score >= 4.0) action = 'REINFORCE'; // Critical
            else if (wpi.score >= 0.8) action = 'SERVICE';

            // Force skip logic
            if (!cand.isScheduled && wpi.score < 3.5 && zone.priority !== 'CRITICAL') {
                action = 'SKIP';
            }

            if (action === 'SKIP') {
                decisions.push({
                    date: dateStr, zone_id: zone.id, action: 'SKIP', wpi_score: wpi.score,
                    explanation: { en: "Skipped (Low Score)", ar: "تأجيل (أولوية منخفضة)" },
                    reasoning_trace: wpi.components
                });
                continue;
            }

            const trucksNeeded = action === 'REINFORCE' ? 2 : 1;

            if (trucksAvailable >= trucksNeeded) {
                trucksAvailable -= trucksNeeded;

                decisions.push({
                    date: dateStr, zone_id: zone.id, action, wpi_score: wpi.score,
                    explanation: this.generateExplanation(wpi.components, action),
                    reasoning_trace: wpi.components
                });

                // --- ROUTING GENERATION (The "Professional Output") ---
                // STRICTLY use user-defined containers. Do NOT generate fake ones.
                const containers = zone.containers || [];

                if (containers.length === 0) {
                    // If no containers, we might just track the zone visit without stops, 
                    // or skip adding a route segment if strictly stop-based.
                    // For now, let's treat it as a drive-by (0 stops) or just continue.
                    continue;
                }

                const stops: Stop[] = [];
                let accumulatedMin = 0;
                let lastStopEta = this.resources.shift_start;

                containers.forEach((cont, seq) => {
                    const travel = Math.floor(Math.random() * 5) + 2; // 2-7 mins (Simulation)
                    const service = 5; // Fixed service time
                    const eta = generateEta(lastStopEta, travel);
                    const traffic = isRushHour(eta) ? 'high' : 'low';

                    stops.push({
                        seq: seq + 1,
                        container_id: cont.id,
                        lat: cont.lat,
                        lng: cont.lng,
                        eta: eta,
                        travel_min: travel,
                        service_min: service,
                        traffic_level: traffic
                    });


                    accumulatedMin += travel + service;
                    lastStopEta = generateEta(eta, service);
                });

                routes.push({
                    collector_id: `C${collectorIdCounter++}`,
                    stops: stops,
                    summary: {
                        total_travel_min: stops.reduce((sum, s) => sum + s.travel_min, 0),
                        total_service_min: stops.reduce((sum, s) => sum + s.service_min, 0),
                        total_min: accumulatedMin,
                        distance_km: parseFloat((accumulatedMin * 0.4).toFixed(2)), // Approx speed
                        overflow_min: 0,
                        finish_time: lastStopEta
                    }
                });

                // Add Traffic Advice if high traffic encountered
                if (stops.some(s => s.traffic_level === 'high')) {
                    trafficAdvice.push({
                        recommendation_en: `High traffic in ${zone.name}. Avoid between 08:00-09:30.`,
                        recommendation_ar: `ازدحام في ${zone.name}. تجنب التوقيت 08:00-09:30.`,
                        affected_legs: stops.filter(s => s.traffic_level === 'high').map(s => ({
                            from_id: 'PREV', to_id: s.container_id, traffic_level: 'high'
                        }))
                    });
                }

            } else {
                // CUTOFF
                decisions.push({
                    date: dateStr, zone_id: zone.id, action: 'SKIP', wpi_score: wpi.score,
                    explanation: { en: `Deferral: Fleet Capacity Reached`, ar: "تأجيل: نفاذ الشاحنات" },
                    reasoning_trace: { ...wpi.components, cutoff: true }
                });
            }
        }

        return {
            date: dateStr,
            decisions,
            routes,
            traffic_advice: trafficAdvice,
            fleet_status: {
                trucks_total: this.resources.total_trucks,
                trucks_used: this.resources.total_trucks - trucksAvailable,
                roles_used: {}
            },
            warnings: []
        };
    }

    private isScheduled(zoneId: string, day: WeekDay): boolean {
        const rule = this.schedule.find(s => s.zone_id === zoneId);
        // Default to TRUE (Available) if no schedule exists, to ensure user-added zones appear.
        return rule ? rule.service_days.includes(day) : true;
    }

    private calculateWPI(zone: Zone, dateStr: string, dayName: WeekDay, daysSince: number, isScheduled: boolean, autoHoliday: any) {
        let score = 1.0;
        const components: any = { base: 1.0 };

        if (zone.category === 'COMMERCIAL_MARKET') { score *= 1.5; components.zone_factor = 1.5; }

        const accFactor = daysSince === 1 ? 1.0 : (daysSince === 2 ? 2.2 : 3.5);
        score *= accFactor; components.accumulation = accFactor;

        if (zone.market_day === dayName) { score *= 2.0; components.market_day = 2.0; }

        if (this.seasons.is_ramadan) { score *= 1.3; components.ramadan = 1.3; }

        // Auto Holiday Logic
        if (autoHoliday) {
            score *= 3.0;
            components.event = autoHoliday.name;
        } else {
            // Manual events fallback
            const manual = this.events.find(e => e.date === dateStr);
            if (manual) { score *= 2.5; components.event = manual.label; }
        }

        // Priority Value (Numeric)
        const prioVal = PriorityValue[zone.priority] || 3;
        if (prioVal === 5) { score += 5.0; components.strategic_boost = 5.0; } // Critical
        if (prioVal === 4) { score += 2.0; components.strategic_boost = 2.0; } // High

        if (!isScheduled && score < 5.0) { score *= 0.5; components.off_schedule_penalty = 0.5; }

        return { score: parseFloat(score.toFixed(2)), components };
    }

    private generateExplanation(components: any, action: string): { en: string, ar: string } {
        const partsEn = [];
        const partsAr = [];

        if (components.market_day) { partsEn.push("Market Day"); partsAr.push("يوم سوق"); }
        if (components.accumulation > 1.0) { partsEn.push(`Accumulation x${components.accumulation}`); partsAr.push(`تراكم x${components.accumulation}`); }
        if (components.strategic_boost) { partsEn.push("Priority Boost"); partsAr.push("أولوية استراتيجية"); }
        if (components.event) { partsEn.push(`Holiday: ${components.event}`); partsAr.push(`عطلة: ${components.event}`); }

        const reasonEn = partsEn.join(" + ");
        const reasonAr = partsAr.join(" + ");

        return {
            en: `${action}: ${reasonEn || "Normal Schedule"}`,
            ar: `${action === 'REINFORCE' ? 'تعزيز' : 'خدمة عادية'}: ${reasonAr || "جدول عادي"}`
        };
    }
}
