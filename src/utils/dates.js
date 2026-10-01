import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}(?:T00:00:00(?:\.000)?Z)?$/;

export const parseStoredDate = (value) => {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
    }

    if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value)) {
        const [year, month, day] = value.slice(0, 10).split('-').map(Number);
        return new Date(year, month - 1, day, 12, 0, 0, 0);
    }

    const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
    return isValid(parsed) ? parsed : null;
};

export const compareStoredDates = (left, right) => {
    const leftDate = parseStoredDate(left);
    const rightDate = parseStoredDate(right);

    if (!leftDate && !rightDate) return 0;
    if (!leftDate) return 1;
    if (!rightDate) return -1;

    return leftDate.getTime() - rightDate.getTime();
};

export const formatStoredDate = (value, pattern = 'dd MMM yyyy', fallback = 'Sin fecha') => {
    const date = parseStoredDate(value);
    return date ? format(date, pattern, { locale: es }) : fallback;
};

export const toStoredLocaleDate = (value, locale = undefined, options = undefined, fallback = 'Sin fecha') => {
    const date = parseStoredDate(value);
    return date ? date.toLocaleDateString(locale, options) : fallback;
};

export const getStoredDateDayLabel = (value, fallback = '__') => {
    const date = parseStoredDate(value);
    return date ? format(date, 'd', { locale: es }) : fallback;
};
