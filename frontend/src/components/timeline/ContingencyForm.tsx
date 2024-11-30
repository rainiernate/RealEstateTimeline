import { useState, useEffect, useMemo } from 'react'
import { Contingency, ContingencyType } from '../../types/timeline'
import { ActionButton } from '../common/ActionButton'
import { DraggableModal } from '../common/DraggableModal'
import { TimelineEngine } from '../../engine/TimelineEngine'
import {
  parseInputDate,
  formatInputDate,
  formatDisplayDate,
  getDatesBetween,
  isBusinessDay,
  isHoliday,
  getHolidayName,
  isWeekend,
  SHORT_DISPLAY_OPTIONS,
  DEFAULT_DISPLAY_OPTIONS
} from '../../utils/dateUtils'

interface ContingencyFormProps {
  initialValues?: Contingency
  onSubmit: (contingency: Contingency) => void
  onCancel: () => void
  mutualDate: Date
  closingDate: Date
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
  const [days, setDays] = useState(initialValues?.days?.toString() || '')
  const [fixedDate, setFixedDate] = useState(initialValues?.fixed_date || '')
  const [startDate, setStartDate] = useState(initialValues?.start_date || '')
  const [endDate, setEndDate] = useState(initialValues?.end_date || '')
  const [description, setDescription] = useState(initialValues?.description || '')
  const [showDebug, setShowDebug] = useState(false);

  // Calculate the target date based on current inputs
  const targetDate = useMemo(() => {
    if (!days && type !== 'fixed_date' && type !== 'fixed_period') return null;

    const contingency: Contingency = {
      id: 'preview',
      name: name || 'Preview',
      type,
      days: parseInt(days) || 0,
      description: description,
      status: 'pending',
      order: 0
    };

    if (type === 'fixed_date') {
      contingency.fixed_date = formatInputDate(fixedDate);
    }

    if (type === 'fixed_period') {
      contingency.start_date = formatInputDate(startDate);
      contingency.end_date = formatInputDate(endDate);
    }

    const dates = TimelineEngine.calculateContingencyDates(
      contingency,
      mutualDate.toISOString(),
      closingDate.toISOString()
    );

    return dates?.targetDate || null;
  }, [type, days, mutualDate, closingDate, fixedDate, startDate, endDate, name, description]);

  // Debug information for target date calculation
  const contingency = useMemo(() => {
    if (!days && type !== 'fixed_date' && type !== 'fixed_period') return null;

    return {
      id: 'preview',
      name: name || 'Preview',
      type,
      days: parseInt(days) || 0,
      description: description,
      status: 'pending',
      order: 0
    };
  }, [type, days, mutualDate, closingDate, fixedDate, startDate, endDate, name, description]);

  const debugInfo = useMemo(() => {
    if (!contingency || !mutualDate || !closingDate) return null

    const dates = TimelineEngine.calculateContingencyDates(
      contingency,
      formatInputDate(mutualDate),
      formatInputDate(closingDate)
    )
    if (!dates) return null

    // Parse all dates to ensure they are Date objects
    const startDate = dates.startDate ? TimelineEngine.parseDate(dates.startDate) : null
    const endDate = dates.endDate ? TimelineEngine.parseDate(dates.endDate) : null

    return {
      contingency,
      startDate,
      endDate,
      useBusinessDays: contingency.days <= 5,
      daysToCount: contingency.days,
      type: contingency.type,
      fixedDate: contingency.fixed_date ? TimelineEngine.parseDate(contingency.fixed_date) : null
    }
  }, [contingency, mutualDate, closingDate])

