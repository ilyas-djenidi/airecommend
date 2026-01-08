import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Zone, BaselineSchedule, FleetResources, CalendarEvent, SeasonalConfig, Container, Collector } from './models';

interface WasteStore {
    zones: Zone[];
    schedule: BaselineSchedule[];
    resources: FleetResources;
    collectors: Collector[];
    events: CalendarEvent[];
    seasons: SeasonalConfig;

    // Actions
    setZones: (zones: Zone[]) => void;
    addZone: (zone: Zone) => void;
    removeZone: (id: string) => void;

    setSchedule: (schedule: BaselineSchedule[]) => void;
    addSchedule: (sched: BaselineSchedule) => void;

    setResources: (resources: FleetResources) => void;
    setCollectors: (collectors: Collector[]) => void;

    setEvents: (events: CalendarEvent[]) => void;

    setSeasons: (seasons: SeasonalConfig) => void;

    addContainerToZone: (zoneId: string, container: Container) => void;
}

const DEFAULT_RESOURCES: FleetResources = {
    daily_collectors: 10,
    shift_start: '06:00',
    shift_end: '14:00'
};

const DEFAULT_SEASONS: SeasonalConfig = {
    is_ramadan: false,
    is_summer: false,
    is_school_period: true
};

export const useStore = create<WasteStore>()(
    persist(
        (set) => ({
            zones: [],
            schedule: [],
            resources: DEFAULT_RESOURCES,
            collectors: [],
            events: [],
            seasons: DEFAULT_SEASONS,

            setZones: (zones) => set({ zones }),
            addZone: (zone) => set((state) => ({ zones: [...state.zones, zone] })),
            removeZone: (id) => set((state) => ({ zones: state.zones.filter(z => z.id !== id) })),

            setSchedule: (schedule) => set({ schedule }),
            addSchedule: (sched) => set((state) => ({
                schedule: [...state.schedule.filter(s => s.zone_id !== sched.zone_id), sched]
            })),

            setResources: (resources) => set({ resources }),
            setCollectors: (collectors) => set({ collectors }),

            setEvents: (events) => set({ events }),

            setSeasons: (seasons) => set({ seasons }),

            addContainerToZone: (zoneId, container) => set((state) => ({
                zones: state.zones.map(zone =>
                    zone.id === zoneId
                        ? { ...zone, containers: [...(zone.containers || []), container] }
                        : zone
                )
            })),
        }),
        {
            name: 'waste-management-storage',
        }
    )
);
