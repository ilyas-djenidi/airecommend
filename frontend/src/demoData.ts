import { Zone, BaselineSchedule, CalendarEvent, FleetResources, SeasonalConfig } from './models';

const CONTAINERS_MARKET = [
    { id: 'B301', lat: 36.7581, lng: 3.0492, priority: 'CRITICAL', type: 'benne', zone_id: 'ZN-MARKET' },
    { id: 'B302', lat: 36.7617, lng: 3.0614, priority: 'CRITICAL', type: 'benne', zone_id: 'ZN-MARKET' },
    { id: 'B303', lat: 36.7669, lng: 3.0748, priority: 'HIGH', type: 'benne', zone_id: 'ZN-MARKET' },
    { id: 'B307', lat: 36.7473, lng: 3.0541, priority: 'HIGH', type: 'benne', zone_id: 'ZN-MARKET' },
];

const CONTAINERS_HOSPITAL = [
    { id: 'H100', lat: 36.7754, lng: 3.0521, priority: 'CRITICAL', type: 'skip', zone_id: 'ZN-HOSPITAL' },
    { id: 'H102', lat: 36.7832, lng: 3.0609, priority: 'CRITICAL', type: 'skip', zone_id: 'ZN-HOSPITAL' },
];

const CONTAINERS_RESID_1 = [
    { id: 'R501', lat: 36.7891, lng: 3.0697, priority: 'MEDIUM', type: 'bac_a_ordures', zone_id: 'ZN-RESID-1' },
    { id: 'R502', lat: 36.7910, lng: 3.0710, priority: 'MEDIUM', type: 'bac_a_ordures', zone_id: 'ZN-RESID-1' },
];
const CONTAINERS_RESID_2 = [
    { id: 'R601', lat: 36.7450, lng: 3.0300, priority: 'MEDIUM', type: 'bac_a_ordures', zone_id: 'ZN-RESID-2' },
    { id: 'R602', lat: 36.7460, lng: 3.0310, priority: 'LOW', type: 'bac_a_ordures', zone_id: 'ZN-RESID-2' },
    { id: 'R603', lat: 36.7470, lng: 3.0320, priority: 'MEDIUM', type: 'bac_a_ordures', zone_id: 'ZN-RESID-2' },
];

const CONTAINERS_IND_1 = [
    { id: 'I901', lat: 36.7200, lng: 3.1000, priority: 'LOW', type: 'benne', zone_id: 'ZN-IND-1' },
    { id: 'I902', lat: 36.7250, lng: 3.1050, priority: 'LOW', type: 'benne', zone_id: 'ZN-IND-1' },
];

export const DEMO_ZONES: Zone[] = [
    {
        id: 'ZN-HOSPITAL', name: 'Mustapha Pasha Hospital', category: 'OTHER', priority: 'CRITICAL',
        notes: 'Medical waste focus, zero tolerance for delay.',
        containers: CONTAINERS_HOSPITAL as any
    },
    {
        id: 'ZN-MARKET', name: 'Belouizdad Market', category: 'COMMERCIAL_MARKET', priority: 'HIGH', market_day: 'FRIDAY',
        containers: CONTAINERS_MARKET as any
    },
    {
        id: 'ZN-RESID-1', name: 'El Biar Center', category: 'RESIDENTIAL_DENSE', priority: 'MEDIUM',
        containers: CONTAINERS_RESID_1 as any
    },
    {
        id: 'ZN-RESID-2', name: 'Hydra Heights', category: 'RESIDENTIAL_DENSE', priority: 'MEDIUM',
        containers: CONTAINERS_RESID_2 as any
    },
    {
        id: 'ZN-IND-1', name: 'Oued Smar Industrial', category: 'INDUSTRIAL', priority: 'LOW',
        containers: CONTAINERS_IND_1 as any
    },
];

export const DEMO_SCHEDULE: BaselineSchedule[] = [
    { zone_id: 'ZN-HOSPITAL', service_days: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] },
    { zone_id: 'ZN-MARKET', service_days: ['SUNDAY', 'TUESDAY', 'THURSDAY', 'FRIDAY'] },
    { zone_id: 'ZN-RESID-1', service_days: ['SUNDAY', 'TUESDAY', 'THURSDAY'] },
    { zone_id: 'ZN-RESID-2', service_days: ['SUNDAY', 'TUESDAY', 'THURSDAY'] },
    { zone_id: 'ZN-IND-1', service_days: ['SUNDAY', 'WEDNESDAY'] },
];

export const DEMO_RESOURCES: FleetResources = {
    daily_collectors: 3,
    shift_start: '06:00',
    shift_end: '14:00'
};

// Events are auto-detected now, but we keep this for custom overrides if needed
export const DEMO_EVENTS: CalendarEvent[] = [];

export const DEMO_SEASONS: SeasonalConfig = {
    is_ramadan: false,
    is_summer: true,
    is_school_period: false
};
