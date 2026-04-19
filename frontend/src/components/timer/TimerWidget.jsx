import { Play, Square, Clock } from 'lucide-react'
import { useTimerStore } from '../store/timerStore'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function TimerWidget({ projects = [] }) {
  const { 
    runningEntry, 
    isRunning, 
    elapsedSeconds, 
    startTimer, 
    stopTimer, 
    fetchRunning,
    formatTime 
  } = useTimerStore()
  
  const [selectedProject, setSelectedProject] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    if (!selectedProject) {
      toast.error('Selecciona un proyecto')
      return
    }
    setLoading(true)
    const result = await startTimer(selectedProject, description)
    setLoading(false)
    if (result.success) {
      toast.success('Timer iniciado')
    } else {
      toast.error(result.error)
    }
  }

  const handleStop = async () => {
    setLoading(true)
    const result = await stopTimer()
    setLoading(false)
    if (result.success) {
      toast.success(`Tiempo registrado: ${formatTime(elapsedSeconds)}`)
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {isRunning && runningEntry ? (
        <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="font-semibold text-indigo-600">{formatTime(elapsedSeconds)}</p>
            <p className="text-xs text-indigo-500">{runningEntry.project?.name}</p>
          </div>
          <button
            onClick={handleStop}
            disabled={loading}
            className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input py-1.5 text-sm w-40"
          >
            <option value="">Proyecto...</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Qué hacés?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input py-1.5 text-sm w-32"
          />
          <button
            onClick={handleStart}
            disabled={loading || !selectedProject}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
          >
            <Play className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}