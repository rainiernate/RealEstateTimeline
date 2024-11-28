import { TimelineItem, Contingency } from '../../types/timeline'
import { StatusDropdown } from './StatusDropdown'
import { ActionButton } from '../common/ActionButton'
import { Edit2, Trash2 } from 'lucide-react'

interface TimelineTableProps {
  timelineItems: TimelineItem[]
  onEditContingency: (contingency: Contingency) => void
  onDeleteContingency: (id: string) => void
  onUpdateContingency: (contingency: Contingency) => void
}

export function TimelineTable({
  timelineItems,
  onEditContingency,
  onDeleteContingency,
  onUpdateContingency
}: TimelineTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 text-left">
            <th className="p-3 font-medium">Item</th>
            <th className="p-3 font-medium">Date</th>
            <th className="p-3 font-medium">Method</th>
            <th className="p-3 font-medium">Status</th>
            <th className="p-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {timelineItems.map((item, index) => (
            <tr
              key={index}
              className={`
                border-b hover:bg-gray-50/50 transition-colors duration-200
                ${!item.isContingency ? 'font-medium' : ''}
              `}
            >
              <td className="p-3 whitespace-nowrap overflow-hidden text-ellipsis">
                <div className="flex items-center space-x-2">
                  {item.isPossessionDate && (
                    <span className="text-blue-500">🏠</span>
                  )}
                  <span>{item.name}</span>
                </div>
              </td>
              <td className="p-3 whitespace-nowrap">
                {item.date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </td>
              <td className="p-3">
                <div className="flex flex-col">
                  <span>{item.method}</span>
                  {item.notes && (
                    <span className="text-sm text-gray-500 mt-1">
                      {item.notes}
                    </span>
                  )}
                </div>
              </td>
              <td className="p-3 whitespace-nowrap">
                {item.isContingency && (
                  <StatusDropdown
                    status={item.status}
                    onChange={(newStatus) => onUpdateContingency({ ...item, status: newStatus } as Contingency)}
                  />
                )}
              </td>
              <td className="p-3 whitespace-nowrap">
                {item.isContingency && (
                  <div className="flex items-center space-x-2">
                    <ActionButton
                      onClick={() => onEditContingency(item as Contingency)}
                      variant="secondary"
                    >
                      <Edit2 className="h-4 w-4" />
                    </ActionButton>
                    <ActionButton
                      onClick={() => onDeleteContingency(item.contingencyId!)}
                      variant="danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ActionButton>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
