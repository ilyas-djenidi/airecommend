import { useState, useEffect } from 'react';
import { Zone, BaselineSchedule, FleetResources, CalendarEvent, SeasonalConfig, Container } from './models';

const STORAGE_KEYS = {
    ZONES: 'ar_zones',
    SCHEDULE: 'ar_schedule',
    RESOURCES: 'ar_resources',
    EVENTS: 'ar_events',
    SEASONS: 'ar_seasons'
};

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

export function usePersistentState<T>(key: string, initialValue: T) {
    const [state, setState] = useState<T>(() => {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : initialValue;
    });

    useEffect(() => {
        localStorage.setItem(key, JSON.stringify(state));
    }, [key, state]);

    return [state, setState] as const;
}

export function useStore() {
    const [zones, setZones] = usePersistentState<Zone[]>(STORAGE_KEYS.ZONES, []);
    const [schedule, setSchedule] = usePersistentState<BaselineSchedule[]>(STORAGE_KEYS.SCHEDULE, []);
    const [resources, setResources] = usePersistentState<FleetResources>(STORAGE_KEYS.RESOURCES, DEFAULT_RESOURCES);
    const [events, setEvents] = usePersistentState<CalendarEvent[]>(STORAGE_KEYS.EVENTS, []);
    const [seasons, setSeasons] = usePersistentState<SeasonalConfig>(STORAGE_KEYS.SEASONS, DEFAULT_SEASONS);

    const addZone = (zone: Zone) => {
        setZones(prev => [...prev, zone]);
    };

    const removeZone = (id: string) => {
        setZones(prev => prev.filter(z => z.id !== id));
    };

    const addSchedule = (sched: BaselineSchedule) => {
        setSchedule(prev => [...prev.filter(s => s.zone_id !== sched.zone_id), sched]);
    };

    const addContainerToZone = (zoneId: string, container: Container) => {
        setZones(prevZones =>
            prevZones.map(zone =>
                zone.id === zoneId
                    ? { ...zone, containers: [...(zone.containers || []), container] }
                    : zone
            )
        );
    };

    return {
        zones, setZones,
        schedule, setSchedule,
        resources, setResources,
        events, setEvents,
        seasons, setSeasons,
        addZone,
        removeZone,
        addSchedule,
        addContainerToZone
    };
}
