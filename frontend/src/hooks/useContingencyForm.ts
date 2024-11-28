import { useState } from 'react'
import { Contingency, ContingencyType } from '../types/timeline'

export function useContingencyForm(onSave: (contingency: Contingency) => void) {
  const [contingencyName, setContingencyName] = useState('')
  const [contingencyType, setContingencyType] = useState<ContingencyType>('days_from_mutual')
  const [contingencyDays, setContingencyDays] = useState(5)
  const [contingencyDate, setContingencyDate] = useState('')
  const [contingencyDescription, setContingencyDescription] = useState('')
  const [isPossessionDate, setIsPossessionDate] = useState(false)

  const handleSubmit = () => {
    if (!contingencyName) return

    const newContingency: Contingency = {
      id: crypto.randomUUID(),
      name: contingencyName,
      type: contingencyType,
      description: contingencyDescription,
      isPossessionDate,
      status: 'not_started',
      order: 0 // This will be set by the parent component
    }

    if (contingencyType === 'fixed_date') {
      newContingency.fixedDate = contingencyDate
    } else {
      newContingency.days = contingencyDays
    }

    onSave(newContingency)

    // Reset form
    setContingencyName('')
    setContingencyDescription('')
    setIsPossessionDate(false)
  }

  return {
    contingencyName,
    contingencyType,
    contingencyDays,
    contingencyDate,
    contingencyDescription,
    isPossessionDate,
    setContingencyName,
    setContingencyType,
    setContingencyDays,
    setContingencyDate,
    setContingencyDescription,
    setIsPossessionDate,
    handleSubmit
  }
}
