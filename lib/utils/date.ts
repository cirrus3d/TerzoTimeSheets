import { format, parse, addDays, subDays } from 'date-fns';

export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function parseDate(dateString: string): Date {
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

export function getNextDay(dateString: string): string {
  const date = parseDate(dateString);
  return formatDate(addDays(date, 1));
}

export function getPreviousDay(dateString: string): string {
  const date = parseDate(dateString);
  return formatDate(subDays(date, 1));
}

export function formatDisplayDate(dateString: string): string {
  const date = parseDate(dateString);
  return format(date, 'EEEE, MMMM d, yyyy');
}
