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
import { formatDisplayDate, parseInputDate, calculateTargetDate, getDatesBetween, formatInputDate } from '../../utils/dateUtils'
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

  // Calculate date ranges for contingencies
  const contingencyDates = useMemo(() => {
    return contingencies.map(contingency => {
      // For fixed date contingencies, use the fixedDate directly
      if (contingency.type === 'fixed_date' && contingency.fixedDate) {
        const fixedDate = parseInputDate(contingency.fixedDate);
        if (fixedDate) {
          const startDate = new Date(fixedDate);
          startDate.setUTCHours(12, 0, 0, 0);
          return {
            contingencyId: contingency.id,
            startDate,
            endDate: startDate,
            targetDate: startDate,
            days: 0
          };
        }
        return null;
      }

      // For days-based contingencies
      if (!contingency.days) {
        return null;
      }

      const daysNum = parseInt(contingency.days.toString());
      
      // For days_from_mutual, start from the day after mutual
      let baseDate;
      if (contingency.type === 'days_from_mutual') {
        baseDate = parseInputDate(mutualDate);
        if (baseDate) {
          baseDate = new Date(baseDate);
          baseDate.setDate(baseDate.getDate() + 1);
          baseDate.setUTCHours(12, 0, 0, 0);
        }
      } else {
        baseDate = parseInputDate(closingDate);
      }
      
      if (!baseDate || isNaN(daysNum)) return null;

      const targetDate = calculateTargetDate(
        baseDate,
        daysNum,
        contingency.type === 'days_before_closing' ? 'backward' : 'forward'
      );

      console.log('Gantt Chart Date Calculation:', {
        contingencyId: contingency.id,
        name: contingency.name,
        baseDate: baseDate.toISOString(),
        days: daysNum,
        direction: contingency.type === 'days_before_closing' ? 'backward' : 'forward',
        targetDate: targetDate.toISOString(),
        useBusinessDays: daysNum <= 5
      });

      return {
        contingencyId: contingency.id,
        startDate: baseDate,
        endDate: targetDate, // Always use target date as the end date
        targetDate,
        days: daysNum
      };
    }).filter(Boolean);
  }, [contingencies, mutualDate, closingDate]);

  // Calculate all dates for the timeline
  const allDates = useMemo(() => {
    const parsedMutual = parseInputDate(mutualDate);
    const parsedClosing = parseInputDate(closingDate);
    if (!parsedMutual || !parsedClosing) return [];

    // Include all contingency target dates to ensure they're visible
    const targetDates = contingencyDates
      .map(cd => cd?.targetDate)
      .filter(Boolean) as Date[];

    // Get all dates between mutual and closing
    const dateRange = getDatesBetween(parsedMutual, parsedClosing, true);
    
    // Create a Set of all dates to remove duplicates and convert to array
    const uniqueDates = [...new Set([
      ...dateRange,
      ...targetDates
    ].map(date => formatInputDate(date)))]
      .map(dateStr => parseInputDate(dateStr))
      .filter(Boolean) as Date[];

    // Sort the dates
    return uniqueDates.sort((a, b) => a.getTime() - b.getTime());
  }, [mutualDate, closingDate, contingencyDates]);

  // Get the visible dates for a contingency based on its duration
  const getVisibleDatesForContingency = useCallback((startDate: Date, endDate: Date, days: number) => {
    return allDates.filter(date => {
      const time = date.getTime();
      return time >= startDate.getTime() && time <= endDate.getTime();
    });
  }, [allDates]);

  // Render a timeline bar for a contingency
  const renderTimelineBar = useCallback((item: TimelineItem, contingencyDate: ContingencyDate | null) => {
    if (!contingencyDate) return null;

    const { startDate, targetDate } = contingencyDate;
    
    // Find the indices for positioning
    const startIndex = allDates.findIndex(d => compareDate(d, startDate));
    const endIndex = allDates.findIndex(d => compareDate(d, targetDate));

    console.log('Rendering Timeline Bar:', {
      itemName: item.name,
      startDate,
      targetDate,
      startIndex,
      endIndex
    });

    if (startIndex === -1 || endIndex === -1) return null;

    // Calculate positions to center align with columns
    const columnWidth = 32;
    const left = startIndex * columnWidth + columnWidth / 2; // Center of start column
    const right = endIndex * columnWidth + columnWidth / 2; // Center of end column
    const width = right - left;

    const style = {
      left: `${left}px`,
      width: `${width}px`,
      height: '2px',
      position: 'absolute' as const,
      backgroundColor: getStatusColor(item.status),
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      top: '50%',
      transform: 'translateY(-50%)',
    };

    return (
      <div
        key={item.id}
        className="timeline-bar relative"
        style={style}
        onClick={() => onContingencyClick(item)}
      >
        {/* Start dot */}
        <div 
          className="absolute left-0 w-3 h-3 rounded-full"
          style={{
            backgroundColor: getStatusColor(item.status),
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
        {/* End dot */}
        <div 
          className="absolute right-0 w-3 h-3 rounded-full"
          style={{
            backgroundColor: getStatusColor(item.status),
            top: '50%',
            transform: 'translate(50%, -50%)',
          }}
        />
        <div 
          className="absolute whitespace-nowrap text-xs font-medium"
          style={{
            top: '-20px',
            right: '0',
            transform: 'translateX(50%)',
          }}
        >
          {item.name}
        </div>
      </div>
    );
  }, [allDates, onContingencyClick]);

  // Calculate the width and position for a contingency bar
  const getContingencyStyle = useCallback((startDate: Date, endDate: Date, targetDate: Date, days: number) => {
    const startIndex = allDates.findIndex(d => compareDate(d, startDate));
    const endIndex = allDates.findIndex(d => compareDate(d, targetDate));
    
    // Add 1 to include both start and end dates in the width
    const width = Math.max((endIndex - startIndex + 1), 1) * 32;
    
    console.log('Gantt Chart Bar Style:', {
      startDate: formatInputDate(startDate),
      endDate: formatInputDate(endDate),
      targetDate: formatInputDate(targetDate),
      startIndex,
      endIndex,
      width,
      allDates: allDates.map(d => formatInputDate(d)),
      visibleDates: allDates.slice(startIndex, endIndex + 1).map(d => formatInputDate(d))
    });
    
    return {
      left: `${startIndex * 32}px`,
      width: `${width}px`
    };
  }, [allDates]);

  // Calculate the width for each contingency bar
  const getContingencyWidth = useCallback((startDate: Date, endDate: Date, days: number) => {
    const useBusinessDays = days <= 5;
    const dates = getVisibleDatesForContingency(startDate, endDate, days);
    return `${dates.length * 30}px`; // 30px per day
  }, []);

  // Auto-scroll to today's date
  const scrollToToday = useCallback(() => {
    const container = document.querySelector('.overflow-x-auto')
    if (container) {
      const todayIndex = allDates.findIndex(date => compareDate(date, today))
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
  }, [allDates, today])

  // Scroll to today's date only on mount
  useEffect(() => {
    scrollToToday()
  }, [])

  // Helper function to get status color
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'not_started':
        return '#9CA3AF'; // gray-400
      case 'in_progress':
      case 'scheduled':
        return '#3B82F6'; // blue-500
      case 'completed':
        return '#22C55E'; // green-500
      case 'waived':
        return '#A855F7'; // purple-500
      case 'pending':
      case 'due_today':
        return '#EAB308'; // yellow-500
      case 'overdue':
        return '#EF4444'; // red-500
      default:
        return '#6B7280'; // gray-500
    }
  }, []);

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
                const todayIndex = allDates.findIndex(date => 
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
                {allDates.map((date, index) => {
                  const month = date.toLocaleString('default', { month: 'short' })
                  const isFirstDayOfMonth = date.getUTCDate() === 1
                  const isFirstDate = index === 0
                  
                  // Calculate the number of days until the next month or end of timeline
                  let daysInCurrentMonth = 0
                  let currentIndex = index
                  const currentMonth = date.getUTCMonth()
                  const currentYear = date.getUTCFullYear()
                  
                  while (currentIndex < allDates.length) {
                    const currentDate = allDates[currentIndex]
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
                {allDates.map((date, index) => {
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
                  {allDates.map((_, index) => (
                    <div 
                      key={index}
                      className="w-8 flex-shrink-0 border-r border-gray-100"
                    />
                  ))}
                </div>

                {/* Today's Line */}
                {allDates.map((date, index) => {
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
                          renderTimelineBar(item, contingencyDates.find(cd => cd.contingencyId === item.contingencyId))
                        )}
                        {/* Date Markers */}
                        {allDates.map((date, colIndex) => {
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
