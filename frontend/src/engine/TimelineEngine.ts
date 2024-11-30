import { Contingency, TimelineItem, ContingencyDate } from '../types/timeline'
import { isHoliday, getHolidayName } from '../utils/holidayRules'
import { isWeekend, isBusinessDay } from '../utils/dateHelpers'

export class TimelineEngine {
  private static REFERENCE_HOUR = 12;

  /**
   * Parse a date string or Date object into a normalized Date object
   */
  static parseDate(date: string | Date | null): Date | null {
    if (!date) return null

    try {
      let parsedDate: Date

      if (date instanceof Date) {
        parsedDate = new Date(date)
      } else if (typeof date === 'string') {
        // Try ISO format first
        parsedDate = new Date(date)
        
        // If invalid, try parsing YYYY-MM-DD format
        if (isNaN(parsedDate.getTime())) {
          const [year, month, day] = date.split('-').map(Number)
          parsedDate = new Date(Date.UTC(year, month - 1, day))
        }
      } else {
        return null
      }

      // Validate and normalize
      return isNaN(parsedDate.getTime()) ? null : this.normalizeDate(parsedDate)
    } catch (error) {
      console.error('Error parsing date:', error)
      return null
    }
  }

  /**
   * Format a Date object to YYYY-MM-DD string
   */
  static formatDate(date: Date | null): string {
    if (!date) return ''
    const normalizedDate = this.normalizeDate(date)
    return normalizedDate.toISOString().split('T')[0]
  }

  /**
   * Normalize a date to UTC noon
   */
  static normalizeDate(date: Date): Date {
    const normalized = new Date(date)
    normalized.setUTCHours(this.REFERENCE_HOUR, 0, 0, 0)
    return normalized
  }

  /**
   * Add days to a date, respecting the business day rule
   * For ≤5 days: Use business days (skip weekends and holidays)
   * For >5 days: Use calendar days (include all days)
   */
  static addDays(date: Date, days: number): Date {
    const useBusinessDays = days <= 5
    const result = this.normalizeDate(new Date(date))
    
    if (useBusinessDays) {
      // For ≤5 days, skip weekends and holidays
      let remainingDays = days
      while (remainingDays > 0) {
        result.setUTCDate(result.getUTCDate() + 1)
        if (isBusinessDay(result) && !isHoliday(result)) {
          remainingDays--
        }
      }
    } else {
      // For >5 days, include all days
      result.setUTCDate(result.getUTCDate() + days)
    }
    
    // If we land on a weekend or holiday, move to the next business day
    while (!isBusinessDay(result) || isHoliday(result)) {
      result.setUTCDate(result.getUTCDate() - 1)
    }
    
    return result
  }

  /**
   * Subtract days from a date, respecting the business day rule
   * For ≤5 days: Use business days (skip weekends and holidays)
   * For >5 days: Use calendar days (include all days)
   */
  static subtractDays(date: Date, days: number): Date {
    const useBusinessDays = days <= 5
    const result = this.normalizeDate(new Date(date))
    
    if (useBusinessDays) {
      // For ≤5 days, skip weekends and holidays
      let remainingDays = days
      while (remainingDays > 0) {
        result.setUTCDate(result.getUTCDate() - 1)
        if (this.isBusinessDay(result) && !this.isHoliday(result)) {
          remainingDays--
        }
      }
    } else {
      // For >5 days, include all days
      result.setUTCDate(result.getUTCDate() - days)
    }
    
    // If we land on a weekend or holiday, move to the next business day
    while (!this.isBusinessDay(result) || this.isHoliday(result)) {
      result.setUTCDate(result.getUTCDate() + 1)
    }
    
    return result
  }

