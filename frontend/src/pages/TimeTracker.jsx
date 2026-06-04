import { useEffect, useState, useCallback } from 'react'
import { timeEntriesApi } from '../api/timeEntries'
import { projectsApi } from '../api/projects'
import { useTimerStore } from '../store/timerStore'
import {
  Clock, Play, Square, Plus, Pencil, Trash2, X,
  Filter, Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

function formatSeconds(seconds) {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const emptyForm = { project: '', description: '', started_at: '', ended_at: '', is_billable: true }

export default function TimeTracker() {
  const {
    runningEntry, isRunning, elapsedSeconds,
    startTimer, stopTimer,
  } = useTimerStore()

  const [entries, setEntries] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState('')
  const [description, setDescription] = useState('')
  const [timerLoading, setTimerLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [filterProject, setFilterProject] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterBillable, setFilterBillable] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async (params = {}) => {
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        timeEntriesApi.getAll(params),
        projectsApi.getAll(),
      ])
      setEntries(entriesRes.data.results || entriesRes.data)
      setProjects(projectsRes.data.results || projectsRes.data)
    } catch {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleStart = async () => {
    if (!selectedProject) { toast.error('Selecciona un proyecto'); return }
    setTimerLoading(true)
    const result = await startTimer(selectedProject, description)
    setTimerLoading(false)
    if (result.success) {
      toast.success('Timer iniciado')
      setDescription('')
    } else {
      toast.error(result.error)
    }
  }

  const handleStop = async () => {
    setTimerLoading(true)
    const result = await stopTimer()
    setTimerLoading(false)
    if (result.success) {
      toast.success(`Registrado: ${formatSeconds(elapsedSeconds)}`)
      await load()
    } else {
      toast.error(result.error)
    }
  }

  const applyFilters = () => {
    const params = {}
    if (filterProject) params.project = filterProject
    if (filterDateFrom) params.date_from = filterDateFrom
    if (filterDateTo) params.date_to = filterDateTo
    if (filterBillable) params.is_billable = filterBillable
    load(params)
  }

  const clearFilters = () => {
    setFilterProject('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setFilterBillable('')
    load()
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({
      ...emptyForm,
      started_at: dayjs().format('YYYY-MM-DDTHH:mm'),
      project: selectedProject || '',
    })
    setShowModal(true)
  }

  const openEdit = (entry) => {
    setEditing(entry)
    setFormData({
      project: entry.project || '',
      description: entry.description || '',
      started_at: entry.started_at ? dayjs(entry.started_at).format('YYYY-MM-DDTHH:mm') : '',
      ended_at: entry.ended_at ? dayjs(entry.ended_at).format('YYYY-MM-DDTHH:mm') : '',
      is_billable: entry.is_billable,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        started_at: formData.started_at ? dayjs(formData.started_at).toISOString() : null,
        ended_at: formData.ended_at ? dayjs(formData.ended_at).toISOString() : null,
      }

      if (editing) {
        await timeEntriesApi.update(editing.id, payload)
        toast.success('Entrada actualizada!')
      } else {
        await timeEntriesApi.create(payload)
        toast.success('Entrada creada!')
      }

      setShowModal(false)
      setEditing(null)
      await load()
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(', ')
        : 'Error al guardar entrada'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await timeEntriesApi.delete(id)
      toast.success('Entrada eliminada!')
      setDeleting(null)
      setEntries(p => p.filter(e => e.id !== id))
    } catch {
      toast.error('Error al eliminar entrada')
    }
  }

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const billableMinutes = entries.filter(e => e.is_billable).reduce((sum, e) => sum + (e.duration_minutes || 0), 0)
  const nonBillableMinutes = totalMinutes - billableMinutes

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-40 mb-6" />
        <div className="skeleton h-16 rounded-xl mb-6" />
        <div className="skeleton h-10 w-full mb-4 rounded-lg" />
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="card"><div className="skeleton h-5 w-full" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
            <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Time Tracker</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{entries.length} registros</p>
          </div>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Manual
        </button>
      </div>

      {/* 2-column layout on lg+ */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">

        {/* Left column — main content */}
        <div className="space-y-5">

          {/* Timer Panel */}
          <div className="card">
            {isRunning && runningEntry ? (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-ping" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg tabular-nums tracking-tight">{formatSeconds(elapsedSeconds)}</p>
                  <p className="text-sm truncate" style={{ color: 'var(--text-secondary)' }}>{runningEntry.project_name || '—'}</p>
                  {runningEntry.description && (
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{runningEntry.description}</p>
                  )}
                </div>
                <button
                  onClick={handleStop}
                  disabled={timerLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {timerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
                  Detener
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Proyecto</label>
                    <select
                      value={selectedProject}
                      onChange={e => setSelectedProject(e.target.value)}
                      className={`input py-2.5 ${!selectedProject ? 'border-dashed' : ''}`}
                    >
                      <option value="">Seleccionar proyecto...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name} {p.client_name ? `(${p.client_name})` : ''}</option>
                      ))}
                    </select>
                    {!selectedProject && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Seleccioná un proyecto para habilitar el timer</p>
                    )}
                  </div>
                  <div className="flex-[2]">
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Descripción</label>
                    <input
                      type="text"
                      placeholder="¿Qué estás haciendo?"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="input py-2.5"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleStart}
                    disabled={timerLoading || !selectedProject}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                      !selectedProject
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600 shadow-sm hover:shadow'
                    }`}
                  >
                    {timerLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 fill-current" />
                    )}
                    Iniciar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Filters bar (mobile toggle) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn btn-secondary flex items-center gap-2 text-sm ${
                showFilters
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700'
                  : ''
              }`}
            >
              <Filter className="w-3.5 h-3.5" /> Filtros
            </button>
            {(filterProject || filterDateFrom || filterDateTo || filterBillable) && (
              <button onClick={clearFilters} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Limpiar filtros
              </button>
            )}
            <div className="hidden lg:block text-xs" style={{ color: 'var(--text-muted)' }}>
              Usá los filtros de la derecha para acotar resultados
            </div>
          </div>

          {/* Filter panel (mobile only) */}
          {showFilters && (
            <div className="lg:hidden p-4 rounded-xl border space-y-3" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Proyecto</label>
                  <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input py-1.5 text-sm">
                    <option value="">Todos</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Facturable</label>
                  <select value={filterBillable} onChange={e => setFilterBillable(e.target.value)} className="input py-1.5 text-sm">
                    <option value="">Todos</option>
                    <option value="true">Sí</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Desde</label>
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="input py-1.5 text-sm" />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Hasta</label>
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input py-1.5 text-sm" />
                </div>
              </div>
              <button onClick={applyFilters} className="btn btn-primary w-full py-1.5 text-sm">Aplicar</button>
            </div>
          )}

          {/* Entries list */}
          {entries.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--border)' }}>
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30 w-fit mx-auto mb-4">
                <Clock className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
              </div>
              <p className="font-medium mb-1">Todavía no hay registros</p>
              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Iniciá el timer o creá una entrada manual para empezar</p>
              <div className="flex items-center justify-center gap-3">
                {!isRunning && (
                  <button onClick={() => document.querySelector('select')?.focus()} className="btn btn-primary text-sm flex items-center gap-2">
                    <Play className="w-3.5 h-3.5" /> Iniciar timer
                  </button>
                )}
                <button onClick={openCreate} className="btn btn-secondary text-sm flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5" /> Entrada manual
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs border-b" style={{ color: 'var(--text-muted)' }}>
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Proyecto</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Descripción</th>
                    <th className="pb-3 font-medium">Duración</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Facturable</th>
                    <th className="pb-3 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="tabular-nums">{entry.date ? dayjs(entry.date).format('DD/MM/YYYY') : dayjs(entry.started_at).format('DD/MM/YYYY')}</span>
                      </td>
                      <td className="py-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{entry.project_name}</td>
                      <td className="py-3 text-sm max-w-[180px] truncate hidden sm:table-cell" style={{ color: 'var(--text-secondary)' }}>
                        {entry.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td className="py-3 text-sm font-medium tabular-nums">
                        {entry.duration_minutes ? (
                          formatDuration(entry.duration_minutes)
                        ) : entry.ended_at ? (
                          <span style={{ color: 'var(--text-muted)' }}>calculando...</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-green-600 dark:text-green-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            En curso
                          </span>
                        )}
                      </td>
                      <td className="py-3 hidden sm:table-cell">
                        {entry.is_billable ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            <span className="w-1 h-1 rounded-full bg-green-500" />
                            Sí
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300">
                            <span className="w-1 h-1 rounded-full bg-gray-400" />
                            No
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(entry)} className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setDeleting(entry)} className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>{/* /left-column */}

        {/* Right column — metrics + filters (desktop) */}
        <div className="space-y-5">

          {/* Metrics cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Resumen</h3>
            <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total</span>
                <span className="text-lg font-bold tabular-nums">{formatDuration(totalMinutes)}</span>
              </div>
              <div className="w-full h-px my-2" style={{ backgroundColor: 'var(--border-light)' }} />
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span style={{ color: 'var(--text-secondary)' }}>Facturable</span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-green-600 dark:text-green-400">{formatDuration(billableMinutes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span style={{ color: 'var(--text-secondary)' }}>No facturable</span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400">{formatDuration(nonBillableMinutes)}</span>
              </div>
            </div>
          </div>

          {/* Filters (desktop, always visible) */}
          <div className="hidden lg:block space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Filtros</h3>
            <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Proyecto</label>
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input py-1.5 text-sm">
                  <option value="">Todos</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Facturable</label>
                <select value={filterBillable} onChange={e => setFilterBillable(e.target.value)} className="input py-1.5 text-sm">
                  <option value="">Todos</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Desde</label>
                <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="input py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>Hasta</label>
                <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="input py-1.5 text-sm" />
              </div>
              <button onClick={applyFilters} className="btn btn-primary w-full py-1.5 text-sm">Aplicar</button>
            </div>
          </div>

        </div>{/* /right-column */}

      </div>{/* /2-column grid */}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !submitting && setShowModal(false)}>
          <div className="rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold">{editing ? 'Editar entrada' : 'Nueva entrada manual'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Proyecto *</label>
                <select
                  required
                  value={formData.project}
                  onChange={e => setFormData({ ...formData, project: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descripción</label>
                <input
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  placeholder="Opcional"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Inicio</label>
                  <input
                    type="datetime-local"
                    value={formData.started_at}
                    onChange={e => setFormData({ ...formData, started_at: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fin</label>
                  <input
                    type="datetime-local"
                    value={formData.ended_at}
                    onChange={e => setFormData({ ...formData, ended_at: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_billable"
                  checked={formData.is_billable}
                  onChange={e => setFormData({ ...formData, is_billable: e.target.checked })}
                  className="rounded border-gray-300 dark:border-gray-600"
                />
                <label htmlFor="is_billable" className="text-sm text-gray-700 dark:text-gray-200">Facturable</label>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleting(null)}>
          <div className="rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)' }}>
            <h3 className="text-lg font-semibold mb-2">Eliminar entrada</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
              ¿Eliminar la entrada de <strong>{deleting.project_name}</strong> ({formatDuration(deleting.duration_minutes)})?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(null)} className="btn btn-secondary">Cancelar</button>
              <button onClick={() => handleDelete(deleting.id)} className="btn btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
