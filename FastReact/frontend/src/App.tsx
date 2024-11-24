import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Edit2, Trash2 } from 'lucide-react'

// Basic Card Components
const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-4 border-b">{children}</div>
)

const CardTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-xl font-semibold">{children}</h2>
)

const CardDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-gray-500">{children}</p>
)

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6">{children}</div>
)

// Types and Interfaces
type ContingencyType = 'fixed_date' | 'days_from_mutual' | 'days_before_closing'
type ContingencyStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'due_today'

interface Contingency {
  id: string
  name: string
  type: ContingencyType
  days?: number
  fixedDate?: string
  description?: string
  isPossessionDate: boolean
  status: ContingencyStatus
  completedDate?: string
}

interface TimelineItem {
  name: string
  date: Date
  daysFromMutual: number
  method: string
  notes: string
  isContingency: boolean
  contingencyId?: string
  isPossessionDate?: boolean
  status: ContingencyStatus
}

interface SavedInstance {
  id: string
  name: string
  mutualDate: string
  closingDate: string
  contingencies: Contingency[]
  createdAt: string
  lastModified?: string
  isArchived?: boolean
}

// Helper Functions
const getDefaultContingencies = (mutualDate: string, closingDate: string): Contingency[] => [
  {
    id: crypto.randomUUID(),
    name: "Seller Disclosure Acknowledgement",
    type: "days_from_mutual",
    days: 3,
    description: "Review and acknowledge receipt of seller disclosures",
    isPossessionDate: false,
    status: 'pending'
  },
  {
    id: crypto.randomUUID(),
    name: "Earnest Money",
    type: "days_from_mutual",
    days: 2,
    description: "Deposit earnest money with escrow",
    isPossessionDate: false,
    status: 'pending'
  },
  {
    id: crypto.randomUUID(),
    name: "Information Verification Period",
    type: "days_from_mutual",
    days: 10,
    description: "Period to verify all transaction information",
    isPossessionDate: false,
    status: 'pending'
  },
  {
    id: crypto.randomUUID(),
    name: "Funds due to escrow",
    type: "days_before_closing",
    days: 1,
    description: "All funds must be received by escrow",
    isPossessionDate: false,
    status: 'pending'
  }
]

const getHolidaysInRange = (startDate: string, endDate: string): Contingency[] => {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const holidays: Contingency[] = []

  const addHolidayIfInRange = (date: Date, name: string) => {
    if (date >= start && date <= end) {
      holidays.push({
        id: crypto.randomUUID(),
        name: `Holiday: ${name}`,
        type: 'fixed_date',
        fixedDate: date.toISOString().split('T')[0],
        description: 'Federal Holiday - Banks Closed',
        isPossessionDate: false,
        status: 'pending'
      })
    }
  }

  const year = start.getFullYear()
  const endYear = end.getFullYear()

  for (let y = year; y <= endYear; y++) {
    addHolidayIfInRange(new Date(y, 0, 1), "New Year's Day")

    let mlkDay = new Date(y, 0, 1)
    while (mlkDay.getDay() !== 1) mlkDay.setDate(mlkDay.getDate() + 1)
    mlkDay.setDate(mlkDay.getDate() + 14)
    addHolidayIfInRange(mlkDay, "Martin Luther King Jr. Day")

    let presDay = new Date(y, 1, 1)
    while (presDay.getDay() !== 1) presDay.setDate(presDay.getDate() + 1)
    presDay.setDate(presDay.getDate() + 14)
    addHolidayIfInRange(presDay, "Presidents' Day")

    let memDay = new Date(y, 4, 31)
    while (memDay.getDay() !== 1) memDay.setDate(memDay.getDate() - 1)
    addHolidayIfInRange(memDay, "Memorial Day")

    addHolidayIfInRange(new Date(y, 5, 19), "Juneteenth")
    addHolidayIfInRange(new Date(y, 6, 4), "Independence Day")

    let laborDay = new Date(y, 8, 1)
    while (laborDay.getDay() !== 1) laborDay.setDate(laborDay.getDate() + 1)
    addHolidayIfInRange(laborDay, "Labor Day")

    addHolidayIfInRange(new Date(y, 10, 11), "Veterans Day")

    let thanksDay = new Date(y, 10, 1)
    while (thanksDay.getDay() !== 4) thanksDay.setDate(thanksDay.getDate() + 1)
    thanksDay.setDate(thanksDay.getDate() + 21)
    addHolidayIfInRange(thanksDay, "Thanksgiving")

    addHolidayIfInRange(new Date(y, 11, 25), "Christmas")
  }

  return holidays
}

