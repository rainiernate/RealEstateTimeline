import { ContingencyStatus } from '../../types/timeline'

interface StatusDropdownProps {
  status: ContingencyStatus
  onChange: (status: ContingencyStatus) => void
  className?: string
}

const statusColors: Record<ContingencyStatus, string> = {
  not_started: 'bg-gray-50 text-gray-500',
  in_progress: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  waived: 'bg-purple-100 text-purple-700',
  pending: 'bg-yellow-50 text-yellow-700',
  scheduled: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  due_today: 'bg-yellow-100 text-yellow-700'
}

const statusLabels: Record<ContingencyStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  waived: 'Waived',
  pending: 'Pending',
  scheduled: 'Scheduled',
  overdue: 'Overdue',
  due_today: 'Due Today'
}

export function StatusDropdown({ status, onChange, className = '' }: StatusDropdownProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as ContingencyStatus)}
      className={`
        rounded-md px-3 py-1.5 text-sm font-medium
        ${statusColors[status]}
        border-none outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500
        ${className}
      `}
    >
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}
