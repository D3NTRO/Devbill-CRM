import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import { clientsApi } from '../api/clients'
import {
  Plus, Search, FolderKanban, ExternalLink, Pencil, Trash2, X,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PIPELINE_STAGES = [
  { value: '', label: 'Todas las etapas' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROPOSAL', label: 'Propuesta' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'BILLED', label: 'Facturado' },
]

const BILLING_TYPES = [
  { value: '', label: 'Todos' },
  { value: 'HOURLY', label: 'Por hora' },
  { value: 'FIXED', label: 'Precio fijo' },
]

const STATUSES = [
  { value: '', label: 'Todos los estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'PAUSED', label: 'Pausado' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'CANCELLED', label: 'Cancelado' },
]

const emptyForm = {
  client: '', name: '', description: '', billing_type: 'HOURLY',
  hourly_rate: '', fixed_price: '', estimated_hours: '', estimated_value: '',
  pipeline_stage: 'LEAD', status: 'ACTIVE', lead_source: '', color: '#6366F1',
  start_date: '', deadline: '',
}

function formatCurrency(value) {
  if (!value && value !== 0) return '—'
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [filterBilling, setFilterBilling] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    Promise.all([projectsApi.getAll(), clientsApi.getAll()])
      .then(([projectsRes, clientsRes]) => {
        setProjects(projectsRes.data.results || projectsRes.data)
        setClients(clientsRes.data.results || clientsRes.data)
      })
      .catch(() => toast.error('Error al cargar datos'))
      .finally(() => setLoading(false))
  }, [])

  const filteredProjects = projects.filter(p => {
    const matchSearch = !search || 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.client_name || '').toLowerCase().includes(search.toLowerCase())
    const matchStage = !filterStage || p.pipeline_stage === filterStage
    const matchBilling = !filterBilling || p.billing_type === filterBilling
    const matchStatus = !filterStatus || p.status === filterStatus
    return matchSearch && matchStage && matchBilling && matchStatus
  })

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm })
    setShowModal(true)
  }

  const openEdit = (project) => {
    setEditing(project)
    setFormData({
      client: project.client || '',
      name: project.name,
      description: project.description || '',
      billing_type: project.billing_type,
      hourly_rate: project.hourly_rate || '',
      fixed_price: project.fixed_price || '',
      estimated_hours: project.estimated_hours || '',
      estimated_value: project.estimated_value || '',
      pipeline_stage: project.pipeline_stage,
      status: project.status,
      lead_source: project.lead_source || '',
      color: project.color,
      start_date: project.start_date || '',
      deadline: project.deadline || '',
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        client: formData.client || null,
        hourly_rate: formData.billing_type === 'HOURLY' ? (formData.hourly_rate || null) : null,
        fixed_price: formData.billing_type === 'FIXED' ? (formData.fixed_price || null) : null,
        estimated_hours: formData.estimated_hours || null,
        estimated_value: formData.estimated_value || null,
        start_date: formData.start_date || null,
        deadline: formData.deadline || null,
      }

      if (editing) {
        await projectsApi.update(editing.id, payload)
        toast.success('Proyecto actualizado!')
      } else {
        await projectsApi.create(payload)
        toast.success('Proyecto creado!')
      }

      setShowModal(false)
      setEditing(null)
      const res = await projectsApi.getAll()
      setProjects(res.data.results || res.data)
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(', ')
        : 'Error al guardar proyecto'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await projectsApi.delete(id)
      toast.success('Proyecto eliminado!')
      setDeleting(null)
      setProjects(p => p.filter(proj => proj.id !== id))
    } catch (error) {
      toast.error('Error al eliminar proyecto')
    }
  }

  const setField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton h-8 w-40" />
          <div className="skeleton h-10 w-44 rounded-lg" />
        </div>
        <div className="skeleton h-10 w-full mb-6 rounded-lg" />
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="card">
              <div className="flex items-center gap-4">
                <div className="skeleton h-5 w-40" />
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-4 w-20" />
                <div className="skeleton h-6 w-20 rounded-full" />
                <div className="skeleton h-4 w-16 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Proyectos</h1>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nuevo Proyecto
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar proyecto o cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="input w-auto">
          {PIPELINE_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterBilling} onChange={e => setFilterBilling(e.target.value)} className="input w-auto">
          {BILLING_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto">
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }} className="mb-2">{projects.length === 0 ? 'No hay proyectos todavía' : 'No se encontraron proyectos'}</p>
          {projects.length === 0 && (
            <button onClick={openCreate} className="btn btn-primary">Crear primer proyecto</button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm border-b" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-3 font-medium">Proyecto</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Etapa</th>
                <th className="pb-3 font-medium">Tipo</th>
                <th className="pb-3 font-medium">Horas</th>
                <th className="pb-3 font-medium">Valor</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-3">
                    <Link to={`/projects/${p.id}`} className="font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1">
                      {p.name} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="py-3" style={{ color: 'var(--text-secondary)' }}>{p.client_name || '—'}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full" style={{ backgroundColor: p.color + '20', color: p.color }}>
                      {p.pipeline_stage}
                    </span>
                  </td>
                  <td className="py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.billing_type === 'HOURLY' ? 'Por hora' : 'Fijo'}</td>
                  <td className="py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{p.total_hours || 0}h</td>
                  <td className="py-3 text-sm font-medium">{formatCurrency(p.billing_type === 'FIXED' ? p.fixed_price : p.total_invoiced)}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 rounded" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleting(p)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !submitting && setShowModal(false)}>
          <div className="rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">{editing ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h2>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>Cliente *</label>
                <select
                  required
                  value={formData.client}
                  onChange={e => setField('client', e.target.value)}
                  className="input"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre *</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setField('name', e.target.value)}
                  className="input"
                  placeholder="Nombre del proyecto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setField('description', e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Descripción opcional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tipo de facturación</label>
                  <select
                    value={formData.billing_type}
                    onChange={e => setField('billing_type', e.target.value)}
                    className="input"
                  >
                    <option value="HOURLY">Por hora</option>
                    <option value="FIXED">Precio fijo</option>
                  </select>
                </div>
                <div>
                  {formData.billing_type === 'HOURLY' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tarifa por hora *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={e => setField('hourly_rate', e.target.value)}
                        className="input"
                        placeholder="0.00"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Precio fijo *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.fixed_price}
                        onChange={e => setField('fixed_price', e.target.value)}
                        className="input"
                        placeholder="0.00"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Horas estimadas</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={e => setField('estimated_hours', e.target.value)}
                    className="input"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Valor estimado</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimated_value}
                    onChange={e => setField('estimated_value', e.target.value)}
                    className="input"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Etapa pipeline</label>
                  <select value={formData.pipeline_stage} onChange={e => setField('pipeline_stage', e.target.value)} className="input">
                    {PIPELINE_STAGES.filter(s => s.value).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Estado</label>
                  <select value={formData.status} onChange={e => setField('status', e.target.value)} className="input">
                    {STATUSES.filter(s => s.value).map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha inicio</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={e => setField('start_date', e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha límite</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setField('deadline', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Color:</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={e => setField('color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Guardando...' : editing ? 'Actualizar' : 'Crear'}
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
            <h3 className="text-lg font-semibold mb-2">Eliminar proyecto</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">¿Eliminar <strong>{deleting.name}</strong>? Esta acción no se puede deshacer.</p>
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

function statusBadge(status) {
  switch (status) {
    case 'ACTIVE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
    case 'PAUSED': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
    case 'COMPLETED': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'CANCELLED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
    default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
  }
}
