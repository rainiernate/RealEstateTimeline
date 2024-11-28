import { useState, useCallback } from 'react'
import { Contingency, ContingencyStatus } from '../types/timeline'
import { getDefaultContingencies } from '../constants/defaultContingencies'

export function useContingencies(mutualDate: string, closingDate: string) {
  const [contingencies, setContingencies] = useState<Contingency[]>([])

  // Load default contingencies
  const loadDefaults = useCallback(() => {
    setContingencies(getDefaultContingencies(mutualDate, closingDate))
  }, [mutualDate, closingDate])

  // Add new contingency
  const addContingency = useCallback((contingency: Contingency) => {
    setContingencies(prev => [...prev, {
      ...contingency,
      order: prev.length
    }])
  }, [])

  // Update existing contingency
  const updateContingency = useCallback((updatedContingency: Contingency) => {
    setContingencies(prev => 
      prev.map(c => c.id === updatedContingency.id ? updatedContingency : c)
    )
  }, [])

  // Delete contingency
  const deleteContingency = useCallback((contingencyId: string) => {
    setContingencies(prev => 
      prev.filter(c => c.id !== contingencyId)
        .map((c, index) => ({ ...c, order: index }))
    )
  }, [])

  // Update contingency status
  const updateStatus = useCallback((contingencyId: string, status: ContingencyStatus) => {
    setContingencies(prev =>
      prev.map(c => c.id === contingencyId ? { ...c, status } : c)
    )
  }, [])

  // Reorder contingencies
  const reorderContingencies = useCallback((oldIndex: number, newIndex: number) => {
    setContingencies(prev => {
      const result = Array.from(prev)
      const [removed] = result.splice(oldIndex, 1)
      result.splice(newIndex, 0, removed)
      return result.map((item, index) => ({ ...item, order: index }))
    })
  }, [])

  return {
    contingencies,
    loadDefaults,
    addContingency,
    updateContingency,
    deleteContingency,
    updateStatus,
    reorderContingencies,
    setContingencies
  }
}
