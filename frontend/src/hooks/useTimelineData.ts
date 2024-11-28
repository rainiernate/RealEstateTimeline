import { useState, useEffect, useMemo } from 'react'
import { Contingency, TimelineItem } from '../types/timeline'
import { parseDate, getDatesBetween } from '../utils/dateCalculations'
import { isBusinessDay, getNextBusinessDay } from '../utils/businessDays'
import { isHoliday } from '../utils/holidayRules'

// Helper function for date calculations
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  date.setUTCHours(12, 0, 0, 0)
  return date
}

const addBusinessDays = (startDate: Date, days: number): Date => {
  let currentDate = new Date(startDate)
  let businessDaysCount = 0
  
  // Preserve noon UTC time
  currentDate.setUTCHours(12, 0, 0, 0)
  
  while (businessDaysCount < days) {
    currentDate.setDate(currentDate.getDate() + 1)
    currentDate.setUTCHours(12, 0, 0, 0)
    
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

  const handleTimelineReorder = (reorderedItems: TimelineItem[]) => {
    // Update contingency orders based on the new timeline order
    const updatedContingencies = [...contingencies]
    reorderedItems.forEach((item, index) => {
      if (item.contingencyId) {
        const contingencyIndex = updatedContingencies.findIndex(c => c.id === item.contingencyId)
        if (contingencyIndex !== -1) {
          updatedContingencies[contingencyIndex] = {
            ...updatedContingencies[contingencyIndex],
            order: index
          }
        }
      }
    })

    // Update timeline items with new order
    setTimelineItems(reorderedItems)
  }

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

    // Add contingencies with their order preserved
    ;(contingencies || []).forEach((contingency, index) => {
      let startDate: Date
      let endDate: Date

      if (contingency.type === 'fixed_date' && contingency.fixedDate) {
        startDate = formatDate(contingency.fixedDate)
        endDate = startDate // For fixed dates, start and end are the same
      } else if (contingency.type === 'days_from_mutual' && contingency.days) {
        startDate = formatDate(mutualDate)
        if (contingency.days <= 5 || contingency.useBusinessDays) {
          // For timelines of 5 days or less, count using business days
          let tempDate = new Date(startDate)
          let businessDaysCount = 0
          
          while (businessDaysCount < contingency.days) {
            tempDate.setDate(tempDate.getDate() + 1)
            tempDate.setUTCHours(12, 0, 0, 0)
            if (isBusinessDay(tempDate) && !isHoliday(tempDate)) {
              businessDaysCount++
            }
          }
          endDate = tempDate
        } else {
          // For longer timelines, use calendar days
          endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() + contingency.days)
          endDate.setUTCHours(12, 0, 0, 0)
        }
      } else if (contingency.type === 'days_before_closing' && contingency.days) {
        // Start from the day before closing
        endDate = new Date(formatDate(closingDate))
        endDate.setDate(endDate.getDate() - 1)
        endDate.setUTCHours(12, 0, 0, 0)

        if (contingency.days <= 5 || contingency.useBusinessDays) {
          // For timelines of 5 days or less, count backwards using business days
          let tempDate = new Date(endDate)
          let businessDaysCount = 0
          
          while (businessDaysCount < contingency.days) {
            tempDate.setDate(tempDate.getDate() - 1)
            tempDate.setUTCHours(12, 0, 0, 0)
            if (isBusinessDay(tempDate) && !isHoliday(tempDate)) {
              businessDaysCount++
            }
          }
          startDate = tempDate
        } else {
          // For longer timelines, use calendar days
          startDate = new Date(endDate)
          startDate.setDate(startDate.getDate() - contingency.days)
          startDate.setUTCHours(12, 0, 0, 0)
        }
      } else {
        startDate = new Date()
        endDate = new Date()
      }

      items.push({
        name: contingency.name,
        date: new Date(endDate), // Keep original date as the end date for compatibility
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        daysFromMutual: Math.round((endDate.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
        method: contingency.type === 'fixed_date'
          ? 'Fixed Date'
          : contingency.type === 'days_from_mutual'
            ? `${contingency.days} ${contingency.days <= 5 || contingency.useBusinessDays ? 'business' : ''} days from mutual`
            : `${contingency.days} days before closing`,
        notes: contingency.description || '',
        isContingency: true,
        contingencyId: contingency.id,
        isPossessionDate: contingency.isPossessionDate,
        status: contingency.status,
        order: index
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
    handleTimelineReorder,
    isLoading: dates.length > 0 && timelineItems.length === 0
  }
}
