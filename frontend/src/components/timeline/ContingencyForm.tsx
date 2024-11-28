import { useState, useEffect, useMemo } from 'react'
import { Contingency, ContingencyType } from '../../types/timeline'
import { ActionButton } from '../common/ActionButton'
import { addBusinessDays } from '../../utils/businessDays'
import { isHoliday, getHolidayName } from '../../utils/holidayRules'
import { Check, X } from 'lucide-react'

interface ContingencyFormProps {
  initialValues?: Contingency
  onSubmit: (contingency: Contingency) => void
  onCancel: () => void
  mutualDate: string
  closingDate: string
}

export function ContingencyForm({ 
  initialValues, 
  onSubmit, 
  onCancel,
  mutualDate,
  closingDate
}: ContingencyFormProps) {
  const [name, setName] = useState(initialValues?.name || '')
  const [type, setType] = useState<ContingencyType>(initialValues?.type || 'days_from_mutual')
  const [days, setDays] = useState<string>(initialValues?.days?.toString() || '')
  const [fixedDate, setFixedDate] = useState(initialValues?.fixedDate || '')
  const [description, setDescription] = useState(initialValues?.description || '')

  useEffect(() => {
    if (initialValues?.days !== undefined) {
      setName(initialValues.name)
      setType(initialValues.type)
      setDays(initialValues.days.toString())
      setDescription(initialValues.description || '')
    }
  }, [initialValues])

  // Calculate the target date based on current inputs
  const targetDate = useMemo(() => {
    if (!days && type !== 'fixed_date' || !mutualDate || !closingDate) return null

    if (type === 'fixed_date') {
      return new Date(fixedDate)
    }

    const daysNum = parseInt(days)
    if (isNaN(daysNum)) return null

    let date: Date
    if (type === 'days_from_mutual') {
      const startDate = new Date(mutualDate)
      if (daysNum <= 5) {
        // For 5 or fewer days, use business days
        date = addBusinessDays(startDate, daysNum)
      } else {
        // For more than 5 days, use calendar days
        date = new Date(startDate)
        date.setDate(startDate.getDate() + daysNum)
      }
    } else if (type === 'days_before_closing') {
      const endDate = new Date(closingDate)
      date = new Date(endDate)
      date.setDate(endDate.getDate() - daysNum)
    } else {
      return null
    }

    // Ensure we're working with midnight
    date.setHours(0, 0, 0, 0)
    return date
  }, [type, days, mutualDate, closingDate, fixedDate])

  // Calculate duration between mutual and closing
  const duration = useMemo(() => {
    if (!mutualDate || !closingDate) return null
    const start = new Date(mutualDate)
    const end = new Date(closingDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [mutualDate, closingDate])

  // Format the target date with additional info
  const formattedTargetDate = useMemo(() => {
    if (!targetDate) return null

    const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6
    const holidayName = isHoliday(targetDate) ? getHolidayName(targetDate) : null
    const isBusinessDay = !isWeekend && !holidayName

    return {
      date: targetDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      }),
      isBusinessDay,
      isWeekend,
      holidayName
    }
  }, [targetDate])

  // Get calculation type text
  const calculationType = useMemo(() => {
    if (type === 'fixed_date') return 'Fixed'
    if (!days) return ''
    
    const daysNum = parseInt(days)
    if (isNaN(daysNum)) return ''

    if (type === 'days_from_mutual') {
      return daysNum <= 5 ? 'Business' : 'Calendar'
    } else if (type === 'days_before_closing') {
      return daysNum <= 5 ? 'Business' : 'Calendar'
    }
    return ''
  }, [type, days])

  // Calculate day-by-day breakdown
  const dayBreakdown = useMemo(() => {
    if (!targetDate || !days || !mutualDate || !closingDate || type === 'fixed_date') return null

    const daysNum = parseInt(days)
    if (isNaN(daysNum)) return null

    const dates: Array<{
      date: Date,
      isBusinessDay: boolean,
      isWeekend: boolean,
      holidayName: string | null,
      dayCount: number
    }> = []

    if (type === 'days_from_mutual') {
      let currentDate = new Date(mutualDate)
      let businessDaysCount = 0
      let totalDaysCount = 0

      while (businessDaysCount < daysNum && totalDaysCount < 100) { // limit to prevent infinite loops
        currentDate.setDate(currentDate.getDate() + 1)
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
        const holidayName = isHoliday(currentDate) ? getHolidayName(currentDate) : null
        
        // For timelines > 5 days, treat all days as business days
        const isBusinessDay = daysNum > 5 ? true : (!isWeekend && !holidayName)

        totalDaysCount++
        if (isBusinessDay && daysNum <= 5) {
          businessDaysCount++
        } else if (daysNum > 5) {
          businessDaysCount++
        }

        dates.push({
          date: new Date(currentDate),
          isBusinessDay,
          // For timelines > 5 days, don't mark weekends/holidays
          isWeekend: daysNum > 5 ? false : isWeekend,
          holidayName: daysNum > 5 ? null : holidayName,
          dayCount: businessDaysCount
        })

        if (businessDaysCount === daysNum) break
      }
    } else if (type === 'days_before_closing') {
      let currentDate = new Date(closingDate)
      for (let i = 0; i < daysNum; i++) {
        currentDate.setDate(currentDate.getDate() - 1)
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6
        const holidayName = isHoliday(currentDate) ? getHolidayName(currentDate) : null
        const isBusinessDay = !isWeekend && !holidayName

        dates.unshift({
          date: new Date(currentDate),
          isBusinessDay,
          isWeekend,
          holidayName,
          dayCount: i + 1
        })
      }
    }

    return dates
  }, [type, days, mutualDate, closingDate, targetDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name,
      type,
      days: type !== 'fixed_date' ? parseInt(days) : undefined,
      fixedDate: type === 'fixed_date' ? fixedDate : undefined,
      description,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ContingencyType)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="days_from_mutual">Days from Mutual</option>
          <option value="days_before_closing">Days before Closing</option>
          <option value="fixed_date">Fixed Date</option>
        </select>
      </div>

      {type !== 'fixed_date' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Days
          </label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required={type !== 'fixed_date'}
            min="0"
          />
        </div>
      )}

      {type === 'fixed_date' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date
          </label>
          <input
            type="date"
            value={fixedDate}
            onChange={(e) => setFixedDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
            min={mutualDate}
            max={closingDate}
          />
        </div>
      )}

      {(calculationType || formattedTargetDate) && (
        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Target:</span>
          <div className="text-sm flex items-center gap-2">
            {calculationType && (
              <span className="text-blue-700">{calculationType}</span>
            )}
            {calculationType && formattedTargetDate && (
              <span className="text-gray-400">•</span>
            )}
            {formattedTargetDate && (
              <span>{formattedTargetDate.date}</span>
            )}
            {(formattedTargetDate?.holidayName || formattedTargetDate?.isWeekend) && (
              <span className={`${formattedTargetDate.holidayName ? "text-amber-700" : "text-red-700"} ml-1`}>
                ({formattedTargetDate.holidayName || 'Weekend'})
              </span>
            )}
          </div>
        </div>
      )}
      {dayBreakdown && dayBreakdown.length > 0 && (
        <div className="mt-2">
          <div className="text-sm font-medium mb-2">Day-by-Day Breakdown:</div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {dayBreakdown.map((day, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg text-sm
                  ${day.isBusinessDay ? 'bg-green-50' : 'bg-gray-50'}
                  ${day.holidayName ? 'bg-amber-50' : ''}
                  ${day.isWeekend ? 'bg-red-50' : ''}`}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-medium">Day {day.dayCount}:</span>
                  <span>
                    {day.date.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {day.holidayName ? (
                    <span className="text-amber-700">{day.holidayName}</span>
                  ) : day.isWeekend ? (
                    <span className="text-red-700">Weekend</span>
                  ) : (
                    <Check className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <ActionButton
          onClick={onCancel}
          variant="secondary"
          type="button"
        >
          Cancel
        </ActionButton>
        <ActionButton
          variant="primary"
          type="submit"
        >
          {initialValues ? 'Update' : 'Create'} Contingency
        </ActionButton>
      </div>
    </form>
  )
}
