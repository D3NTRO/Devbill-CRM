import { useEffect, useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { pipelineApi } from '../api/projects'
import PipelineColumn from '../components/pipeline/PipelineColumn'
import ProjectCard from '../components/pipeline/ProjectCard'
import toast from 'react-hot-toast'

const STAGES = [
  { id: 'LEAD', label: 'Leads', color: '#6B7280' },
  { id: 'PROPOSAL', label: 'Propuestas', color: '#8B5CF6' },
  { id: 'NEGOTIATION', label: 'Negociación', color: '#F59E0B' },
  { id: 'ACTIVE', label: 'Activos', color: '#10B981' },
  { id: 'COMPLETED', label: 'Completados', color: '#3B82F6' },
  { id: 'BILLED', label: 'Facturados', color: '#6366F1' },
]

export default function Pipeline() {
  const [pipeline, setPipeline] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  useEffect(() => {
    fetchPipeline()
  }, [])

  const fetchPipeline = async () => {
    try {
      const res = await pipelineApi.get()
      const data = res.data
      const pipelineData = {}
      STAGES.forEach(stage => {
        pipelineData[stage.id] = data[stage.id] || []
      })
      setPipeline(pipelineData)
    } catch (error) {
      toast.error('Error al cargar pipeline')
    } finally {
      setLoading(false)
    }
  }

  const findContainer = (id) => {
    if (id in pipeline) return id
    for (const [key, projects] of Object.entries(pipeline)) {
      if (projects.find(p => p.id === id)) return key
    }
    return null
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id
    const overId = over.id

    const activeContainer = findContainer(activeId)
    const overContainer = findContainer(overId) || overId

    if (!activeContainer || !overContainer) return

    if (activeContainer !== overContainer) {
      const activeItems = pipeline[activeContainer]
      const overItems = pipeline[overContainer]
      const activeIndex = activeItems.findIndex(i => i.id === activeId)
      const overIndex = overId in pipeline ? overItems.length : overItems.findIndex(i => i.id === overId)

      const newPipeline = { ...pipeline }
      const [movedItem] = newPipeline[activeContainer].splice(activeIndex, 1)
      
      if (overId in pipeline) {
        newPipeline[overContainer].splice(overIndex, 0, movedItem)
      } else {
        newPipeline[overContainer].push(movedItem)
      }

      setPipeline(newPipeline)

      try {
        await pipelineApi.move(activeId, overContainer)
        toast.success('Proyecto movido')
      } catch (error) {
        fetchPipeline()
        toast.error('Error al mover proyecto')
      }
    }
  }

  if (loading) {
    return <div className="p-6 text-center">Cargando pipeline...</div>
  }

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-bold mb-6">Pipeline de Proyectos</h1>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 180px)' }}>
          {STAGES.map((stage) => (
            <PipelineColumn
              key={stage.id}
              stage={stage}
              projects={pipeline[stage.id] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-80">
              {Object.values(pipeline).flat().find(p => p.id === activeId) && (
                <ProjectCard 
                  project={Object.values(pipeline).flat().find(p => p.id === activeId)} 
                />
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}