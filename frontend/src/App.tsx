import { useState } from 'react'
import { ChevronRight, Edit2, Trash2 } from 'lucide-react'
import { GiPartyPopper } from 'react-icons/gi'

// Import types
import { Contingency } from './types/timeline'

// Import components
import { Card, CardHeader, CardTitle, CardContent } from './components/common/Card'
import { StatusDropdown } from './components/timeline/StatusDropdown'
import { ActionButton } from './components/common/ActionButton'
import { TimelineGantt } from './components/timeline/TimelineGantt'
import { TimelineTable } from './components/timeline/TimelineTable'
import { ContingencyForm } from './components/timeline/ContingencyForm'

// Import hooks
import { useTimelineCalculations } from './hooks/useTimelineCalculations'
import { useTimelineInstances } from './hooks/useTimelineInstances'
import { useContingencyForm } from './hooks/useContingencyForm'

function App() {
  // Primary State
  const [mutualDate, setMutualDate] = useState<string | null>(null)
  const [closingDate, setClosingDate] = useState<string | null>(null)
  const [contingencies, setContingencies] = useState<Contingency[]>([])
  const [timelineActive, setTimelineActive] = useState(false)

  // UI State
  const [showSidebar, setShowSidebar] = useState(true)
  const [editingContingency, setEditingContingency] = useState<Contingency | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // Custom Hooks
  const timelineItems = useTimelineCalculations(contingencies, mutualDate, closingDate)
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
    toggleArchiveInstance
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
    setTimelineActive(true)
    const newTimeline = createNewTimeline()
    setMutualDate(newTimeline.mutualDate)
    setClosingDate(newTimeline.closingDate)
    setContingencies(newTimeline.contingencies)
  }

  // Handle loading an instance
  const handleLoadInstance = (instance: any) => {
    setTimelineActive(true)
    setMutualDate(instance.mutualDate)
    setClosingDate(instance.closingDate)
    setContingencies(instance.contingencies)
    loadInstance(instance.id)
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
      c.id === updatedContingency.id ? updatedContingency : c
    )
    setContingencies(newContingencies)
    setEditingContingency(null)

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
          {!timelineActive ? (
            // Initial blank state
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
              <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-gray-900">Real Estate Timeline</h1>
                <p className="text-xl text-gray-600">Create a new timeline or select an existing one to get started</p>
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleNewTimeline}
                  className="px-6 py-3 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Create New Timeline
                </button>
                <button
                  onClick={() => setShowSidebar(true)}
                  className="px-6 py-3 text-lg bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  View Saved Timelines
                </button>
              </div>
            </div>
          ) : (
            // Active timeline view
            <>
              {/* Timeline Settings */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Timeline Settings</CardTitle>
                    {selectedInstance && (
                      <div className="text-sm text-gray-500">
                        Currently editing: {savedInstances.find(i => i.id === selectedInstance)?.name}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline Content */}
              {mutualDate && closingDate && (
                <>
                  {/* Timeline Gantt */}
                  <TimelineGantt
                    timelineItems={timelineItems}
                    mutualDate={mutualDate}
                    closingDate={closingDate}
                    onContingencyClick={(contingency) => {
                      setEditingContingency(contingency)
                      setShowAddModal(true)
                    }}
                  />

                  {/* Timeline Table */}
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle>Timeline Items</CardTitle>
                        <ActionButton
                          onClick={() => {
                            setEditingContingency(null)
                            setShowAddModal(true)
                          }}
                          variant="primary"
                        >
                          Add Contingency
                        </ActionButton>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <TimelineTable
                        timelineItems={timelineItems}
                        onEditContingency={(contingency) => {
                          setEditingContingency(contingency)
                          setShowAddModal(true)
                        }}
                        onDeleteContingency={handleDeleteContingency}
                        onUpdateContingency={handleUpdateContingency}
                      />
                    </CardContent>
                  </Card>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add/Edit Contingency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-semibold mb-4">Add Contingency</h2>
            <ContingencyForm
              onSave={handleContingencySubmit}
              onCancel={() => setShowAddModal(false)}
              mutualDate={mutualDate!}
              closingDate={closingDate!}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