  /**
   * Calculate days between two dates
   */
  static calculateDaysBetween(start: Date, end: Date): number {
    const startNorm = this.normalizeDate(start)
    const endNorm = this.normalizeDate(end)
    return Math.round((endNorm.getTime() - startNorm.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate all dates for a contingency based on its type and parameters
   * Rules for all contingency types:
   * - startDate: when the task/period begins
   * - endDate: reference date (mutual or closing)
   * 
   * For days_from_mutual:
   * - endDate = start + days
   * - startDate = day after mutual
   * 
   * For days_before_closing:
   * - endDate = day before closing
   * - startDate = closing - days
   * 
   * For fixed_date:
   * - startDate = fixed date
   * - endDate = fixed date
   * 
   * For fixed_period:
   * - startDate = start_date
   * - endDate = end_date
   */
  static calculateContingencyDates(
    contingency: Contingency,
    mutualDate: string,
    closingDate: string
  ): ContingencyDate | null {
    const parsedMutual = this.parseDate(mutualDate)
    const parsedClosing = this.parseDate(closingDate)
    if (!parsedMutual || !parsedClosing) return null

    const days = typeof contingency.days === 'string' 
      ? parseInt(contingency.days.trim()) 
      : (contingency.days || 0)
    
    const useBusinessDays = days <= 5

    let startDate: Date
    let endDate: Date

    switch (contingency.type) {
      case 'days_from_mutual':
        // Start counting from day after mutual
        startDate = new Date(this.normalizeDate(parsedMutual))
        startDate.setUTCDate(startDate.getUTCDate() + 1)
        
        // End date is start + days
        if (useBusinessDays) {
          endDate = this.addDays(startDate, days)
        } else {
          endDate = new Date(startDate)
          endDate.setUTCDate(endDate.getUTCDate() + days)
        }
        break

      case 'days_before_closing':
        // End date is day before closing
        endDate = new Date(this.normalizeDate(parsedClosing))
        endDate.setUTCDate(endDate.getUTCDate() - 1)
        
        // Start date is closing - days
        if (useBusinessDays) {
          startDate = this.subtractDays(parsedClosing, days)
        } else {
          startDate = new Date(parsedClosing)
          startDate.setUTCDate(startDate.getUTCDate() - days)
        }
        break

      case 'fixed_date':
        // Fixed date is a point in time
        const parsedFixed = this.parseDate(contingency.fixed_date || '')
        if (!parsedFixed) return null
        
        startDate = this.normalizeDate(parsedFixed)
        endDate = startDate // Same as start since it's a point
        break

      case 'fixed_period':
        // Fixed period is a range of dates
        const parsedStart = this.parseDate(contingency.start_date || '')
        const parsedEnd = this.parseDate(contingency.end_date || '')
        if (!parsedStart || !parsedEnd) return null
        
        startDate = this.normalizeDate(parsedStart)
        endDate = this.normalizeDate(parsedEnd)
        break

      default:
        return null
    }

    return {
      contingencyId: contingency.id,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      days
    }
  }

  /**
   * Calculate all timeline items with their dates
   */
  static calculateTimelineItems(
    mutualDate: string,
    closingDate: string,
    contingencies: Contingency[]
  ): TimelineItem[] {
    const parsedMutual = this.parseDate(mutualDate)
    const parsedClosing = this.parseDate(closingDate)
    if (!parsedMutual || !parsedClosing) return []

    const items: TimelineItem[] = []

    // Add mutual acceptance
    items.push({
      name: 'Mutual Acceptance',
      date: parsedMutual,
      startDate: parsedMutual,
      endDate: parsedMutual,
      daysFromMutual: 0,
      method: 'Mutual Acceptance',
      notes: '',
      isContingency: false,
      type: 'milestone'
    })

    // Add contingencies
    for (const contingency of contingencies) {
      const dates = this.calculateContingencyDates(contingency, mutualDate, closingDate)
      if (!dates) continue

      const startDate = this.parseDate(dates.startDate)
      const endDate = this.parseDate(dates.endDate)
      if (!startDate || !endDate) continue

      items.push({
        name: contingency.name,
        date: endDate,
        startDate: startDate,
        endDate: endDate,
        daysFromMutual: this.calculateDaysBetween(parsedMutual, endDate),
        method: this.getMethodDescription(contingency),
        notes: contingency.description || '',
        isContingency: true,
        type: startDate.getTime() === endDate.getTime() ? 'milestone' : 'range',
        status: contingency.status || 'pending',
        contingencyId: contingency.id
      })
    }

    // Add closing
    items.push({
      name: 'Closing',
      date: parsedClosing,
      startDate: parsedClosing,
      endDate: parsedClosing,
      daysFromMutual: this.calculateDaysBetween(parsedMutual, parsedClosing),
      method: 'Closing',
      notes: '',
      isContingency: false,
      type: 'milestone'
    })

    return items.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  /**
   * Get a human-readable description of the contingency method
   */
  private static getMethodDescription(contingency: Contingency): string {
    switch (contingency.type) {
      case 'fixed_date':
        return 'Fixed Date'
      case 'days_from_mutual':
        return `${contingency.days} ${contingency.days <= 5 ? 'business' : ''} days from mutual`
      case 'days_before_closing':
        return `${contingency.days} ${contingency.days <= 5 ? 'business' : ''} days before closing`
      case 'fixed_period':
        return `Fixed Period: ${contingency.start_date} - ${contingency.end_date}`
      default:
        return ''
    }
  }

  /**
   * Get all dates between start and end dates
   */
  static getDateRange(startDate: Date, endDate: Date): Date[] {
    const dates: Date[] = []
    const current = this.normalizeDate(new Date(startDate))
    const end = this.normalizeDate(new Date(endDate))

    while (current <= end) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return dates
  }

  /**
   * Check if a date is a business day (Monday-Friday)
   */
  static isBusinessDay(date: Date): boolean {
    return isBusinessDay(this.normalizeDate(date));
  }

  /**
   * Check if a date is a weekend (Saturday-Sunday)
   */
  static isWeekend(date: Date): boolean {
    return isWeekend(this.normalizeDate(date));
  }

  /**
   * Check if a date is a holiday and return its name
   */
  static getHolidayName(date: Date): string | null {
    return getHolidayName(this.normalizeDate(date));
  }

  /**
   * Check if a date is a holiday
   */
  static isHoliday(date: Date): boolean {
    return isHoliday(this.normalizeDate(date));
  }

  /**
   * Compare two dates for equality, ignoring time
   */
  static compareDate(date1: Date | string | null, date2: Date | string | null): boolean {
    if (!date1 || !date2) return false
    
    const d1 = date1 instanceof Date ? date1 : this.parseDate(date1)
    const d2 = date2 instanceof Date ? date2 : this.parseDate(date2)

    if (!d1 || !d2) return false

    return d1.getUTCFullYear() === d2.getUTCFullYear() &&
           d1.getUTCMonth() === d2.getUTCMonth() &&
           d1.getUTCDate() === d2.getUTCDate()
  }
}
