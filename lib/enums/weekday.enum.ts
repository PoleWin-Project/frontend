export enum Weekday {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6
}

export const WeekdayFr: Record<Weekday, string> = {
    [Weekday.Sunday]: 'dim.',
    [Weekday.Monday]: 'lun.',
    [Weekday.Tuesday]: 'mar.',
    [Weekday.Wednesday]: 'mer.',
    [Weekday.Thursday]: 'jeu.',
    [Weekday.Friday]: 'ven.',
    [Weekday.Saturday]: 'sam.'
};
