export enum Month {
    January = 0,
    February = 1,
    March = 2,
    April = 3,
    May = 4,
    June = 5,
    July = 6,
    August = 7,
    September = 8,
    October = 9,
    November = 10,
    December = 11
}

export const MonthFr: Record<Month, string> = {
    [Month.January]: 'janv.',
    [Month.February]: 'févr.',
    [Month.March]: 'mars',
    [Month.April]: 'avr.',
    [Month.May]: 'mai',
    [Month.June]: 'juin',
    [Month.July]: 'juil.',
    [Month.August]: 'août',
    [Month.September]: 'sept.',
    [Month.October]: 'oct.',
    [Month.November]: 'nov.',
    [Month.December]: 'déc.'
};
