import { useState, useEffect, useMemo } from 'react'
import { Contingency, ContingencyType } from '../../types/timeline'
import { ActionButton } from '../common/ActionButton'
import { addBusinessDays } from '../../utils/businessDays'

interface ContingencyFormProps {
  contingency?: Contingency
  onSave: (contingency: Contingency) => void
  onCancel: () => void
  isEditing?: boolean
  mutualDate?: string
  closingDate?: string
}

export function ContingencyForm({ 
  contingency, 
  onSave, 
  onCancel,
  isEditing = false,
  mutualDate,
  closingDate
}: ContingencyFormProps) {
  const [name, setName] = useState(contingency?.name || '')
  const [type, setType] = useState<ContingencyType>(contingency?.type || 'days_from_mutual')
  const [days, setDays] = useState(contingency?.days?.toString() || '')
  const [description, setDescription] = useState(contingency?.description || '')

  useEffect(() => {
    if (contingency) {
      setName(contingency.name)
      setType(contingency.type)
      setDays(contingency.days?.toString() || '')
      setDescription(contingency.description || '')
    }
  }, [contingency])

  // Calculate the target date based on current inputs
  const targetDate = useMemo(() => {
    if (!days || !mutualDate || !closingDate) return null

    const daysNum = parseInt(days)
    if (isNaN(daysNum)) return null

    let date = new Date()
    if (type === 'days_from_mutual') {
      const startDate = new Date(mutualDate)
      if (daysNum <= 5) {
        date = addBusinessDays(startDate, daysNum)
      } else {
        date = new Date(startDate.getTime() + daysNum * 24 * 60 * 60 * 1000)
      }
    } else if (type === 'days_before_closing') {
      const endDate = new Date(closingDate)
      date = new Date(endDate.getTime() - daysNum * 24 * 60 * 60 * 1000)
    }

    return date
  }, [type, days, mutualDate, closingDate])

  // Calculate duration between mutual and closing
  const duration = useMemo(() => {
    if (!mutualDate || !closingDate) return null
    const start = new Date(mutualDate)
    const end = new Date(closingDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }, [mutualDate, closingDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newContingency: Contingency = {
      id: contingency?.id || crypto.randomUUID(),
      name,
      type,
      days: parseInt(days),
      description,
      isPossessionDate: false,
      status: contingency?.status || 'not_started',
      order: contingency?.order || 0
    }

    onSave(newContingency)
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
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Days {duration && <span className="text-gray-500 text-xs">({duration} days total)</span>}
        </label>
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
          min="0"
        />
        {targetDate && (
          <p className="mt-1 text-sm text-gray-500">
            Target Date: {targetDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        )}
      </div>

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
          {isEditing ? 'Update' : 'Create'} Contingency
        </ActionButton>
      </div>
    </form>
  )
}