  // Calculate day-by-day breakdown
  const debugDayBreakdown = useMemo(() => {
    if (!debugInfo?.startDate || !debugInfo?.endDate) return []
    
    // Get the date range based on the contingency type
    const start = debugInfo.startDate
    const end = debugInfo.endDate
    
    if (!start || !end) return []

    const days = []
    let currentDate = new Date(start)
    
    while (currentDate <= end) {
      days.push({
        date: new Date(currentDate),
        isBusinessDay: isBusinessDay(currentDate),
        isHoliday: isHoliday(currentDate),
        holidayName: getHolidayName(currentDate),
        isWeekend: isWeekend(currentDate)
      })
      // Use UTC date methods to avoid timezone issues
      const nextDate = new Date(currentDate)
      nextDate.setUTCDate(nextDate.getUTCDate() + 1)
      currentDate = nextDate
    }

    return days
  }, [debugInfo])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || 
        (!days && type !== 'fixed_date' && type !== 'fixed_period') || 
        (type === 'fixed_date' && !fixedDate) ||
        (type === 'fixed_period' && (!startDate || !endDate))) return;

    onSubmit({
      name,
      type,
      days: type !== 'fixed_date' && type !== 'fixed_period' ? parseInt(days) : undefined,
      fixed_date: type === 'fixed_date' ? formatInputDate(fixedDate) : undefined,
      start_date: type === 'fixed_period' ? formatInputDate(startDate) : undefined,
      end_date: type === 'fixed_period' ? formatInputDate(endDate) : undefined,
      description,
      id: initialValues?.id || Math.random().toString(),
      status: initialValues?.status || 'pending',
      order: initialValues?.order || 0,
      isPossessionDate: initialValues?.isPossessionDate || false
    });
  };

  return (
    <DraggableModal onClose={onCancel}>
      <div className="modal-handle cursor-move bg-gray-50 px-4 py-3 rounded-t-lg">
        <h2 className="text-xl font-bold">
          {initialValues ? 'Edit Contingency' : 'Add Contingency'}
        </h2>
      </div>
      <div className="p-6">
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex gap-6">
              <div>
                <span className="font-medium text-gray-700">Mutual:</span>
                <span className="ml-2">{formatDisplayDate(mutualDate, SHORT_DISPLAY_OPTIONS)}</span>
              </div>
              {targetDate && (
                <div>
                  <span className="font-medium text-gray-700">Target:</span>
                  <span className="ml-2">{formatDisplayDate(targetDate, SHORT_DISPLAY_OPTIONS)}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Closing:</span>
                <span className="ml-2">{formatDisplayDate(closingDate, SHORT_DISPLAY_OPTIONS)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDebug(!showDebug)}
              className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
            >
              {showDebug ? 'Hide Debug' : 'Debug'}
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ContingencyType)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="days_from_mutual">Days from Mutual</option>
              <option value="days_before_closing">Days before Closing</option>
              <option value="fixed_date">Fixed Date</option>
              <option value="fixed_period">Fixed Period</option>
            </select>
          </div>

          {type !== 'fixed_date' && type !== 'fixed_period' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Days</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                min="0"
              />
            </div>
          )}

          {type === 'fixed_date' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={formatInputDate(fixedDate)}
                onChange={(e) => setFixedDate(parseInputDate(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {type === 'fixed_period' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={formatInputDate(startDate)}
                  onChange={(e) => setStartDate(parseInputDate(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={formatInputDate(endDate)}
                  onChange={(e) => setEndDate(parseInputDate(e.target.value))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {showDebug && debugInfo && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm border-t border-gray-200 pt-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-gray-600">Start Date:</div>
                  <div>{formatDisplayDate(debugInfo.startDate)}</div>
                  <div className="text-gray-600">End Date:</div>
                  <div>{formatDisplayDate(debugInfo.endDate)}</div>
                  <div className="text-gray-600">Type:</div>
                  <div>{debugInfo.type}</div>
                  <div className="text-gray-600">Days to Count:</div>
                  <div>{debugInfo.daysToCount}</div>
                  <div className="text-gray-600">Use Business Days:</div>
                  <div>{debugInfo.useBusinessDays ? 'Yes' : 'No'}</div>
                  {debugInfo.fixedDate && (
                    <>
                      <div className="text-gray-600">Fixed Date:</div>
                      <div>{formatDisplayDate(debugInfo.fixedDate)}</div>
                    </>
                  )}
                </div>

                {debugDayBreakdown.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Day-by-Day Breakdown:</h4>
                    <div className="space-y-1">
                      {debugDayBreakdown.map(({ date, isBusinessDay, isHoliday, holidayName, isWeekend }) => (
                        <div key={date.toISOString()} className="text-sm">
                          <span className="font-mono">{formatDisplayDate(date)}</span>
                          {isWeekend && <span className="ml-2 text-yellow-600">Weekend</span>}
                          {isHoliday && <span className="ml-2 text-red-600">{holidayName}</span>}
                          {!isWeekend && !isHoliday && <span className="ml-2 text-green-600">Business Day</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end space-x-3">
            <ActionButton onClick={onCancel} variant="secondary">
              Cancel
            </ActionButton>
            <ActionButton type="submit" disabled={!name || 
                (!days && type !== 'fixed_date' && type !== 'fixed_period') || 
                (type === 'fixed_date' && !fixedDate) ||
                (type === 'fixed_period' && (!startDate || !endDate))}>
              {initialValues ? 'Update Contingency' : 'Add Contingency'}
            </ActionButton>
          </div>
        </form>
      </div>
    </DraggableModal>
  );
}
