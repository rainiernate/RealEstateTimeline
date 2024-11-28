import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableItemProps {
  id: string
  name: string
}

export function SortableItem({ id, name }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id })

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
      className="h-8 flex items-center cursor-move group"
    >
      <span className="text-sm whitespace-nowrap overflow-hidden text-ellipsis group-hover:text-blue-600 transition-colors">
        {name}
      </span>
    </div>
  )
}
