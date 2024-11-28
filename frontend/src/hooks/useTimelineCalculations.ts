import { useMemo } from 'react'
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

const addBusinessDays = (startDate: Date, days: number, countBackwards: boolean = false): Date => {
  let currentDate = new Date(startDate)
  let businessDaysCount = 0
  
  // Start counting from the next day
  currentDate.setDate(currentDate.getDate())
  
  while (businessDaysCount < Math.abs(days)) {
    // Move to next/previous day based on direction
    currentDate.setDate(currentDate.getDate() + (countBackwards ? -1 : 1))
    // Ensure we're working with midnight of each day
    currentDate.setHours(0, 0, 0, 0)
    
    if (isBusinessDay(currentDate)) {
      businessDaysCount++
    }
  }
  
  return currentDate
}

export function useTimelineCalculations(
  contingencies: Contingency[],
  mutualDate: string | null,
  closingDate: string | null
) {
  return useMemo(() => {
    if (!mutualDate || !closingDate) return []

    const dates = getDatesBetween(parseDate(mutualDate), parseDate(closingDate))
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
    contingencies.forEach(contingency => {
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
        const closingDateObj = formatDate(closingDate)
        console.log('Closing Date Timeline:', {
          contingencyName: contingency.name,
          type: contingency.type,
          days: contingency.days,
          closingDate: closingDateObj
        })

        if (contingency.days <= 5) {
          // For timelines of 5 days or less, count business days backwards from closing
          date = addBusinessDays(closingDateObj, contingency.days, true)
        } else {
          // For longer timelines, use calendar days
          date = new Date(closingDateObj.getTime() - contingency.days * 24 * 60 * 60 * 1000)
        }

        console.log('Calculated Date:', {
          calculatedDate: date,
          daysFromMutual: Math.round((date.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24))
        })

        items.push({
          name: contingency.name,
          date: new Date(date),
          daysFromMutual: Math.round((date.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
          startDate: date,
          endDate: closingDateObj,
          method: `${contingency.days} ${contingency.days <= 5 ? 'business' : ''} days before closing`,
          notes: contingency.description || '',
          isContingency: true,
          contingencyId: contingency.id,
          isPossessionDate: contingency.isPossessionDate,
          status: contingency.status,
          order: contingency.order
        })

        console.log('Created Timeline Item:', {
          name: contingency.name,
          startDate: date,
          endDate: closingDateObj,
          daysFromMutual: Math.round((date.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24))
        })
        
        return // Skip the general item push below
      } else {
        date = new Date()
      }

      items.push({
        name: contingency.name,
        date: new Date(date),
        daysFromMutual: Math.round((date.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
        startDate: contingency.type === 'days_before_closing' ? date : formatDate(mutualDate),
        endDate: contingency.type === 'days_before_closing' ? formatDate(closingDate) : new Date(date),
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
      status: 'pending',
      order: 999
    })

    // Sort items by date and order
    return items.sort((a, b) => {
      if (a.date.getTime() === b.date.getTime()) {
        return a.order - b.order
      }
      return a.date.getTime() - b.date.getTime()
    })
  }, [contingencies, mutualDate, closingDate])
}
