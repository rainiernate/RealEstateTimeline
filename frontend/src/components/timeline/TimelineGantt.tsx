import { useMemo } from 'react'
import { GiPartyPopper } from 'react-icons/gi'
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
  const today = useMemo(() => new Date(), [])
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
  const startDate = new Date(mutualDate)
  const endDate = new Date(closingDate)
  startDate.setDate(startDate.getDate() - 1) // Add one day before mutual
  endDate.setDate(endDate.getDate() + 1) // Add one day after closing
  
  const dates = useMemo(() => {
    const dateArray = []
    const current = new Date(startDate)
    while (current <= endDate) {
      dateArray.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return dateArray
  }, [startDate, endDate])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Timeline</CardTitle>
          <CardDescription>
            From {mutualDate} to {closingDate}
          </CardDescription>
          <ActionButton
            variant="secondary"
            onClick={() => {
              const container = document.querySelector('.overflow-x-auto')
              if (container) {
                const todayIndex = dates.findIndex(date => 
                  date.toDateString() === today.toDateString()
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
          <div className="overflow-x-auto">
            {/* Grid Layout */}
            <div className="grid grid-cols-[200px_1fr] min-w-full relative">
              {/* Left Column - Event Names */}
              <div className="border-r pr-4 bg-white sticky left-0 z-50">
                <div className="h-8 flex items-center">
                  <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">Event</span>
                </div>
                {/* Mutual Date */}
                <div className="h-8 flex items-center">
                  <span className="text-sm font-bold text-black whitespace-nowrap overflow-hidden text-ellipsis">Mutual Acceptance</span>
                </div>
                {/* Contingency Titles */}
                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={timelineItems.map((_, index) => `item-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {timelineItems
                      .filter(item => item.name !== 'Mutual Acceptance' && item.name !== 'Closing')
                      .map((item, index) => (
                        <SortableItem 
                          key={`item-${index}`}
                          id={`item-${index}`}
                          name={item.name}
                        />
                    ))}
                  </SortableContext>
                </DndContext>
                {/* Closing Date */}
                <div className="h-8 flex items-center">
                  <span className="text-sm font-bold text-black whitespace-nowrap overflow-hidden text-ellipsis">Closing Date</span>
                </div>
              </div>

              {/* Right Column - Timeline Grid */}
              <div className="relative">
                {/* Date Headers */}
                <div className="flex h-8 sticky top-0 bg-white z-40">
                  {dates.map((date, index) => {
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6
                    const isMutualDate = date.toDateString() === new Date(mutualDate).toDateString()
                    const isClosingDate = date.toDateString() === new Date(closingDate).toDateString()
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
                          <GiPartyPopper className="w-4 h-4" />
                        ) : (
                          date.getDate()
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
                    if (date.toDateString() === today.toDateString()) {
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
                                startIndex: dates.findIndex(d => d.toDateString() === item.startDate.toDateString()),
                                endIndex: dates.findIndex(d => d.toDateString() === item.endDate.toDateString())
                              })}
                              {/* Horizontal connecting line */}
                              <div 
                                className={`absolute h-[1.5px] z-0 transition-all duration-200`}
                                style={{
                                  left: `${dates.findIndex(d => d.toDateString() === item.startDate.toDateString()) * 32 + 16}px`,
                                  width: `${(dates.findIndex(d => d.toDateString() === item.endDate.toDateString()) - 
                                           dates.findIndex(d => d.toDateString() === item.startDate.toDateString())) * 32}px`,
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
                            const isStartDate = item.isContingency && item.startDate?.toDateString() === date.toDateString()
                            const isEndDate = item.endDate?.toDateString() === date.toDateString()
                            const isSameDay = item.startDate && item.endDate && item.startDate.toDateString() === item.endDate.toDateString()
                            const isMutualDate = date.toDateString() === new Date(mutualDate).toDateString()
                            const isClosingDate = date.toDateString() === new Date(closingDate).toDateString()
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
                                    className={`w-3 h-3 rounded-full border-2 bg-white z-10`}
                                    style={{
                                      borderColor: item.status === 'not_started' ? '#9CA3AF' : // gray-400
                                                 item.status === 'in_progress' ? '#3B82F6' : // blue-500
                                                 item.status === 'completed' ? '#22C55E' : // green-500
                                                 item.status === 'waived' ? '#A855F7' : // purple-500
                                                 item.status === 'pending' ? '#EAB308' : // yellow-500
                                                 item.status === 'scheduled' ? '#3B82F6' : // blue-500
                                                 item.status === 'overdue' ? '#EF4444' : // red-500
                                                 item.status === 'due_today' ? '#EAB308' : // yellow-500
                                                 '#6B7280' // gray-500
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
                                    className={`w-3 h-3 rounded-full border-2 bg-white z-10`}
                                    style={{
                                      borderColor: item.status === 'not_started' ? '#9CA3AF' : // gray-400
                                                 item.status === 'in_progress' ? '#3B82F6' : // blue-500
                                                 item.status === 'completed' ? '#22C55E' : // green-500
                                                 item.status === 'waived' ? '#A855F7' : // purple-500
                                                 item.status === 'pending' ? '#EAB308' : // yellow-500
                                                 item.status === 'scheduled' ? '#3B82F6' : // blue-500
                                                 item.status === 'overdue' ? '#EF4444' : // red-500
                                                 item.status === 'due_today' ? '#EAB308' : // yellow-500
                                                 '#6B7280' // gray-500
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
            <div className="flex gap-4 text-sm mt-4">
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
        </div>
      </CardContent>
    </Card>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'not_started':
      return 'border-gray-400'
    case 'in_progress':
      return 'border-blue-500'
    case 'completed':
      return 'border-green-500'
    case 'waived':
      return 'border-purple-500'
    case 'pending':
      return 'border-yellow-500'
    case 'scheduled':
      return 'border-blue-500'
    case 'overdue':
      return 'border-red-500'
    case 'due_today':
      return 'border-yellow-500'
    default:
      return 'border-gray-500'
  }
}
