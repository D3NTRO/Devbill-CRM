import { useEffect, useState } from 'react'
import { tasksApi } from '../api/tasks'
import {
  ListTodo, Plus, Search, Pencil, Trash2, X, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const STATUSES = [
  { value: 'PENDING', label: 'Pendiente', color: '#6B7280', bg: '#F3F4F6' },
  { value: 'IN_PROGRESS', label: 'En progreso', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'DONE', label: 'Hecho', color: '#10B981', bg: '#ECFDF5' },
  { value: 'CANCELLED', label: 'Cancelado', color: '#EF4444', bg: '#FEF2F2' },
]

const PRIORITIES = [
  { value: 'LOW', label: 'Baja', color: '#6B7280' },
  { value: 'MEDIUM', label: 'Media', color: '#F59E0B' },
  { value: 'HIGH', label: 'Alta', color: '#F97316' },
  { value: 'URGENT', label: 'Urgente', color: '#EF4444' },
]

const emptyForm = {
  title: '', status: 'PENDING', priority: 'MEDIUM', due_date: '',
}

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    tasksApi.getAll()
      .then(res => setTasks(res.data.results || res.data))
      .catch(() => toast.error('Error al cargar tareas'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (task) => {
    setEditing(task)
    setFormData({
      title: task.title,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? dayjs(task.due_date).format('YYYY-MM-DDTHH:mm') : '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        due_date: formData.due_date || null,
      }

      if (editing) {
        await tasksApi.update(editing.id, payload)
        toast.success('Tarea actualizada!')
      } else {
        await tasksApi.create(payload)
        toast.success('Tarea creada!')
      }

      setShowModal(false)
      setEditing(null)
      const res = await tasksApi.getAll()
      setTasks(res.data.results || res.data)
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(', ')
        : 'Error al guardar tarea'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await tasksApi.delete(id)
      toast.success('Tarea eliminada!')
      setTasks(p => p.filter(t => t.id !== id))
      setDeleting(null)
    } catch (error) {
      toast.error('Error al eliminar tarea')
    }
  }

  const handleQuickStatus = async (task, newStatus) => {
    try {
      await tasksApi.update(task.id, { status: newStatus })
      setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
    } catch {
      toast.error('Error al actualizar estado')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-36 mb-6" />
        <div className="skeleton h-10 w-full mb-4 rounded-lg" />
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <div className="skeleton h-4 w-4 rounded-full" />
              <div className="skeleton h-5 w-48" />
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-12 rounded-full ml-auto" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ListTodo className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold">Tareas</h2>
          <span className="text-sm text-gray-500">({tasks.length})</span>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Tarea
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar tarea..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <ListTodo className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {tasks.length === 0 ? 'No hay tareas todavía' : 'No se encontraron tareas'}
          </p>
          {tasks.length === 0 && (
            <button onClick={openCreate} className="btn btn-primary">Crear primera tarea</button>
          )}
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(task => {
            const status = STATUSES.find(s => s.value === task.status) || STATUSES[0]
            const priority = PRIORITIES.find(p => p.value === task.priority) || PRIORITIES[1]
            const isOverdue = task.due_date && dayjs(task.due_date).isBefore(dayjs()) && task.status !== 'DONE' && task.status !== 'CANCELLED'
            return (
              <div key={task.id} className="card flex items-center gap-3 hover:shadow-sm transition-shadow">
                <button
                  onClick={() => handleQuickStatus(task, task.status === 'DONE' ? 'PENDING' : 'DONE')}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                    task.status === 'DONE'
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  title={task.status === 'DONE' ? 'Reabrir' : 'Marcar hecha'}
                >
                  {task.status === 'DONE' && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === 'DONE' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className={`text-xs mt-0.5 ${isOverdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {isOverdue ? '⚠ ' : ''}{dayjs(task.due_date).format('DD/MM/YYYY HH:mm')}
                    </p>
                  )}
                </div>

                <span
                  className="px-2 py-0.5 text-xs rounded-full font-medium"
                  style={{ backgroundColor: status.bg, color: status.color }}
                >
                  {status.label}
                </span>

                <span
                  className="px-2 py-0.5 text-xs rounded-full font-medium"
                  style={{ backgroundColor: priority.color + '15', color: priority.color }}
                >
                  {priority.label}
                </span>

                <div className="flex items-center gap-1 ml-2">
                  <button onClick={() => openEdit(task)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Editar">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleting(task)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Eliminar tarea</h3>
            <p className="text-gray-600 mb-6">
              ¿Eliminar <strong>{deleting.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={() => handleDelete(deleting.id)} className="btn btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">{editing ? 'Editar Tarea' : 'Nueva Tarea'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="¿Qué hay que hacer?"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    {STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
                <input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                  className="input"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
