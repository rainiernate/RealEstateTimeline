import { useState, useEffect } from 'react'
import { ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { GiPartyPopper } from 'react-icons/gi'

// Import types
import { Contingency, TimelineItem } from './types/timeline'

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

// Import constants
import { getDefaultContingencies } from './constants/defaultContingencies'

function App() {
  // Primary State
  const [mutualDate, setMutualDate] = useState<string | null>(null)
  const [closingDate, setClosingDate] = useState<string | null>(null)
  const [contingencies, setContingencies] = useState<Contingency[]>([])
  const [timelineActive, setTimelineActive] = useState(false)
  const [showInitialSetup, setShowInitialSetup] = useState(false)

  // UI State
  const [showSidebar, setShowSidebar] = useState(true)
  const [editingContingency, setEditingContingency] = useState<Contingency | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Custom Hooks
  const { timelineItems, handleTimelineReorder } = useTimelineData(mutualDate, closingDate, contingencies)
  const [localTimelineItems, setLocalTimelineItems] = useState<TimelineItem[]>([])
  useEffect(() => {
    setLocalTimelineItems(timelineItems)
  }, [timelineItems])

  const handleLocalTimelineReorder = (reorderedItems: TimelineItem[]) => {
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

  // Handle initial date setup
  const handleInitialSetup = () => {
    if (mutualDate && closingDate && instanceName) {
      // Add default contingencies
      const defaultContingencies = getDefaultContingencies(mutualDate, closingDate)
      setContingencies(defaultContingencies)
      
      // Activate timeline
      setTimelineActive(true)
      setShowInitialSetup(false)
      
      // Save the new instance immediately
      saveInstance(mutualDate, closingDate, defaultContingencies)
    }
  }

  // Handle loading an instance
  const handleLoadInstance = (instance: any) => {
    setTimelineActive(true)
    setMutualDate(instance.mutualDate)
    setClosingDate(instance.closingDate)
    setContingencies(instance.contingencies)
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
    setEditingContingency(contingency)
    setShowAddModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ${showSidebar ? 'w-80' : 'w-0'} overflow-hidden`}>
        <div className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Saved Timelines</h2>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>

            {/* Instance List */}
            <div className="space-y-2">
              {savedInstances.map((instance) => (
                <div
                  key={instance.id}
                  onClick={() => handleLoadInstance(instance)}
                  className={`
                    p-3 rounded-lg cursor-pointer flex justify-between items-center
                    ${selectedInstance === instance.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}
                  `}
                >
                  <div className="flex-1">
                    <div className="font-medium">{instance.name}</div>
                    <div className="text-sm text-gray-500">
                      Created: {new Date(instance.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col ml-80">
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed left-4 top-4 p-2 rounded-md shadow-md bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div className="container mx-auto max-w-7xl p-6 space-y-6 overflow-y-auto">
          {!timelineActive && !showInitialSetup && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold text-gray-900">Welcome to Timeline Manager</h1>
                <p className="text-gray-600">Create a new timeline or load an existing one to get started.</p>
                <div className="flex justify-center gap-4">
                  <ActionButton onClick={handleNewTimeline}>Create New Timeline</ActionButton>
                  <ActionButton onClick={() => setShowArchived(!showArchived)}>
                    {showArchived ? 'Hide Archived' : 'Show Archived'}
                  </ActionButton>
                </div>
              </div>
            </div>
          )}

          {showInitialSetup && (
            <div className="max-w-md mx-auto mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timeline Name</label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={instanceName}
                        onChange={(e) => setInstanceName(e.target.value)}
                        placeholder="Enter timeline name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Mutual Acceptance Date</label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={mutualDate || ''}
                        onChange={(e) => setMutualDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Closing Date</label>
                      <input
                        type="date"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        value={closingDate || ''}
                        onChange={(e) => setClosingDate(e.target.value)}
                      />
                    </div>
                    <div className="pt-4">
                      <ActionButton
                        onClick={handleInitialSetup}
                        disabled={!mutualDate || !closingDate || !instanceName}
                        className="w-full"
                      >
                        Continue
                      </ActionButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {timelineActive && (
            // Active timeline view
            <>
              {/* Timeline Settings */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Timeline Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6">
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
                      />
                    </div>

                    {/* Dates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Mutual Acceptance Date
                        </label>
                        <input
                          type="date"
                          value={mutualDate || ''}
                          onChange={(e) => setMutualDate(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-sm text-gray-500">
                          {mutualDate && new Date(mutualDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Closing Date
                        </label>
                        <input
                          type="date"
                          value={closingDate || ''}
                          onChange={(e) => setClosingDate(e.target.value)}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="text-sm text-gray-500">
                          {closingDate && new Date(closingDate).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Timeline Duration
                        </label>
                        <div className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                          {mutualDate && closingDate && (
                            <span className="font-medium">
                              {Math.round((new Date(closingDate).getTime() - new Date(mutualDate).getTime()) / (1000 * 60 * 60 * 24))} days
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Content */}
              {mutualDate && closingDate && (
                <>
                  {/* Timeline Gantt */}
                  <div className="flex-1 min-w-0">
                    <TimelineGantt
                      timelineItems={localTimelineItems}
                      mutualDate={mutualDate || ''}
                      closingDate={closingDate || ''}
                      contingencies={contingencies}
                      onContingencyReorder={handleContingencyReorder}
                      onTimelineItemsReorder={handleLocalTimelineReorder}
                      onContingencyClick={handleEditContingency}
                    />
                  </div>

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
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Contingency Modal */}
      {(showAddModal || editingContingency) && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingContingency ? 'Edit Contingency' : 'Add Contingency'}
            </h2>
            <ContingencyForm
              mutualDate={mutualDate!}
              closingDate={closingDate!}
              initialValues={editingContingency || undefined}
              onSubmit={(contingency) => {
                if (editingContingency) {
                  handleUpdateContingency({
                    ...contingency,
                    id: editingContingency.id,
                    status: editingContingency.status // Preserve the status
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
          </div>
        </div>
      )}
    </div>
  )
}

export default App
