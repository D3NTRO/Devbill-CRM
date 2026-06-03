import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { projectsApi } from '../api/projects'
import {
  ArrowLeft, Trash2, ExternalLink, Clock, DollarSign, Calendar,
  BarChart3, Tag, GitBranch, AlertCircle, Pencil, Loader2, X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const PIPELINE_STAGES = [
  { value: 'LEAD', label: 'Lead' },
  { value: 'PROPOSAL', label: 'Propuesta' },
  { value: 'NEGOTIATION', label: 'Negociación' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'COMPLETED', label: 'Completado' },
  { value: 'BILLED', label: 'Facturado' },
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

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [timeEntries, setTimeEntries] = useState([])
  const [unbilled, setUnbilled] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      projectsApi.getById(id),
      projectsApi.getTimeEntries(id),
      projectsApi.getUnbilledHours(id),
    ])
      .then(([projectRes, timeRes, unbilledRes]) => {
        setProject(projectRes.data)
        setTimeEntries(timeRes.data.results || timeRes.data || [])
        setUnbilled(unbilledRes.data)
      })
      .catch(() => toast.error('Error al cargar proyecto'))
      .finally(() => setLoading(false))
  }, [id])

  const openEdit = () => {
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
    setShowEditModal(true)
  }

  const handleUpdate = async (e) => {
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
      await projectsApi.update(id, payload)
      const res = await projectsApi.getById(id)
      setProject(res.data)
      toast.success('Proyecto actualizado!')
      setShowEditModal(false)
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(', ')
        : 'Error al actualizar'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    try {
      await projectsApi.delete(id)
      toast.success('Proyecto eliminado!')
      navigate('/projects')
    } catch (error) {
      toast.error('Error al eliminar proyecto')
    } finally {
      setDeleting(false)
    }
  }

  const setField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-6 w-32 mb-6" />
        <div className="skeleton h-8 w-64 mb-4" />
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
          <div className="skeleton h-20 rounded-lg" />
        </div>
        <div className="skeleton h-64 rounded-lg" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-6 text-center py-16">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Proyecto no encontrado</p>
        <Link to="/projects" className="text-indigo-600 hover:underline mt-4 inline-block">Volver a proyectos</Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <Link to="/projects" className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Proyectos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(project.status)}`}>{project.status}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={openEdit} className="btn btn-secondary flex items-center gap-1.5">
            <Pencil className="w-4 h-4" /> Editar
          </button>
          <button onClick={() => setDeleting(true)} className="btn btn-danger flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      {/* Client & Stage */}
      <div className="flex flex-wrap items-center gap-4 mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5">
          <ExternalLink className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> {project.client_name || 'Sin cliente'}
        </span>
        <span className="flex items-center gap-1.5">
          <GitBranch className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> {PIPELINE_STAGES.find(s => s.value === project.pipeline_stage)?.label || project.pipeline_stage}
        </span>
        <span className="flex items-center gap-1.5">
          <Tag className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> {project.billing_type === 'HOURLY' ? 'Por hora' : 'Precio fijo'}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            <Clock className="w-4 h-4" /> Horas totales
          </div>
          <p className="text-2xl font-bold">{project.total_hours || 0}h</p>
          {project.estimated_hours && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Est: {project.estimated_hours}h</p>
          )}
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            <DollarSign className="w-4 h-4" /> Facturado
          </div>
          <p className="text-2xl font-bold">{formatCurrency(project.total_invoiced)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            <BarChart3 className="w-4 h-4" /> Valor estimado
          </div>
          <p className="text-2xl font-bold">{formatCurrency(project.estimated_value)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-4 h-4" /> Plazo
          </div>
          <p className="text-lg font-bold">{project.deadline ? dayjs(project.deadline).format('DD/MM/YYYY') : 'Sin fecha'}</p>
          {project.start_date && (
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Inicio: {dayjs(project.start_date).format('DD/MM/YYYY')}</p>
          )}
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="card mb-8">
          <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Descripción</h3>
          <p style={{ color: 'var(--text)' }} className="whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Unbilled hours */}
      {unbilled && (
        <div className="card mb-8" style={{ borderLeft: '4px solid #fbbf24' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Horas sin facturar</h3>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{unbilled.total_hours || 0}h sin facturar</p>
            </div>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{formatCurrency(unbilled.total_amount)}</p>
          </div>
        </div>
      )}

      {/* Time entries */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Registros de tiempo ({timeEntries.length})</h3>
        </div>
        {timeEntries.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm py-4 text-center">Sin registros de tiempo</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                  <tr className="text-left text-sm border-b" style={{ color: 'var(--text-muted)' }}>
                    <th className="pb-2 font-medium">Descripción</th>
                    <th className="pb-2 font-medium">Fecha</th>
                    <th className="pb-2 font-medium">Horas</th>
                    <th className="pb-2 font-medium">Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {timeEntries.map(entry => (
                    <tr key={entry.id} className="border-b text-sm" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2" style={{ color: 'var(--text)' }}>{entry.description || '—'}</td>
                      <td className="py-2" style={{ color: 'var(--text-secondary)' }}>{dayjs(entry.date).format('DD/MM/YYYY')}</td>
                      <td className="py-2 font-medium">{entry.hours}h</td>
                      <td className="py-2">
                        {entry.is_invoiced
                          ? <span className="text-green-600 dark:text-green-400 text-xs">Facturado</span>
                          : <span className="text-amber-600 dark:text-amber-400 text-xs">Pendiente</span>
                        }
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleting(false)}>
          <div className="rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)' }}>
            <h3 className="text-lg font-semibold mb-2">Eliminar proyecto</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
              ¿Eliminar <strong>{project.name}</strong>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleting(false)} className="btn btn-secondary">Cancelar</button>
              <button onClick={handleDelete} className="btn btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !submitting && setShowEditModal(false)}>
          <div className="rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Editar Proyecto</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Nombre *</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setField('name', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setField('description', e.target.value)}
                  className="input"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tipo facturación</label>
                  <select value={formData.billing_type} onChange={e => setField('billing_type', e.target.value)} className="input">
                    <option value="HOURLY">Por hora</option>
                    <option value="FIXED">Precio fijo</option>
                  </select>
                </div>
                <div>
                  {formData.billing_type === 'HOURLY' ? (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Tarifa por hora</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.hourly_rate}
                        onChange={e => setField('hourly_rate', e.target.value)}
                        className="input"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Precio fijo</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.fixed_price}
                        onChange={e => setField('fixed_price', e.target.value)}
                        className="input"
                      />
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Etapa pipeline</label>
                  <select value={formData.pipeline_stage} onChange={e => setField('pipeline_stage', e.target.value)} className="input">
                    {PIPELINE_STAGES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Estado</label>
                  <select value={formData.status} onChange={e => setField('status', e.target.value)} className="input">
                    <option value="ACTIVE">Activo</option>
                    <option value="PAUSED">Pausado</option>
                    <option value="COMPLETED">Completado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Guardar cambios
                </button>
              </div>
            </form>
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
