import { useState } from 'react'
import { Contingency, SavedInstance } from '../../types/timeline'
import { ActionButton } from '../common/ActionButton'
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card'
import { ContingencyForm } from './ContingencyForm'

interface SidebarProps {
  instances: SavedInstance[]
  selectedInstanceId: string | null
  onSaveInstance: () => void
  onLoadInstance: (instance: SavedInstance) => void
  onDeleteInstance: (instanceId: string) => void
  onAddContingency: (contingency: Contingency) => void
  mutualDate: string
  closingDate: string
}

export function Sidebar({
  instances,
  selectedInstanceId,
  onSaveInstance,
  onLoadInstance,
  onDeleteInstance,
  onAddContingency,
  mutualDate,
  closingDate
}: SidebarProps) {
  const [showNewContingencyForm, setShowNewContingencyForm] = useState(false)

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <Card>
        <CardHeader>
          <CardTitle>Saved Instances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActionButton
              onClick={onSaveInstance}
              variant="primary"
              className="w-full"
            >
              Save Current Instance
            </ActionButton>

            <div className="space-y-2">
              {instances.map((instance) => (
                <div
                  key={instance.id}
                  className={`
                    flex items-center justify-between p-2 rounded
                    ${selectedInstanceId === instance.id ? 'bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                >
                  <button
                    onClick={() => onLoadInstance(instance)}
                    className="flex-1 text-left"
                  >
                    {instance.name}
                  </button>
                  <ActionButton
                    onClick={() => onDeleteInstance(instance.id)}
                    variant="danger"
                    className="ml-2"
                  >
                    Delete
                  </ActionButton>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Contingencies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ActionButton
              onClick={() => setShowNewContingencyForm(true)}
              variant="primary"
              className="w-full"
            >
              Add New Contingency
            </ActionButton>

            {showNewContingencyForm && (
              <div className="mt-4">
                <ContingencyForm
                  onSubmit={(contingency) => {
                    onAddContingency(contingency)
                    setShowNewContingencyForm(false)
                  }}
                  onCancel={() => setShowNewContingencyForm(false)}
                  mutualDate={mutualDate}
                  closingDate={closingDate}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
