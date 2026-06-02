import { useEffect, useState, useCallback } from 'react'
import { proposalsApi } from '../api/proposals'
import { projectsApi } from '../api/projects'
import {
  FileText, Plus, Search, Pencil, Trash2, X, Send, CheckCheck,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const STATUSES = [
  { value: 'DRAFT', label: 'Borrador', color: '#6B7280', bg: '#F3F4F6' },
  { value: 'SENT', label: 'Enviada', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'ACCEPTED', label: 'Aceptada', color: '#10B981', bg: '#ECFDF5' },
  { value: 'REJECTED', label: 'Rechazada', color: '#EF4444', bg: '#FEF2F2' },
  { value: 'EXPIRED', label: 'Expirada', color: '#F59E0B', bg: '#FFFBEB' },
]

const STATUS_FILTERS = [
  { value: '', label: 'Todos los estados' },
  ...STATUSES.map(s => ({ value: s.value, label: s.label })),
]

function formatCurrency(value) {
  if (!value && value !== 0) return '$0.00'
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calcTotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
}

const emptyItem = { description: '', quantity: 1, unit_price: 0 }

const emptyForm = {
  project: '', title: '', description: '', valid_until: '', notes: '', items: [{ ...emptyItem }],
}

export default function Proposals() {
  const [proposals, setProposals] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...emptyForm, items: [{ ...emptyItem }] })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async (params = {}) => {
    try {
      const [propRes, projRes] = await Promise.all([
        proposalsApi.getAll(params),
        projectsApi.getAll(),
      ])
      setProposals(propRes.data.results || propRes.data)
      setProjects(projRes.data.results || projRes.data)
    } catch {
      toast.error('Error al cargar propuestas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = proposals.filter(p => {
    const q = search.toLowerCase()
    return !search || p.title.toLowerCase().includes(q) || (p.project_name || '').toLowerCase().includes(q) || (p.client_name || '').toLowerCase().includes(q)
  })

  const applyFilters = () => {
    const params = {}
    if (filterStatus) params.status = filterStatus
    load(params)
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm, items: [{ ...emptyItem }] })
    setShowModal(true)
  }

  const openEdit = (proposal) => {
    setEditing(proposal)
    setFormData({
      project: proposal.project || '',
      title: proposal.title,
      description: proposal.description || '',
      valid_until: proposal.valid_until || '',
      notes: proposal.notes || '',
      items: proposal.items?.length ? proposal.items.map(i => ({ ...i })) : [{ ...emptyItem }],
    })
    setShowModal(true)
  }

  const handleAddItem = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }))
  }

  const handleRemoveItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const handleItemChange = (index, field, value) => {
    setFormData(prev => {
      const items = [...prev.items]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, items }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const validItems = formData.items.filter(i => i.description?.trim())
      if (!validItems.length) {
        toast.error('Agrega al menos un item con descripción')
        setSubmitting(false)
        return
      }

      const payload = {
        ...formData,
        items: validItems.map(i => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
        })),
      }

      if (editing) {
        await proposalsApi.update(editing.id, payload)
        toast.success('Propuesta actualizada!')
      } else {
        await proposalsApi.create(payload)
        toast.success('Propuesta creada!')
      }

      setShowModal(false)
      setEditing(null)
      await load()
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(', ')
        : 'Error al guardar propuesta'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await proposalsApi.delete(id)
      toast.success('Propuesta eliminada!')
      setDeleting(null)
      setProposals(p => p.filter(prop => prop.id !== id))
    } catch {
      toast.error('Error al eliminar propuesta')
    }
  }

  const handleMarkSent = async (id) => {
    try {
      await proposalsApi.markSent(id)
      toast.success('Propuesta marcada como enviada!')
      await load()
    } catch {
      toast.error('Error al marcar como enviada')
    }
  }

  const handleAccept = async (id) => {
    try {
      await proposalsApi.accept(id)
      toast.success('Propuesta aceptada! El proyecto pasó a Activo.')
      await load()
    } catch {
      toast.error('Error al aceptar propuesta')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-40 mb-6" />
        <div className="skeleton h-10 w-full mb-4 rounded-lg" />
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="card"><div className="skeleton h-6 w-full" /></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold">Propuestas</h2>
          <span className="text-sm text-gray-500">({proposals.length})</span>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Propuesta
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar propuesta, proyecto o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto">
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={applyFilters} className="btn btn-primary py-1.5 text-sm">Filtrar</button>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {proposals.length === 0 ? 'No hay propuestas todavía' : 'No se encontraron propuestas'}
          </p>
          {proposals.length === 0 && (
            <button onClick={openCreate} className="btn btn-primary">Crear primera propuesta</button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Propuesta</th>
                <th className="pb-3 font-medium">Proyecto</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Vence</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const status = STATUSES.find(s => s.value === p.status) || STATUSES[0]
                const isExpired = p.valid_until && dayjs(p.valid_until).isBefore(dayjs()) && p.status === 'DRAFT'
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{p.title}</td>
                    <td className="py-3 text-sm text-gray-600">{p.project_name || '—'}</td>
                    <td className="py-3 text-sm text-gray-600">{p.client_name || '—'}</td>
                    <td className="py-3 text-sm font-medium tabular-nums">{formatCurrency(p.total)}</td>
                    <td className="py-3 text-sm text-gray-500">
                      {p.valid_until ? dayjs(p.valid_until).format('DD/MM/YYYY') : '—'}
                      {isExpired && <span className="ml-1 text-red-500 text-xs">(vence)</span>}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'DRAFT' && (
                          <>
                            <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleMarkSent(p.id)} className="p-1.5 text-blue-400 hover:text-blue-600 rounded" title="Marcar enviada">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleAccept(p.id)} className="p-1.5 text-green-400 hover:text-green-600 rounded" title="Aceptar">
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {p.status === 'SENT' && (
                          <button onClick={() => handleAccept(p.id)} className="p-1.5 text-green-400 hover:text-green-600 rounded" title="Aceptar">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setDeleting(p)} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar" disabled={p.status === 'ACCEPTED'}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => !submitting && setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Propuesta' : 'Nueva Propuesta'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto *</label>
                <select
                  required
                  value={formData.project}
                  onChange={e => setFormData({ ...formData, project: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar proyecto</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name} {p.client_name ? `(${p.client_name})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="input"
                  placeholder="Ej: Rediseño de sitio web"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Alcance del proyecto (opcional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Válida hasta *</label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={e => setFormData({ ...formData, valid_until: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                  <input
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    placeholder="Notas internas (opcional)"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Items</label>
                  <button type="button" onClick={handleAddItem} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar item
                  </button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 bg-gray-50">
                        <th className="px-3 py-2 font-medium">Descripción</th>
                        <th className="px-3 py-2 font-medium w-20">Cant.</th>
                        <th className="px-3 py-2 font-medium w-28">Precio unit.</th>
                        <th className="px-3 py-2 font-medium w-24 text-right">Subtotal</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-1.5">
                            <input
                              value={item.description}
                              onChange={e => handleItemChange(i, 'description', e.target.value)}
                              className="input border-0 px-0 py-1 text-sm"
                              placeholder="Descripción del item"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.quantity}
                              onChange={e => handleItemChange(i, 'quantity', e.target.value)}
                              className="input border-0 px-0 py-1 text-sm text-center"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={e => handleItemChange(i, 'unit_price', e.target.value)}
                              className="input border-0 px-0 py-1 text-sm text-right tabular-nums"
                            />
                          </td>
                          <td className="px-3 py-1.5 text-sm text-right font-medium tabular-nums">
                            {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            {formData.items.length > 1 && (
                              <button type="button" onClick={() => handleRemoveItem(i)} className="text-gray-300 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 bg-gray-50">
                        <td colSpan={3} className="px-3 py-2 text-sm font-medium text-right">Total</td>
                        <td className="px-3 py-2 text-sm font-bold text-right tabular-nums">
                          {formatCurrency(calcTotal(formData.items))}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancelar</button>
                <button type="submit" disabled={submitting} className="btn btn-primary flex items-center gap-2">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editing ? 'Guardar cambios' : 'Crear propuesta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDeleting(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Eliminar propuesta</h3>
            <p className="text-gray-600 mb-6">
              ¿Eliminar <strong>{deleting.title}</strong> ({formatCurrency(deleting.total)})?
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
