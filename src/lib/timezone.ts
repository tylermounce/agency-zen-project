import { format } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

const PACIFIC_TIMEZONE = 'America/Los_Angeles';

export const formatInPacificTime = (date: string | Date, formatString: string = 'PPp') => {
  return formatInTimeZone(date, PACIFIC_TIMEZONE, formatString);
};

export const toPacificTime = (date: string | Date) => {
  return toZonedTime(date, PACIFIC_TIMEZONE);
};

// Common date formats for the app
export const formatters = {
  dateOnly: (date: string | Date) => formatInPacificTime(date, 'MMM d, yyyy'),
  dateTime: (date: string | Date) => formatInPacificTime(date, 'MMM d, yyyy h:mm a'),
  timeOnly: (date: string | Date) => formatInPacificTime(date, 'h:mm a'),
  shortDate: (date: string | Date) => formatInPacificTime(date, 'M/d/yyyy'),
} as const;