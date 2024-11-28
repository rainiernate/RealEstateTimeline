export type ContingencyType = 'days_from_mutual' | 'days_before_closing' | 'fixed_date'
export type ContingencyStatus = 
  | 'not_started'
  | 'in_progress'
  | 'waived'
  | 'pending'
  | 'scheduled'
  | 'completed'
  | 'overdue'
  | 'due_today'

export interface Contingency {
  id: string
  name: string
  type: ContingencyType
  days: number
  fixedDate?: string
  description?: string
  isPossessionDate: boolean
  status: ContingencyStatus
  completedDate?: string
  order: number
}

export interface TimelineItem {
  name: string
  date: Date
  startDate: Date
  endDate: Date
  daysFromMutual: number
  method: string
  notes: string
  isContingency: boolean
  contingencyId?: string
  isPossessionDate?: boolean
  status: ContingencyStatus
  order: number
}

export interface SavedInstance {
  id: string
  name: string
  mutualDate: string
  closingDate: string
  contingencies: Contingency[]
  createdAt: string
  lastModified?: string
  isArchived?: boolean
}
