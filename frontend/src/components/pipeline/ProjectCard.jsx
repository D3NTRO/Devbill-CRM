import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Clock, DollarSign } from 'lucide-react'

export default function ProjectCard({ project }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: 'var(--surface)',
    borderColor: 'var(--border)',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="rounded-lg p-3 shadow-sm border cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-sm line-clamp-2" style={{ color: 'var(--text)' }}>
          {project.name}
        </h4>
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
          style={{ backgroundColor: project.color }}
        />
      </div>

      {project.client_name && (
        <p className="text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>{project.client_name}</p>
      )}

      <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{project.total_hours || 0}h</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          <span>${project.total_invoiced || 0}</span>
        </div>
      </div>
    </div>
  )
}