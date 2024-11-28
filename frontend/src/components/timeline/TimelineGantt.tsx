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
import { SortableItem } from './SortableItem'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card'
import { ActionButton } from '../common/ActionButton'

interface TimelineGanttProps {
  timelineItems: TimelineItem[]
  mutualDate: string
  closingDate: string
  contingencies: Contingency[]
  onContingencyReorder: (reorderedContingencies: Contingency[]) => void
  onContingencyClick: (contingency: Contingency) => void
}

export function TimelineGantt({ 
  timelineItems = [], 
  mutualDate = '', 
  closingDate = '',
  contingencies = [],
  onContingencyReorder,
  onContingencyClick 
}: TimelineGanttProps) {
  const today = useMemo(() => new Date(), [])
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = contingencies.findIndex(item => item.id === active.id)
      const newIndex = contingencies.findIndex(item => item.id === over.id)
      const newItems = arrayMove(contingencies, oldIndex, newIndex)
      onContingencyReorder(newItems)
    }
  }

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
            <div className="grid grid-cols-[200px_1fr] min-w-full">
              {/* Left Column - Event Names */}
              <div className="border-r pr-4 bg-white sticky left-0 z-10">
                <div className="h-8 flex items-center">
                  <span className="text-sm font-semibold">Event</span>
                </div>
                {/* Mutual Date */}
                <div className="h-8 flex items-center">
                  <span className="text-sm font-bold text-black">Mutual Acceptance</span>
                </div>
                {/* Contingency Titles */}
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={contingencies.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {contingencies.map((contingency) => (
                      <SortableItem key={contingency.id} contingency={contingency} />
                    ))}
                  </SortableContext>
                </DndContext>
                {/* Closing Date */}
                <div className="h-8 flex items-center">
                  <span className="text-sm font-bold text-black">Closing Date</span>
                </div>
              </div>

              {/* Right Column - Timeline Grid */}
              <div className="relative">
                {/* Date Headers */}
                <div className="flex h-8">
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
                <div className="relative">
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
                  {timelineItems.map((item, rowIndex) => (
                    <div key={rowIndex} className="h-8 flex items-center relative">
                      {dates.map((date, colIndex) => {
                        const isItemDate = item.date.toDateString() === date.toDateString()
                        const statusColor = getStatusColor(item.status)
                        
                        return (
                          <div 
                            key={colIndex}
                            className="w-8 flex-shrink-0 relative h-full flex items-center justify-center"
                          >
                            {isItemDate && item.isContingency && (
                              <button
                                onClick={() => onContingencyClick(item as Contingency)}
                                className={`
                                  w-6 h-6 rounded-full ${statusColor}
                                  flex items-center justify-center
                                  transition-colors duration-200
                                `}
                              >
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </button>
                            )}
                            {isItemDate && !item.isContingency && (
                              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-black" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-sm mt-4">
              <div className="flex items-center gap-1">
                <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[10px] border-transparent border-b-black" />
                <span>Key Dates</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-100 rounded-full" />
                <span>Completed</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-100 rounded-full" />
                <span>Scheduled</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-100 rounded-full" />
                <span>Due Today</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-100 rounded-full" />
                <span>Overdue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-50 rounded-full" />
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
      return 'bg-gray-50 text-gray-500'
    case 'in_progress':
      return 'bg-blue-50 text-blue-700'
    case 'completed':
      return 'bg-green-100 text-green-700'
    case 'waived':
      return 'bg-purple-100 text-purple-700'
    case 'pending':
      return 'bg-yellow-50 text-yellow-700'
    case 'scheduled':
      return 'bg-blue-100 text-blue-700'
    case 'overdue':
      return 'bg-red-100 text-red-700'
    case 'due_today':
      return 'bg-yellow-100 text-yellow-700'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