// Helper function to get date from string
function parseDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setHours(0, 0, 0, 0)
  return date
}

// Helper function to calculate days between dates
function daysBetween(start: Date, end: Date): number {
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)
  const diffTime = endDate.getTime() - startDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Helper function to get all dates between start and end
function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = []
  const startDate = new Date(start)
  startDate.setHours(0, 0, 0, 0)
  const endDate = new Date(end)
  endDate.setHours(0, 0, 0, 0)

  while (startDate <= endDate) {
    dates.push(new Date(startDate))
    startDate.setDate(startDate.getDate() + 1)
  }
  return dates
}

// Reusable Components
function ActionButton({
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  children
}: {
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
  className?: string
  children: React.ReactNode
}) {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors duration-200 flex items-center space-x-2'
  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:bg-gray-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// Status Dropdown Component
function StatusDropdown({
  status,
  onChange,
  className = ''
}: {
  status: ContingencyStatus
  onChange: (status: ContingencyStatus) => void
  className?: string
}) {
  const statusColors = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    overdue: 'bg-red-100 text-red-700',
    due_today: 'bg-yellow-100 text-yellow-700'
  }

  const statusLabels = {
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
    overdue: 'Overdue',
    due_today: 'Due Today'
  }

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

// Gantt Chart Component
function GanttChart({
  mutualDate,
  closingDate,
  contingencies,
}: {
  mutualDate: string
  closingDate: string
  contingencies: Contingency[]
}) {
  console.log('GanttChart render:', { mutualDate, closingDate, contingencies })

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Timeline Debug View</CardTitle>
        <CardDescription>
          Mutual: {mutualDate}<br/>
          Closing: {closingDate}<br/>
          Contingencies: {contingencies.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 border rounded">
          <h3 className="font-bold mb-2">Contingencies:</h3>
          <ul className="list-disc pl-5">
            {contingencies.map(c => (
              <li key={c.id}>{c.name} - {c.type}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

function App() {
  // Primary State
  const [mutualDate, setMutualDate] = useState(new Date().toISOString().split('T')[0])
  const [closingDate, setClosingDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )

  const [contingencies, setContingencies] = useState<Contingency[]>(() => {
    const initialMutualDate = new Date().toISOString().split('T')[0]
    const initialClosingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    return [
      ...getDefaultContingencies(initialMutualDate, initialClosingDate),
      ...getHolidaysInRange(initialMutualDate, initialClosingDate)
    ]
  })

  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])

  // UI State
  const [showSidebar, setShowSidebar] = useState(true)
  const [editingContingencyId, setEditingContingencyId] = useState<string | null>(null)
  const [editingContingency, setEditingContingency] = useState<Contingency | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  // Instance Management State
  const [savedInstances, setSavedInstances] = useState<SavedInstance[]>([])
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
  const [instanceName, setInstanceName] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  // New Contingency Form State
  const [contingencyName, setContingencyName] = useState('')
  const [contingencyType, setContingencyType] = useState<ContingencyType>('days_from_mutual')
  const [contingencyDays, setContingencyDays] = useState(5)
  const [contingencyDate, setContingencyDate] = useState(mutualDate)
  const [contingencyDescription, setContingencyDescription] = useState('')
  const [isPossessionDate, setIsPossessionDate] = useState(false)

  // Load saved instances from localStorage
  useEffect(() => {
    // Try to recover data from various possible storage keys
    const savedData = localStorage.getItem('savedInstances');
    const legacyData = localStorage.getItem('timelineInstances'); // Check old key if it exists
    
    // Debug: List all localStorage keys
    console.log('All localStorage keys:', Object.keys(localStorage));
    
    let dataToUse = null;
    
    if (savedData && savedData !== '[]') {
      console.log('Found data in savedInstances');
      dataToUse = savedData;
    } else if (legacyData && legacyData !== '[]') {
      console.log('Found data in legacy storage');
      dataToUse = legacyData;
    }

    if (dataToUse) {
      try {
        const parsedData = JSON.parse(dataToUse);
        console.log('Recovered data:', parsedData);
        const migratedData = parsedData.map((instance: SavedInstance) => ({
          ...instance,
          isArchived: instance.isArchived ?? false
        }));
        setSavedInstances(migratedData);
      } catch (error) {
        console.error('Error parsing saved data:', error);
      }
    }
  }, []);

  // Add debug button to show all localStorage data
  const debugStorage = () => {
    const allData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          allData[key] = JSON.parse(localStorage.getItem(key) || '');
        } catch {
          allData[key] = localStorage.getItem(key);
        }
      }
    }
    return allData;
  };

  // Save instances to localStorage whenever they change
  useEffect(() => {
    console.log('Saving instances:', savedInstances)
    localStorage.setItem('savedInstances', JSON.stringify(savedInstances))
  }, [savedInstances])

  const filteredInstances = savedInstances.filter(instance => 
    showArchived ? instance.isArchived : !instance.isArchived
  )
  console.log('Filtered instances:', filteredInstances, 'showArchived:', showArchived)

  const toggleArchiveInstance = (id: string) => {
    setSavedInstances(instances => 
      instances.map(instance => 
        instance.id === id 
          ? { ...instance, isArchived: !instance.isArchived }
          : instance
      )
    )
  }

  // Helper function for date calculations
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    date.setMinutes(date.getMinutes() + date.getTimezoneOffset())
    return date
  }

  // Calculate timeline items when dependencies change
  useEffect(() => {
    const calculateTimelineItems = (): TimelineItem[] => {
      const items: TimelineItem[] = [
        {
          name: "Mutual Acceptance",
          date: formatDate(mutualDate),
          daysFromMutual: 0,
          method: "Start Date",
          notes: "",
          isContingency: false,
          status: 'completed'
        }
      ]

      // Add contingencies
      contingencies.forEach(contingency => {
        let date: Date
        if (contingency.type === 'fixed_date' && contingency.fixedDate) {
          date = formatDate(contingency.fixedDate)
        } else if (contingency.type === 'days_from_mutual' && contingency.days) {
          date = new Date(formatDate(mutualDate).getTime() + contingency.days * 24 * 60 * 60 * 1000)
        } else if (contingency.type === 'days_before_closing' && contingency.days) {
          date = new Date(formatDate(closingDate).getTime() - contingency.days * 24 * 60 * 60 * 1000)
        } else {
          date = new Date()
        }

        items.push({
          name: contingency.name,
          date,
          daysFromMutual: Math.round((date.getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
          method: contingency.type === 'fixed_date'
            ? 'Fixed Date'
            : contingency.type === 'days_from_mutual'
              ? `${contingency.days} days from mutual`
              : `${contingency.days} days before closing`,
          notes: contingency.description || '',
          isContingency: true,
          contingencyId: contingency.id,
          isPossessionDate: contingency.isPossessionDate,
          status: contingency.status
        })
      })

      // Add closing date
      items.push({
        name: "Closing",
        date: formatDate(closingDate),
        daysFromMutual: Math.round((formatDate(closingDate).getTime() - formatDate(mutualDate).getTime()) / (1000 * 60 * 60 * 24)),
        method: "End Date",
        notes: "",
        isContingency: false,
        status: 'pending'
      })

      return items.sort((a, b) => a.date.getTime() - b.date.getTime())
    }

    setTimelineItems(calculateTimelineItems())
  }, [mutualDate, closingDate, contingencies])

  const handleNewTimeline = () => {
    setSelectedInstance(null)
    setIsCreatingNew(true)
    setInstanceName('')
    const newMutualDate = new Date().toISOString().split('T')[0]
    const newClosingDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    setMutualDate(newMutualDate)
    setClosingDate(newClosingDate)

    const defaultContingencies = getDefaultContingencies(newMutualDate, newClosingDate)
    const holidays = getHolidaysInRange(newMutualDate, newClosingDate)

    setContingencies([...defaultContingencies, ...holidays])
  }

  const handleSaveInstance = () => {
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

  const handleLoadInstance = (instance: SavedInstance) => {
    setIsCreatingNew(false)
    setSelectedInstance(instance.id)
    setInstanceName(instance.name)
    setMutualDate(instance.mutualDate)
    setClosingDate(instance.closingDate)
    setContingencies(instance.contingencies)
  }

  const handleDeleteInstance = (id: string) => {
    setSavedInstances(prev => prev.filter(instance => instance.id !== id))
    if (selectedInstance === id) {
      setSelectedInstance(null)
    }
  }

  const handleAddContingency = () => {
    if (!contingencyName) return

    const newContingency: Contingency = {
      id: crypto.randomUUID(),
      name: contingencyName,
      type: contingencyType,
      description: contingencyDescription,
      isPossessionDate,
      status: 'pending'
    }

    if (contingencyType === 'fixed_date') {
      newContingency.fixedDate = contingencyDate
    } else {
      newContingency.days = contingencyDays
    }

    const newContingencies = [...contingencies, newContingency]
    setContingencies(newContingencies)

    // Reset form
    setContingencyName('')
    setContingencyDescription('')
    setIsPossessionDate(false)
    setShowAddModal(false)

    // Auto-save if there's a selected instance
    if (selectedInstance) {
      setSavedInstances(prev =>
        prev.map(instance =>
          instance.id === selectedInstance
            ? {
                ...instance,
                mutualDate,
                closingDate,
                contingencies: newContingencies,
                lastModified: new Date().toISOString()
              }
            : instance
        )
      )
    }
  }

  const handleUpdateContingency = (updatedContingency: Contingency) => {
    const newContingencies = contingencies.map(c =>
      c.id === updatedContingency.id ? updatedContingency : c
    )
    setContingencies(newContingencies)
    setEditingContingencyId(null)
    setEditingContingency(null)

    if (selectedInstance) {
      setSavedInstances(prev =>
        prev.map(instance =>
          instance.id === selectedInstance
            ? {
                ...instance,
                mutualDate,
                closingDate,
                contingencies: newContingencies,
                lastModified: new Date().toISOString()
              }
            : instance
        )
      )
    }
  }

  const handleDeleteContingency = (id: string) => {
    const newContingencies = contingencies.filter(c => c.id !== id)
    setContingencies(newContingencies)

    if (selectedInstance) {
      setSavedInstances(prev =>
        prev.map(instance =>
          instance.id === selectedInstance
            ? {
                ...instance,
                mutualDate,
                closingDate,
                contingencies: newContingencies,
                lastModified: new Date().toISOString()
              }
            : instance
        )
      )
    }
  }

  const handleStatusChange = (contingencyId: string, newStatus: ContingencyStatus) => {
    const updatedContingency = contingencies.find(c => c.id === contingencyId)
    if (updatedContingency) {
      const completedDate = newStatus === 'completed'
        ? new Date().toISOString().split('T')[0]
        : undefined

      handleUpdateContingency({
        ...updatedContingency,
        status: newStatus,
        completedDate
      })
    }
  }

  const handleExportData = () => {
    const savedData = localStorage.getItem('savedInstances')
    if (savedData) {
      const blob = new Blob([savedData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `timeline-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
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
                className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
              >
                {showArchived ? 'Show Active' : 'Show Archived'}
              </button>
            </div>

            <button
              onClick={handleNewTimeline}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Create New Timeline
            </button>

            {(isCreatingNew || selectedInstance) && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="text-sm font-medium mb-2">
                  {isCreatingNew ? 'Create New Timeline' : 'Edit Timeline'}
                </div>
                <input
                  type="text"
                  value={instanceName}
                  onChange={(e) => setInstanceName(e.target.value)}
                  placeholder="Timeline name"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={handleSaveInstance}
                  disabled={!instanceName.trim()}
                  className={`
                    w-full mt-2 px-3 py-2 rounded-md text-sm font-medium
                    ${!instanceName.trim()
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-500 text-white hover:bg-blue-600'}
                  `}
                >
                  {isCreatingNew ? 'Create Timeline' : 'Save Changes'}
                </button>
              </div>
            )}

            <div className="space-y-2">
              {filteredInstances.map((instance) => (
                <div
                  key={instance.id}
                  className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${
                    selectedInstance === instance.id ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div
                    className="flex-grow"
                    onClick={() => handleLoadInstance(instance)}
                  >
                    <div className="font-medium">{instance.name}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(instance.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleArchiveInstance(instance.id);
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                      title={instance.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      {instance.isArchived ? '📤' : '📥'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInstance(instance.id);
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
      <div className="flex-1 overflow-hidden flex flex-col">
        {!showSidebar && (
          <button
            onClick={() => setShowSidebar(true)}
            className="fixed left-4 top-4 p-2 rounded-md shadow-md bg-white
                     hover:bg-gray-50 transition-colors duration-200"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div className="container mx-auto max-w-7xl p-6 space-y-6 overflow-y-auto">
          {/* Dates Section */}
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
                    value={mutualDate}
                    onChange={(e) => setMutualDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Closing Date
                  </label>
                  <input
                    type="date"
                    value={closingDate}
                    onChange={(e) => setClosingDate(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gantt Chart */}
          <GanttChart
            mutualDate={mutualDate}
            closingDate={closingDate}
            contingencies={contingencies}
          />

          {/* Timeline Table */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Timeline</CardTitle>
                <ActionButton
                  onClick={() => setShowAddModal(true)}
                  variant="primary"
                >
                  Add Contingency
                </ActionButton>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <colgroup>
                    <col className="w-[25%]" />
                    <col className="w-[200px]" />
                    <col className="w-[35%]" />
                    <col className="w-[180px]" />
                    <col className="w-[100px]" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-600 border-b whitespace-nowrap">Event</th>
                      <th className="text-left p-3 font-medium text-gray-600 border-b whitespace-nowrap">Date</th>
                      <th className="text-left p-3 font-medium text-gray-600 border-b whitespace-nowrap">Timeline</th>
                      <th className="text-left p-3 font-medium text-gray-600 border-b whitespace-nowrap">Status</th>
                      <th className="text-left p-3 font-medium text-gray-600 border-b whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timelineItems.map((item, index) => {
                      const contingency = item.contingencyId
                        ? contingencies.find(c => c.id === item.contingencyId)
                        : null

                      return (
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
                            {item.isContingency && contingency && (
                              <StatusDropdown
                                status={contingency.status}
                                onChange={(newStatus) => handleStatusChange(contingency.id, newStatus)}
                              />
                            )}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            {item.isContingency && contingency && (
                              <div className="flex items-center space-x-2">
                                <ActionButton
                                  onClick={() => {
                                    setEditingContingencyId(contingency.id)
                                    setEditingContingency(contingency)
                                  }}
                                  variant="secondary"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </ActionButton>
                                <ActionButton
                                  onClick={() => handleDeleteContingency(contingency.id)}
                                  variant="danger"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </ActionButton>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || editingContingency) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              {editingContingency ? 'Edit Contingency' : 'Add Contingency'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={editingContingency?.name || contingencyName}
                  onChange={(e) => {
                    if (editingContingency) {
                      setEditingContingency({...editingContingency, name: e.target.value})
                    } else {
                      setContingencyName(e.target.value)
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contingency name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={editingContingency?.type || contingencyType}
                  onChange={(e) => {
                    const value = e.target.value as ContingencyType
                    if (editingContingency) {
                      setEditingContingency({...editingContingency, type: value})
                    } else {
                      setContingencyType(value)
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="days_from_mutual">Days from Mutual</option>
                  <option value="days_before_closing">Days before Closing</option>
                  <option value="fixed_date">Fixed Date</option>
                </select>
              </div>

              {(editingContingency?.type === 'fixed_date' || contingencyType === 'fixed_date') ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingContingency?.fixedDate || contingencyDate}
                    onChange={(e) => {
                      if (editingContingency) {
                        setEditingContingency({...editingContingency, fixedDate: e.target.value})
                      } else {
                        setContingencyDate(e.target.value)
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Days
                  </label>
                  <input
                    type="number"
                    value={editingContingency?.days || contingencyDays}
                    onChange={(e) => {
                      const value = Number(e.target.value)
                      if (editingContingency) {
                        setEditingContingency({...editingContingency, days: value})
                      } else {
                        setContingencyDays(value)
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editingContingency?.description || contingencyDescription}
                  onChange={(e) => {
                    if (editingContingency) {
                      setEditingContingency({...editingContingency, description: e.target.value})
                    } else {
                      setContingencyDescription(e.target.value)
                    }
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={editingContingency?.isPossessionDate || isPossessionDate}
                  onChange={(e) => {
                    if (editingContingency) {
                      setEditingContingency({...editingContingency, isPossessionDate: e.target.checked})
                    } else {
                      setIsPossessionDate(e.target.checked)
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">
                  Is Possession Date
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <ActionButton
                  onClick={() => {
                    if (editingContingency) {
                      handleUpdateContingency(editingContingency)
                    } else {
                      handleAddContingency()
                    }
                  }}
                  variant="primary"
                >
                  {editingContingency ? 'Save Changes' : 'Add Contingency'}
                </ActionButton>
                <ActionButton
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingContingency(null)
                    setEditingContingencyId(null)
                  }}
                  variant="secondary"
                >
                  Cancel
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
