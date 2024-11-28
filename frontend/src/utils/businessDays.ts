import { isHoliday, getHolidayName } from './holidayRules'

// Helper function to check if a date is a business day
export function isBusinessDay(date: Date): boolean {
  const day = date.getUTCDay()
  return day !== 0 && day !== 6 // 0 is Sunday, 6 is Saturday
}

// Helper function to get next business day
export function getNextBusinessDay(date: Date, days: number = 1): Date {
  const nextDay = new Date(date)
  nextDay.setUTCHours(12, 0, 0, 0)
  
  let daysToAdd = days
  
  do {
    nextDay.setDate(nextDay.getUTCDate() + (daysToAdd > 0 ? 1 : -1))
    nextDay.setUTCHours(12, 0, 0, 0)
    if (isBusinessDay(nextDay)) {
      daysToAdd += daysToAdd > 0 ? -1 : 1
    }
  } while (daysToAdd !== 0)
  
  return nextDay
}

// Helper function to get previous business day
export function getPreviousBusinessDay(date: Date): Date {
  return getNextBusinessDay(date, -1)
}

// Calculate business days before a date
export function getBusinessDaysBeforeDate(endDate: Date, daysNeeded: number): Date {
  return getNextBusinessDay(endDate, -daysNeeded)
}

// Add business days to a date
export function addBusinessDays(startDate: Date, days: number): Date {
  let currentDate = new Date(startDate)
  let businessDaysCount = 0
  
  currentDate.setUTCHours(0, 0, 0, 0)
  
  while (businessDaysCount < days) {
    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
    currentDate.setUTCHours(0, 0, 0, 0)
    
    if (isBusinessDay(currentDate)) {
      businessDaysCount++
    }
  }
  
  return currentDate
}
