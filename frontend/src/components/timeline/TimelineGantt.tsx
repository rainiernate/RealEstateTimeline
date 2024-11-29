import { useMemo, useCallback, useEffect } from 'react'
import { TimelineItem, Contingency } from '../../types/timeline'
import { isHoliday } from '../../utils/holidayRules'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { ActionButton } from '../common/ActionButton'
import { SortableItem } from './SortableItem'
import { formatDisplayDate, parseInputDate } from '../../utils/dateUtils'
import { REFERENCE_HOUR } from '../../utils/dateUtils';

interface TimelineGanttProps {
  timelineItems: TimelineItem[]
  mutualDate: string
  closingDate: string
  contingencies: Contingency[]
  onContingencyReorder: (reorderedContingencies: Contingency[]) => void
  onTimelineItemsReorder: (reorderedItems: TimelineItem[]) => void
  onContingencyClick: (contingency: Contingency) => void
}

export function TimelineGantt({ 
  timelineItems = [], 
  mutualDate = '', 
  closingDate = '',
  contingencies = [],
  onContingencyReorder,
  onTimelineItemsReorder,
  onContingencyClick 
}: TimelineGanttProps) {

  // Debug logging for incoming dates
  console.log('TimelineGantt Dates:', {
    mutualDateProp: mutualDate,
    closingDateProp: closingDate,
    mutualDateObj: new Date(mutualDate),
    closingDateObj: new Date(closingDate)
  })

  // Get today's date using the same parsing logic as other dates
  const today = useMemo(() => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    console.log('Today string:', todayStr)
    const parsedToday = parseInputDate(todayStr)
    console.log('Parsed today:', parsedToday)
    return parsedToday
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (!active || !over || active.id === over.id) return

    const oldIndex = parseInt(active.id.split('-')[1])
    const newIndex = parseInt(over.id.split('-')[1])
    
    // Filter out Mutual Acceptance and Closing
    const draggableItems = timelineItems.filter(
      item => item.name !== 'Mutual Acceptance' && item.name !== 'Closing'
    )
    
    // Reorder the draggable items
    const reorderedDraggable = arrayMove(draggableItems, oldIndex, newIndex)
    
    // Reconstruct the full timeline items array with updated order
    const newTimelineItems = [
      timelineItems[0], // Mutual Acceptance
      ...reorderedDraggable.map((item, index) => ({
        ...item,
        order: index + 1 // Start after Mutual Acceptance
      })),
      timelineItems[timelineItems.length - 1] // Closing
    ]
    
    onTimelineItemsReorder(newTimelineItems)
  }

  // Calculate date ranges
  const dates = useMemo(() => {
    const dateArray = []
    
    // Create dates at noon UTC to avoid timezone issues
    const createDate = (dateStr: string) => {
      const date = new Date(dateStr)
      // Set to noon UTC
      date.setUTCHours(12, 0, 0, 0)
      return date
    }
    
    const start = createDate(mutualDate)
    const end = createDate(closingDate)
    
    // Generate dates array including both start and end dates
    const current = new Date(start)
    while (current <= end) {
      dateArray.push(new Date(current))
      current.setDate(current.getDate() + 1)
      current.setUTCHours(12, 0, 0, 0)
    }
    
    // Log the actual dates for debugging
    console.log('Timeline Dates:', {
      mutualDate: start.toLocaleDateString(),
      closingDate: end.toLocaleDateString(),
      firstDate: dateArray[0].toLocaleDateString(),
      lastDate: dateArray[dateArray.length - 1].toLocaleDateString(),
      totalDays: dateArray.length,
      allDates: dateArray.map(d => d.toLocaleDateString())
    })
    
    return dateArray
  }, [mutualDate, closingDate])

  // Auto-scroll to today's date
  const scrollToToday = useCallback(() => {
    const container = document.querySelector('.overflow-x-auto')
    if (container) {
      const todayIndex = dates.findIndex(date => compareDate(date, today))
      if (todayIndex !== -1) {
        // Calculate scroll position to center today's date
        const columnWidth = 32 // Width of each date column
        const containerWidth = container.clientWidth
        const scrollOffset = Math.max(0, (todayIndex * columnWidth) - (containerWidth / 2) + (columnWidth / 2))
        
        container.scrollTo({
          left: scrollOffset,
          behavior: 'smooth'
        })
      }
    }
  }, [dates, today])

  // Scroll to today's date only on mount
  useEffect(() => {
    scrollToToday()
  }, [])

  // Date comparison helper
  const compareDate = (d1: Date, d2: Date | string) => {
    const createDate = (d: Date | string) => {
      const date = new Date(d)
      date.setUTCHours(12, 0, 0, 0)
      return date
    }
    
    const date1 = createDate(d1)
    const date2 = createDate(d2)
    return date1.toLocaleDateString() === date2.toLocaleDateString()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            {mutualDate ? formatDisplayDate(new Date(mutualDate)) : 'No start date'} - {closingDate ? formatDisplayDate(new Date(closingDate)) : 'No end date'}
          </CardDescription>
          <ActionButton
            variant="secondary"
            onClick={() => {
              const container = document.querySelector('.overflow-x-auto')
              if (container) {
                const todayIndex = dates.findIndex(date => 
                  compareDate(date, today)
                )
                if (todayIndex !== -1) {
                  const scrollOffset = Math.max(0, (todayIndex * 32) - 200)
                  container.scrollLeft = scrollOffset
                }
              }
            }}
          >
            Jump to Today
          </ActionButton>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mt-4 relative">
          {/* Main Grid Container */}
          <div className="grid grid-cols-[256px_1fr]">
            {/* Left Column - Names */}
            <div className="bg-white sticky left-0 z-50">
              {/* Header Space for Month Row */}
              <div className="h-8 bg-white border-b" />
              {/* Header Space for Days Row */}
              <div className="h-8 bg-white border-b" />
              
              {/* Timeline Item Names */}
              <div className="flex flex-col border-r">
                {timelineItems.map((item, index) => (
                  <div 
                    key={index} 
                    className="h-8 flex items-center px-4 text-sm"
                    title={item.name} // Show full name on hover
                  >
                    <span className="truncate w-full">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Timeline Grid */}
            <div className="overflow-x-auto">
              {/* Month Headers */}
              <div className="flex h-8 sticky top-0 bg-white z-40 border-b">
                {dates.map((date, index) => {
                  const month = date.toLocaleString('default', { month: 'short' })
                  const isFirstDayOfMonth = date.getUTCDate() === 1
                  const isFirstDate = index === 0
                  
                  // Calculate the number of days until the next month or end of timeline
                  let daysInCurrentMonth = 0
                  let currentIndex = index
                  const currentMonth = date.getUTCMonth()
                  const currentYear = date.getUTCFullYear()
                  
                  while (currentIndex < dates.length) {
                    const currentDate = dates[currentIndex]
                    if (currentDate.getUTCMonth() !== currentMonth || 
                        currentDate.getUTCFullYear() !== currentYear) {
                      break
                    }
                    daysInCurrentMonth++
                    currentIndex++
                  }

                  // Only show month name on first day of month or first date
                  if (isFirstDayOfMonth || isFirstDate) {
                    return (
                      <div
                        key={`month-${index}`}
                        className="flex items-center justify-center text-sm font-medium border-r border-gray-200"
                        style={{
                          width: `${daysInCurrentMonth * 32}px`,
                          position: 'absolute',
                          left: `${index * 32}px`,
                          height: '100%'
                        }}
                      >
                        {month}
                      </div>
                    )
                  }
                  return null
                })}
              </div>

              {/* Date Headers */}
              <div className="flex h-8 sticky top-8 bg-white z-40 border-b">
                {dates.map((date, index) => {
                  const isWeekend = date.getUTCDay() === 0 || date.getUTCDay() === 6
                  const isMutualDate = compareDate(date, mutualDate)
                  const isClosingDate = compareDate(date, closingDate)
                  const isHolidayDate = isHoliday(date)
                  
                  return (
                    <div 
                      key={index}
                      className={`
                        w-8 flex-shrink-0 text-center text-sm flex items-center justify-center
                        ${isWeekend ? 'font-bold' : ''}
                        ${isMutualDate || isClosingDate ? 'font-bold text-black' : ''}
                        ${isHolidayDate ? 'text-red-500' : ''}
                      `}
                      title={isHolidayDate ? 'Holiday' : undefined}
                    >
                      {isHolidayDate ? (
                        <span className="font-bold">H</span>
                      ) : (
                        date.getUTCDate()
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Timeline Grid */}
              <div className="relative z-30">
                {/* Vertical Grid Lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {dates.map((_, index) => (
                    <div 
                      key={index}
                      className="w-8 flex-shrink-0 border-r border-gray-100"
                    />
                  ))}
                </div>

                {/* Today's Line */}
                {dates.map((date, index) => {
                  if (compareDate(date, today)) {
                    return (
                      <div 
                        key={`today-${index}`}
                        className="absolute top-0 bottom-0 w-[2px] bg-red-500 transform -translate-x-1/2"
                        style={{ left: `${index * 32 + 16}px` }}
                      />
                    )
                  }
                  return null
                })}

                {/* Timeline Items */}
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={contingencies.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {timelineItems.map((item, rowIndex) => (
                      <div key={rowIndex} className={`
                        h-8 flex items-center relative
                        ${item.isContingency ? 'cursor-move hover:bg-gray-50/50' : ''}
                      `}>
                        {/* Timeline Bar */}
                        {item.isContingency && item.startDate && item.endDate && (
                          <>
                            {console.log('Rendering Timeline Bar:', {
                              itemName: item.name,
                              startDate: item.startDate,
                              endDate: item.endDate,
                              startIndex: dates.findIndex(d => compareDate(d, item.startDate)),
                              endIndex: dates.findIndex(d => compareDate(d, item.endDate))
                            })}
                            {/* Horizontal connecting line */}
                            <div 
                              className={`absolute h-[1.5px] z-0 transition-all duration-200`}
                              style={{
                                left: `${dates.findIndex(d => compareDate(d, item.startDate)) * 32 + 16}px`,
                                width: `${(dates.findIndex(d => compareDate(d, item.endDate)) - 
                                         dates.findIndex(d => compareDate(d, item.startDate))) * 32}px`,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                backgroundColor: item.status === 'not_started' ? '#9CA3AF' : // gray-400
                                              item.status === 'in_progress' ? '#3B82F6' : // blue-500
                                              item.status === 'completed' ? '#22C55E' : // green-500
                                              item.status === 'waived' ? '#A855F7' : // purple-500
                                              item.status === 'pending' ? '#EAB308' : // yellow-500
                                              item.status === 'scheduled' ? '#3B82F6' : // blue-500
                                              item.status === 'overdue' ? '#EF4444' : // red-500
                                              item.status === 'due_today' ? '#EAB308' : // yellow-500
                                              '#6B7280' // gray-500
                              }}
                            />
                          </>
                        )}
                        {/* Date Markers */}
                        {dates.map((date, colIndex) => {
                          const isStartDate = item.isContingency && item.startDate && compareDate(date, item.startDate)
                          const isEndDate = item.endDate && compareDate(date, item.endDate)
                          const isSameDay = item.startDate && item.endDate && compareDate(item.startDate, item.endDate)
                          const isMutualDate = compareDate(date, mutualDate)
                          const isClosingDate = compareDate(date, closingDate)

                          // Debug logging
                          if ((item.name === 'Mutual Acceptance' && isMutualDate) || 
                              (item.name === 'Closing' && isClosingDate)) {
                            console.log(`${item.name} Date Check:`, {
                              columnDate: date.toLocaleDateString(),
                              expectedDate: new Date(item.name === 'Mutual Acceptance' ? mutualDate : closingDate).toLocaleDateString(),
                              matches: isMutualDate || isClosingDate
                            })
                          }

                          const statusColor = getStatusColor(item.status)
                          
                          return (
                            <div 
                              key={colIndex}
                              className="w-8 flex-shrink-0 relative h-full flex items-center justify-center"
                            >
                              {/* Mutual/Closing marker */}
                              {((isMutualDate && item.name === 'Mutual Acceptance') || 
                                (isClosingDate && item.name === 'Closing')) && (
                                <div 
                                  className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-black z-10 mb-1"
                                  title={item.name}
                                />
                              )}
                              {/* Start date marker */}
                              {isStartDate && !isSameDay && (
                                <div
                                  className={`absolute w-3 h-3 rounded-full z-10`}
                                  style={{
                                    backgroundColor: statusColor,
                                    border: '2px solid white'
                                  }}
                                  title={`${item.name} (Start)`}
                                />
                              )}
                              {/* End date marker */}
                              {isEndDate && item.isContingency && (
                                <button
                                  onClick={() => {
                                    const contingency = contingencies.find(c => c.id === item.contingencyId)
                                    if (contingency) {
                                      onContingencyClick(contingency)
                                    }
                                  }}
                                  className={`w-3 h-3 rounded-full z-10`}
                                  style={{
                                    backgroundColor: statusColor,
                                    border: '2px solid white'
                                  }}
                                  title={`${item.name} (End)`}
                                />
                              )}
                              {/* Mutual/Closing marker */}
                              {isEndDate && !item.isContingency && (
                                <div 
                                  className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-black z-10"
                                  title={item.name}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-sm mt-4 pb-6">
            <div className="flex items-center gap-1">
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[10px] border-transparent border-t-black" />
              <span>Key Dates</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-500 bg-white rounded-full" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-blue-500 bg-white rounded-full" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-yellow-500 bg-white rounded-full" />
              <span>Due Today</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-red-500 bg-white rounded-full" />
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-gray-400 bg-white rounded-full" />
              <span>Not Started</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'not_started':
      return '#9CA3AF' // gray-400
    case 'in_progress':
      return '#3B82F6' // blue-500
    case 'completed':
      return '#22C55E' // green-500
    case 'waived':
      return '#A855F7' // purple-500
    case 'pending':
      return '#EAB308' // yellow-500
    case 'scheduled':
      return '#3B82F6' // blue-500
    case 'overdue':
      return '#EF4444' // red-500
    case 'due_today':
      return '#EAB308' // yellow-500
    default:
      return '#6B7280' // gray-500
  }
}
