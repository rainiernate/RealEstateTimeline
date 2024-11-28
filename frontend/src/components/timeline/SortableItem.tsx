import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Contingency } from '../../types/timeline'

export function SortableItem({ contingency }: { contingency: Contingency }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: contingency.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`h-8 flex items-center cursor-move select-none
        ${isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
    >
      <span className="text-sm truncate select-none" title={contingency.name}>
        {contingency.name}
      </span>
    </div>
  )
}
