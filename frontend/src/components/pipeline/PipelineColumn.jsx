import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ProjectCard from './ProjectCard'

export default function PipelineColumn({ stage, projects }) {
  const { setNodeRef } = useDroppable({ id: stage.id })

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-72 bg-gray-100 rounded-xl p-3"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-semibold text-gray-700">{stage.label}</h3>
        </div>
        <span className="text-sm text-gray-500 bg-white px-2 py-0.5 rounded-full">
          {projects.length}
        </span>
      </div>

      <SortableContext items={projects.map(p => p.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 min-h-[100px]">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}