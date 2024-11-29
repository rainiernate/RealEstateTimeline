// All dates internally use noon UTC to avoid timezone edge cases
export const REFERENCE_HOUR = 12;

// Format a date for input fields (YYYY-MM-DD)
export function formatInputDate(date: Date | null): string {
  if (!date) return ''
  // Adjust for timezone to ensure consistent date
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format a date for display (e.g., "Nov 28, 2024")
export function formatDisplayDate(date: Date | null): string {
  if (!date) return ''
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

// Parse a date from an input field
export function parseInputDate(dateStr: string): Date | null {
  if (!dateStr) return null
  
  // Parse the YYYY-MM-DD format and set to UTC noon to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day, REFERENCE_HOUR))
  
  return isNaN(date.getTime()) ? null : date
}

// Calculate days between two dates
export function calculateDaysBetween(start: Date, end: Date): number {
  // Convert both dates to UTC midnight for consistent day calculation
  const startUTC = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())
  const endUTC = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate())
  
  const diffTime = Math.abs(endUTC - startUTC)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Format a date range for display
export function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start || !end) return ''
  return `${formatDisplayDate(start)} - ${formatDisplayDate(end)}`
}

export function addDays(date: Date, days: number): Date {
  const newDate = new Date(date);
  newDate.setUTCDate(date.getUTCDate() + days);
  newDate.setUTCHours(REFERENCE_HOUR, 0, 0, 0);
  return newDate;
}

export function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
}

export function isSameDay(date1: Date | null, date2: Date | null): boolean {
  if (!date1 || !date2) return false;
  return date1.toISOString().split('T')[0] === date2.toISOString().split('T')[0];
}

// Business day utilities
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

export function addBusinessDays(startDate: Date, days: number): Date {
  let currentDate = new Date(startDate);
  currentDate.setUTCHours(REFERENCE_HOUR, 0, 0, 0);
  
  let remainingDays = Math.abs(days);
  const direction = days >= 0 ? 1 : -1;
  
  while (remainingDays > 0) {
    currentDate = addDays(currentDate, direction);
    if (isBusinessDay(currentDate)) {
      remainingDays--;
    }
  }
  
  return currentDate;
}

// Holiday checking
export function isHoliday(date: Date): boolean {
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dayOfWeek = date.getUTCDay();

  // New Year's Day
  if (month === 0 && day === 1) return true;

  // Martin Luther King Jr. Day (3rd Monday in January)
  if (month === 0 && dayOfWeek === 1 && day >= 15 && day <= 21) return true;

  // Presidents' Day (3rd Monday in February)
  if (month === 1 && dayOfWeek === 1 && day >= 15 && day <= 21) return true;

  // Memorial Day (Last Monday in May)
  if (month === 4 && dayOfWeek === 1 && day >= 25 && day <= 31) return true;

  // Juneteenth (June 19)
  if (month === 5 && day === 19) return true;

  // Independence Day (July 4)
  if (month === 6 && day === 4) return true;

  // Labor Day (1st Monday in September)
  if (month === 8 && dayOfWeek === 1 && day <= 7) return true;

  // Indigenous Peoples' Day/Columbus Day (2nd Monday in October)
  if (month === 9 && dayOfWeek === 1 && day >= 8 && day <= 14) return true;

  // Veterans Day (November 11)
  if (month === 10 && day === 11) return true;

  // Thanksgiving Day (4th Thursday in November)
  if (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) return true;

  // Native American Heritage Day (Day after Thanksgiving)
  if (month === 10 && dayOfWeek === 5 && day >= 23 && day <= 29) return true;

  // Christmas Day (December 25)
  if (month === 11 && day === 25) return true;

  return false;
}

export function getHolidayName(date: Date): string | null {
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const dayOfWeek = date.getUTCDay();

  if (!isHoliday(date)) return null;

  // Return holiday names based on the same conditions as isHoliday
  if (month === 0 && day === 1) return "New Year's Day";
  if (month === 0 && dayOfWeek === 1 && day >= 15 && day <= 21) return "Martin Luther King Jr. Day";
  if (month === 1 && dayOfWeek === 1 && day >= 15 && day <= 21) return "Presidents' Day";
  if (month === 4 && dayOfWeek === 1 && day >= 25 && day <= 31) return "Memorial Day";
  if (month === 5 && day === 19) return "Juneteenth";
  if (month === 6 && day === 4) return "Independence Day";
  if (month === 8 && dayOfWeek === 1 && day <= 7) return "Labor Day";
  if (month === 9 && dayOfWeek === 1 && day >= 8 && day <= 14) return "Indigenous Peoples' Day";
  if (month === 10 && day === 11) return "Veterans Day";
  if (month === 10 && dayOfWeek === 4 && day >= 22 && day <= 28) return "Thanksgiving Day";
  if (month === 10 && dayOfWeek === 5 && day >= 23 && day <= 29) return "Native American Heritage Day";
  if (month === 11 && day === 25) return "Christmas Day";

  return null;
}

export const DEFAULT_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  month: 'long',
  day: 'numeric'
};

export const SHORT_DISPLAY_OPTIONS: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
};
