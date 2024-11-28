import { useState, useEffect, useMemo } from 'react'
import { Contingency, TimelineItem } from '../types/timeline'
import { parseDate, getDatesBetween } from '../utils/dateCalculations'
import { isBusinessDay, getNextBusinessDay } from '../utils/businessDays'
import { isHoliday } from '../utils/holidayRules'

// Helper function for date calculations
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
  return date
}

const addBusinessDays = (startDate: Date, days: number): Date => {
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

export function useTimelineData(
  mutualDate: string,
  closingDate: string,
  contingencies: Contingency[]
) {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  
  // Memoize dates array to prevent unnecessary recalculations
  const dates = useMemo(() => {
    if (!mutualDate || !closingDate) return []
    return getDatesBetween(parseDate(mutualDate), parseDate(closingDate))
  }, [mutualDate, closingDate])

  // Calculate timeline items when dependencies change
  useEffect(() => {
    if (!mutualDate || !closingDate) {
      setTimelineItems([])
      return
    }

    const items: TimelineItem[] = [
      {
        name: "Mutual Acceptance",
        date: formatDate(mutualDate),
        daysFromMutual: 0,
        method: "Start Date",
        notes: "",
        isContingency: false,
        status: 'completed',
        order: -1
      }
    ]

    // Add contingencies
    ;(contingencies || []).forEach(contingency => {
      let date: Date
      if (contingency.type === 'fixed_date' && contingency.fixedDate) {
        date = formatDate(contingency.fixedDate)
      } else if (contingency.type === 'days_from_mutual' && contingency.days) {
        const startDate = formatDate(mutualDate)
        if (contingency.days <= 5) {
          // For timelines of 5 days or less, count business days
          date = addBusinessDays(startDate, contingency.days)
        } else {
          // For longer timelines, use calendar days
          date = new Date(startDate.getTime() + contingency.days * 24 * 60 * 60 * 1000)
        }
      } else if (contingency.type === 'days_before_closing' && contingency.days) {
        date = new Date(formatDate(closingDate).getTime() - contingency.days * 24 * 60 * 60 * 1000)
      } else {
        date = new Date()
      }

      items.push({
        name: contingency.name,
        date: new Date(date),
        daysFromMutual: Math.round((date.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
        method: contingency.type === 'fixed_date'
          ? 'Fixed Date'
          : contingency.type === 'days_from_mutual'
            ? `${contingency.days} ${contingency.days <= 5 ? 'business' : ''} days from mutual`
            : `${contingency.days} days before closing`,
        notes: contingency.description || '',
        isContingency: true,
        contingencyId: contingency.id,
        isPossessionDate: contingency.isPossessionDate,
        status: contingency.status,
        order: contingency.order
      })
    })

    // Add closing date
    items.push({
      name: "Closing",
      date: formatDate(closingDate),
      daysFromMutual: Math.round((formatDate(closingDate).getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
      method: "End Date",
      notes: "",
      isContingency: false,
      status: 'not_started',
      order: 999
    })

    // Sort items by date and order
    items.sort((a, b) => {
      if (a.date.getTime() === b.date.getTime()) {
        return a.order - b.order
      }
      return a.date.getTime() - b.date.getTime()
    })

    setTimelineItems(items)
  }, [mutualDate, closingDate, contingencies, dates])

  return {
    timelineItems,
    isLoading: dates.length > 0 && timelineItems.length === 0
  }
}
