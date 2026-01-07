export interface Holiday {
    date: string; // YYYY-MM-DD
    name: string;
    type: 'NATIONAL' | 'RELIGIOUS';
}

// Fixed National Holidays
const FIXED_HOLIDAYS: Record<string, string> = {
    '01-01': 'New Year\'s Day',
    '01-12': 'Yennayer (Amazigh New Year)',
    '05-01': 'Labour Day',
    '07-05': 'Independence Day',
    '11-01': 'Revolution Day'
};

// Islamic Holidays (Approximated for 2024-2030 to avoid complex Hijri calculation library dependency)
// Format: YYYY-MM-DD
const ISLAMIC_HOLIDAYS_LOOKUP: Record<string, string> = {
    // 2024
    '2024-04-10': 'Eid al-Fitr',
    '2024-06-16': 'Eid al-Adha',
    '2024-07-07': 'Muharram (New Year)',
    '2024-07-16': 'Ashura',
    '2024-09-15': 'Mawlid',

    // 2025
    '2025-03-31': 'Eid al-Fitr',
    '2025-06-06': 'Eid al-Adha',
    '2025-06-26': 'Muharram (New Year)',
    '2025-07-05': 'Ashura',
    '2025-09-04': 'Mawlid',

    // 2026
    '2026-03-20': 'Eid al-Fitr',
    '2026-05-27': 'Eid al-Adha',
    '2026-06-16': 'Muharram (New Year)',
    '2026-06-25': 'Ashura',
    '2026-08-25': 'Mawlid'
};

export const getHoliday = (dateStr: string): Holiday | null => {
    const [year, month, day] = dateStr.split('-');
    const shortDate = `${month}-${day}`;

    // Check Fixed
    if (FIXED_HOLIDAYS[shortDate]) {
        return { date: dateStr, name: FIXED_HOLIDAYS[shortDate], type: 'NATIONAL' };
    }

    // Check Islamic
    if (ISLAMIC_HOLIDAYS_LOOKUP[dateStr]) {
        return { date: dateStr, name: ISLAMIC_HOLIDAYS_LOOKUP[dateStr], type: 'RELIGIOUS' };
    }

    // Check Islamic adjacent (holidays often span 2 days)
    // Simple logic: if yesterday was Eid, today is still holiday effective
    // This is handled by the engine's "Accumulation/Context" logic usually, but we can flag it here if needed.

    return null;
};

export const isHoliday = (dateStr: string): boolean => {
    return !!getHoliday(dateStr);
};
