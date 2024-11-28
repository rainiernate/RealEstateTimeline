import { isHoliday, getHolidayName } from './holidayRules'

// Helper function to check if a date is a business day
export function isBusinessDay(date: Date): boolean {
  const dayOfWeek = date.getDay()
  return dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday(date)
}

// Helper function to get next business day
export function getNextBusinessDay(date: Date, days: number = 1): Date {
  let result = new Date(date)
  let daysToAdd = days
  
  while (daysToAdd !== 0) {
    result.setDate(result.getDate() + (daysToAdd > 0 ? 1 : -1))
    if (isBusinessDay(result)) {
      daysToAdd += daysToAdd > 0 ? -1 : 1
    }
  }
  
  return result
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
  
  currentDate.setDate(currentDate.getDate())
  
  while (businessDaysCount < days) {
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setHours(0, 0, 0, 0)
    
    if (isBusinessDay(currentDate)) {
      businessDaysCount++
    }
  }
  
  return currentDate
}
