import { Edit2, Trash2 } from 'lucide-react'
import { Contingency, TimelineItem } from '../../types/timeline'
import { StatusDropdown } from './StatusDropdown'
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card'
import { ActionButton } from '../common/ActionButton'

interface MilestoneTableProps {
  timelineItems: TimelineItem[]
  contingencies: Contingency[]
  onEditContingency: (contingency: Contingency) => void
  onDeleteContingency: (contingencyId: string) => void
  onUpdateContingency: (contingency: Contingency) => void
  onAddContingency: () => void
}

export function MilestoneTable({
  timelineItems,
  contingencies,
  onEditContingency,
  onDeleteContingency,
  onUpdateContingency,
  onAddContingency
}: MilestoneTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Milestones</CardTitle>
          <ActionButton
            onClick={onAddContingency}
            variant="primary"
          >
            Add Contingency
          </ActionButton>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineItems
            .filter(item => item.isContingency)
            .map((item) => {
              const contingency = contingencies.find(c => c.id === item.contingencyId)
              if (!contingency) return null

              return (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-4 bg-white rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {contingency.type === 'fixed_date' ? (
                        // Fixed date format
                        item.startDate?.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        // Range format with duration
                        <>
                          {item.startDate?.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          {' - '}
                          {item.endDate?.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                          <span className="text-gray-400 ml-2">
                            ({contingency.days} {contingency.days && contingency.days <= 5 ? 'bus.' : 'cal.'} days)
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {contingency.description && (
                    <div className="flex-1 px-4">
                      <p className="text-sm text-gray-600 italic">
                        {contingency.description}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <StatusDropdown
                      status={contingency.status}
                      onChange={(newStatus) => {
                        onUpdateContingency({
                          ...contingency,
                          status: newStatus
                        })
                      }}
                    />
                    <button
                      onClick={() => onEditContingency(contingency)}
                      className="p-2 text-gray-400 hover:text-gray-500"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteContingency(contingency.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
        </div>
      </CardContent>
    </Card>
  )
}
