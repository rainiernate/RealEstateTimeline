import { useState, useEffect } from 'react'
import { Contingency, SavedInstance } from '../types/timeline'
import { getDefaultContingencies } from '../constants/defaultContingencies'
import { isBusinessDay, getNextBusinessDay } from '../utils/businessDays'
import { isHoliday } from '../utils/holidayRules'

export function useTimelineInstances() {
  const [savedInstances, setSavedInstances] = useState<SavedInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Load saved instances from localStorage
  useEffect(() => {
    const savedData = localStorage.getItem('savedInstances')
    const legacyData = localStorage.getItem('timelineInstances')
    
    let dataToUse = null
    
    if (savedData && savedData !== '[]') {
      dataToUse = savedData
    } else if (legacyData && legacyData !== '[]') {
      dataToUse = legacyData
    }

    if (dataToUse) {
      try {
        const parsedData = JSON.parse(dataToUse)
        const migratedData = parsedData.map((instance: SavedInstance) => ({
          ...instance,
          isArchived: instance.isArchived ?? false
        }))
        setSavedInstances(migratedData)
      } catch (error) {
        console.error('Error parsing saved data:', error)
      }
    }
  }, [])

  // Save instances to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('savedInstances', JSON.stringify(savedInstances))
  }, [savedInstances])

  const filteredInstances = savedInstances.filter(instance => 
    showArchived ? instance.isArchived : !instance.isArchived
  )

  const createNewTimeline = () => {
    setSelectedInstance(null)
    setIsCreatingNew(true)
    const defaultName = `Timeline ${savedInstances.length + 1}`
    setInstanceName(defaultName)
    
    const newMutualDate = new Date().toISOString().split('T')[0]
    let newClosingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    // Check if closing date falls on a weekend or holiday
    while (!isBusinessDay(newClosingDate)) {
      newClosingDate = getNextBusinessDay(newClosingDate)
    }

    // Show alert if date was adjusted
    const originalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    if (originalDate.getTime() !== newClosingDate.getTime()) {
      const holidayName = isHoliday(originalDate) ? 'Holiday' : null
      const reason = holidayName ? `${holidayName}` : 'weekend'
      alert(`Closing date adjusted to next business day because original date fell on ${reason}`)
    }

    const formattedClosingDate = newClosingDate.toISOString().split('T')[0]
    const defaultContingencies = getDefaultContingencies(newMutualDate, formattedClosingDate).map((c, index) => ({
      ...c,
      order: index
    }))

    return {
      mutualDate: newMutualDate,
      closingDate: formattedClosingDate,
      contingencies: defaultContingencies
    }
  }

  const loadInstance = (instance: SavedInstance) => {
    setIsCreatingNew(false)
    setSelectedInstance(instance.id)
    setInstanceName(instance.name)
    return {
      mutualDate: instance.mutualDate,
      closingDate: instance.closingDate,
      contingencies: instance.contingencies
    }
  }

  const saveInstance = (mutualDate: string, closingDate: string, contingencies: Contingency[]) => {
    if (!instanceName.trim()) return

    if (isCreatingNew) {
      const newInstance: SavedInstance = {
        id: crypto.randomUUID(),
        name: instanceName,
        mutualDate,
        closingDate,
        contingencies,
        createdAt: new Date().toISOString(),
        isArchived: false
      }
      setSavedInstances(prev => [...prev, newInstance])
      setSelectedInstance(newInstance.id)
      setIsCreatingNew(false)
    } else if (selectedInstance) {
      setSavedInstances(prev =>
        prev.map(instance =>
          instance.id === selectedInstance
            ? {
                ...instance,
                name: instanceName,
                mutualDate,
                closingDate,
                contingencies,
                lastModified: new Date().toISOString()
              }
            : instance
        )
      )
    }
  }

  const deleteInstance = (id: string) => {
    setSavedInstances(prev => prev.filter(instance => instance.id !== id))
    if (selectedInstance === id) {
      setSelectedInstance(null)
    }
  }

  const toggleArchiveInstance = (id: string) => {
    setSavedInstances(instances => 
      instances.map(instance => 
        instance.id === id 
          ? { ...instance, isArchived: !instance.isArchived }
          : instance
      )
    )
  }

  return {
    savedInstances: filteredInstances,
    selectedInstance,
    instanceName,
    showArchived,
    isCreatingNew,
    setInstanceName,
    setShowArchived,
    createNewTimeline,
    loadInstance,
    saveInstance,
    deleteInstance,
    toggleArchiveInstance
  }
}
