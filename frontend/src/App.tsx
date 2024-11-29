import { useState, useEffect } from 'react'
import { ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { GiPartyPopper } from 'react-icons/gi'

// Import types
import { Contingency, TimelineInstance, SavedInstance } from './types/timeline'

// Import components
import { Card, CardHeader, CardTitle, CardContent } from './components/common/Card'
import { StatusDropdown } from './components/timeline/StatusDropdown'
import { ActionButton } from './components/common/ActionButton'
import { TimelineGantt } from './components/timeline/TimelineGantt'
import { ContingencyForm } from './components/timeline/ContingencyForm'
import { MilestoneTable } from './components/timeline/MilestoneTable'

// Import hooks
import { useTimelineCalculations } from './hooks/useTimelineCalculations'
import { useTimelineInstances } from './hooks/useTimelineInstances'
import { useContingencyForm } from './hooks/useContingencyForm'
import { useTimelineData } from './hooks/useTimelineData'

// Import utilities
import { parseInputDate, formatInputDate, formatDisplayDate, DEFAULT_DISPLAY_OPTIONS, calculateDaysBetween } from './utils/dateUtils'
import { getDefaultContingencies } from './utils/timelineUtils'

function App() {
  // Primary State
  const [mutualDate, setMutualDate] = useState<Date | null>(null)
  const [closingDate, setClosingDate] = useState<Date | null>(null)
  const [contingencies, setContingencies] = useState<Contingency[]>([])
  const [timelineActive, setTimelineActive] = useState(false)
  const [showInitialSetup, setShowInitialSetup] = useState(true)
  const [editingContingency, setEditingContingency] = useState<Contingency | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Debug logging for date changes
  useEffect(() => {
    const debugInfo = {
      mutualDate: mutualDate ? formatInputDate(mutualDate) : null,
      closingDate: closingDate ? formatInputDate(closingDate) : null,
      timelineActive
    }
    console.log('App Date State:', debugInfo)
  }, [mutualDate, closingDate, timelineActive])

  // Load saved timeline if it exists
  useEffect(() => {
    const savedTimeline = localStorage.getItem('timeline')
    if (savedTimeline) {
      try {
        const { mutualDate: savedMutual, closingDate: savedClosing, contingencies: savedContingencies } = JSON.parse(savedTimeline)
        const parsedMutual = parseInputDate(savedMutual)
        const parsedClosing = parseInputDate(savedClosing)
        
        if (parsedMutual && parsedClosing) {
          console.log('Loading saved dates:', { parsedMutual, parsedClosing })
          setMutualDate(parsedMutual)
          setClosingDate(parsedClosing)
          setContingencies(savedContingencies || [])
          setTimelineActive(true)
        }
      } catch (error) {
        console.error('Error loading saved timeline:', error)
      }
    }
  }, [])

  // Save timeline state
  useEffect(() => {
    if (timelineActive && mutualDate && closingDate) {
      const timelineData = {
        mutualDate: formatInputDate(mutualDate),
        closingDate: formatInputDate(closingDate),
        contingencies
      }
      localStorage.setItem('timeline', JSON.stringify(timelineData))
    }
  }, [timelineActive, mutualDate, closingDate, contingencies])

  useEffect(() => {
    console.log('Master Mutual Date Changed:', {
      rawMutualDate: mutualDate,
      parsedDate: mutualDate?.toISOString(),
      localString: mutualDate ? formatDisplayDate(mutualDate, DEFAULT_DISPLAY_OPTIONS) : null
    })
  }, [mutualDate])

  // Custom Hooks
  const { timelineItems, handleTimelineReorder } = useTimelineData(mutualDate, closingDate, contingencies)
  const [localTimelineItems, setLocalTimelineItems] = useState<TimelineInstance[]>([])
  useEffect(() => {
    setLocalTimelineItems(timelineItems)
  }, [timelineItems])

  const handleLocalTimelineReorder = (reorderedItems: TimelineInstance[]) => {
    setLocalTimelineItems(reorderedItems)
    handleTimelineReorder(reorderedItems)
  }

  const {
    savedInstances,
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
    toggleArchiveInstance,
    setSavedInstances
  } = useTimelineInstances()

  const {
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
    handleSubmit: handleContingencySubmit
  } = useContingencyForm((newContingency) => {
    const updatedContingency = {
      ...newContingency,
      order: contingencies.length
    }
    const newContingencies = [...contingencies, updatedContingency]
    setContingencies(newContingencies)
    setShowAddModal(false)

    // Auto-save if there's a selected instance
    if (selectedInstance) {
      saveInstance(mutualDate!, closingDate!, newContingencies)
    }
  })

  // Handle creating a new timeline
  const handleNewTimeline = () => {
    setShowInitialSetup(true)
    setTimelineActive(false)
    setMutualDate(null)
    setClosingDate(null)
    setContingencies([])
    setInstanceName('')
    createNewTimeline()
  }

  // When component mounts, start with new timeline
  useEffect(() => {
    const { mutualDate: newMutual, closingDate: newClosing } = createNewTimeline()
    setMutualDate(newMutual)
    setClosingDate(newClosing)
  }, [])

  // Handle date changes
  const handleMutualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseInputDate(e.target.value)
    console.log('Setting Mutual Date:', {
      input: e.target.value,
      parsed: newDate,
      formatted: newDate ? formatInputDate(newDate) : ''
    })
    setMutualDate(newDate)
  }

  const handleClosingDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = parseInputDate(e.target.value)
    console.log('Setting Closing Date:', {
      input: e.target.value,
      parsed: newDate,
      formatted: newDate ? formatInputDate(newDate) : ''
    })
    setClosingDate(newDate)
  }

  // Handle initial setup submission
  const handleInitialSetup = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Initial Setup:', { 
      mutualDate, 
      closingDate, 
      instanceName,
      hasDefaultContingencies: !!getDefaultContingencies()
    })
    
    if (mutualDate && closingDate && instanceName.trim()) {
      const defaultContingencies = getDefaultContingencies()
      console.log('Default contingencies:', defaultContingencies)
      
      // Save the timeline first
      saveInstance(
        new Date(mutualDate),  // Ensure we're passing Date objects
        new Date(closingDate),
        defaultContingencies
      )
      
      // Then update the UI
      setTimelineActive(true)
      setShowInitialSetup(false)
      setContingencies(defaultContingencies)
      
      console.log('Timeline activated and saved')
    } else {
      console.warn('Missing required fields:', { 
        hasMutualDate: !!mutualDate, 
        hasClosingDate: !!closingDate, 
        hasInstanceName: !!instanceName.trim() 
      })
    }
  }

  // Handle loading an instance
  const handleLoadInstance = (instance: SavedInstance) => {
    console.log('Loading instance:', instance)
    
    // Update all the state
    setMutualDate(instance.mutualDate)
    setClosingDate(instance.closingDate)
    setContingencies(instance.contingencies)
    setTimelineActive(true)
    setShowInitialSetup(false)
    
    // Load the instance in the timeline instances hook
    loadInstance(instance)
  }

  // Handle saving an instance
  const handleSaveInstance = () => {
    if (mutualDate && closingDate) {
      saveInstance(mutualDate, closingDate, contingencies)
    }
  }

  // Handle adding a contingency
  const handleAddContingency = (newContingency: Contingency) => {
    const updatedContingency = {
      ...newContingency,
      order: contingencies.length
    }
    const newContingencies = [...contingencies, updatedContingency]
    setContingencies(newContingencies)

    if (selectedInstance && mutualDate && closingDate) {
      saveInstance(mutualDate, closingDate, newContingencies)
    }
  }

  const handleUpdateContingency = (updatedContingency: Contingency) => {
    const newContingencies = contingencies.map(c =>
      c.id === updatedContingency.id ? {
        ...updatedContingency,
        order: c.order // Preserve the original order
      } : c
    )
    setContingencies(newContingencies)

    if (selectedInstance && mutualDate && closingDate) {
      saveInstance(mutualDate, closingDate, newContingencies)
    }
  }

  const handleDeleteContingency = (id: string) => {
    const newContingencies = contingencies.filter(c => c.id !== id)
    setContingencies(newContingencies)

    if (selectedInstance && mutualDate && closingDate) {
      saveInstance(mutualDate, closingDate, newContingencies)
    }
  }

  const handleContingencyReorder = (reorderedContingencies: Contingency[]) => {
    setContingencies(reorderedContingencies)
    if (selectedInstance && mutualDate && closingDate) {
      saveInstance(mutualDate, closingDate, reorderedContingencies)
    }
  }

  const handleEditContingency = (contingency: Contingency) => {
    console.log('Opening modal with dates:', {
      mutualDate: mutualDate?.toISOString(),
      parsedMutualDate: mutualDate?.toISOString(),
      localMutualDate: mutualDate ? formatDisplayDate(mutualDate, DEFAULT_DISPLAY_OPTIONS) : null
    })
    setEditingContingency(contingency)
    setShowAddModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Always visible */}
      <div className="fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Saved Timelines</h2>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </button>
            </div>

            {/* Timeline List */}
            <div className="space-y-2">
              {savedInstances.map(instance => (
                <div
                  key={instance.id}
                  onClick={() => handleLoadInstance(instance)}
                  className={`
                    p-3 rounded-lg cursor-pointer
                    ${selectedInstance === instance.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                    ${instance.isArchived ? 'opacity-60' : ''}
                  `}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{instance.name}</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleArchiveInstance(instance.id)
                        }}
                        className="p-1 rounded hover:bg-gray-200"
                        title={instance.isArchived ? 'Unarchive' : 'Archive'}
                      >
                        {instance.isArchived ? '📤' : '📥'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteInstance(instance.id)
                        }}
                        className="p-1 rounded hover:bg-gray-200 text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Always offset by sidebar width */}
      <div className="flex-1 ml-80">
        <div className="container mx-auto max-w-7xl p-6 space-y-6">
          {showInitialSetup && (
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleInitialSetup} className="space-y-6">
                    {/* Timeline Name */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Timeline Name
                      </label>
                      <input
                        type="text"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder="Enter timeline name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Date Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mutual Acceptance Date
                        </label>
                        <input
                          type="date"
                          value={mutualDate ? formatInputDate(mutualDate) : ''}
                          onChange={handleMutualDateChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Closing Date
                        </label>
                        <input
                          type="date"
                          value={closingDate ? formatInputDate(closingDate) : ''}
                          onChange={handleClosingDateChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <ActionButton
                        type="submit"
                        disabled={!mutualDate || !closingDate || !instanceName.trim()}
                        className="w-full"
                      >
                        Continue
                      </ActionButton>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {!showInitialSetup && timelineActive && (
            <div className="timeline-content">
              {/* Timeline Settings Section */}
              <div className="bg-white shadow rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold mb-4">Timeline Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mutual Date
                    </label>
                    <div className="flex items-center">
                      <input
                        type="date"
                        value={mutualDate ? formatInputDate(mutualDate) : ''}
                        onChange={handleMutualDateChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Closing Date
                    </label>
                    <div className="flex items-center">
                      <input
                        type="date"
                        value={closingDate ? formatInputDate(closingDate) : ''}
                        onChange={handleClosingDateChange}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <div className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                      {mutualDate && closingDate 
                        ? `${calculateDaysBetween(mutualDate, closingDate)} days`
                        : '-'}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeline Name
                    </label>
                    <input
                      type="text"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline View */}
              <TimelineGantt
                timelineItems={localTimelineItems}
                mutualDate={formatInputDate(mutualDate)}
                closingDate={formatInputDate(closingDate)}
                contingencies={contingencies}
                onContingencyReorder={handleContingencyReorder}
                onTimelineItemsReorder={handleLocalTimelineReorder}
                onContingencyClick={(contingency) => {
                  setEditingContingency(contingency)
                }}
              />

              {/* Milestone Table */}
              <div className="mt-8">
                <MilestoneTable
                  timelineItems={localTimelineItems}
                  contingencies={contingencies}
                  onEditContingency={handleEditContingency}
                  onDeleteContingency={handleDeleteContingency}
                  onUpdateContingency={handleUpdateContingency}
                  onAddContingency={() => {
                    setEditingContingency(null)
                    setShowAddModal(true)
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Contingency Modal */}
      {(showAddModal || editingContingency) && (
        <ContingencyForm
          mutualDate={mutualDate!}
          closingDate={closingDate!}
          initialValues={editingContingency || undefined}
          onSubmit={(contingency) => {
            if (editingContingency) {
              handleUpdateContingency({
                ...contingency,
                id: editingContingency.id,
                status: editingContingency.status
              })
            } else {
              handleAddContingency(contingency)
            }
            setShowAddModal(false)
            setEditingContingency(null)
          }}
          onCancel={() => {
            setShowAddModal(false)
            setEditingContingency(null)
          }}
        />
      )}
    </div>
  )
}

export default App
