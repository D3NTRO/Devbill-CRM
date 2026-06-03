import { useEffect, useState, useCallback } from 'react'
import { invoicesApi } from '../api/invoices'
import { clientsApi } from '../api/clients'
import {
  Receipt, Plus, Search, Pencil, Trash2, X, Send, CheckCheck,
  Loader2,
} from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'

const STATUSES = [
  { value: 'DRAFT', label: 'Borrador', color: '#6B7280', bg: '#F3F4F6' },
  { value: 'SENT', label: 'Enviada', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'PAID', label: 'Pagada', color: '#10B981', bg: '#ECFDF5' },
  { value: 'OVERDUE', label: 'Vencida', color: '#EF4444', bg: '#FEF2F2' },
  { value: 'CANCELLED', label: 'Cancelada', color: '#6B7280', bg: '#F3F4F6' },
]

const STATUS_FILTERS = [
  { value: '', label: 'Todos los estados' },
  ...STATUSES.map(s => ({ value: s.value, label: s.label })),
]

function formatCurrency(value) {
  if (!value && value !== 0) return '$0.00'
  return `$${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function calcSubtotal(items) {
  return items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
}

function calcTax(subtotal, rate) {
  return subtotal * (Number(rate) / 100)
}

function calcTotal(subtotal, tax) {
  return subtotal + tax
}

const emptyItem = { description: '', quantity: 1, unit_price: 0 }

const emptyForm = {
  client: '', issue_date: dayjs().format('YYYY-MM-DD'), due_date: dayjs().add(30, 'day').format('YYYY-MM-DD'),
  tax_rate: 0, notes: '', items: [{ ...emptyItem }],
}

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({ ...emptyForm, items: [{ ...emptyItem }] })
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async (params = {}) => {
    try {
      const [invRes, cliRes] = await Promise.all([
        invoicesApi.getAll(params),
        clientsApi.getAll(),
      ])
      setInvoices(invRes.data.results || invRes.data)
      setClients(cliRes.data.results || cliRes.data)
    } catch {
      toast.error('Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase()
    return !search ||
      inv.number?.toLowerCase().includes(q) ||
      (inv.client_name || '').toLowerCase().includes(q)
  })

  const applyFilters = () => {
    const params = {}
    if (filterStatus) params.status = filterStatus
    if (filterClient) params.client = filterClient
    load(params)
  }

  const totals = {
    total: invoices.reduce((s, inv) => s + Number(inv.total || 0), 0),
    pending: invoices.filter(inv => ['DRAFT', 'SENT'].includes(inv.status)).reduce((s, inv) => s + Number(inv.total || 0), 0),
    paid: invoices.filter(inv => inv.status === 'PAID').reduce((s, inv) => s + Number(inv.total || 0), 0),
    overdue: invoices.filter(inv => inv.status === 'OVERDUE').reduce((s, inv) => s + Number(inv.total || 0), 0),
  }

  const openCreate = () => {
    setEditing(null)
    setFormData({ ...emptyForm, items: [{ ...emptyItem }] })
    setShowModal(true)
  }

  const openEdit = (invoice) => {
    setEditing(invoice)
    setFormData({
      client: invoice.client || '',
      issue_date: invoice.issue_date || '',
      due_date: invoice.due_date || '',
      tax_rate: Number(invoice.tax_rate) || 0,
      notes: invoice.notes || '',
      items: invoice.items?.length ? invoice.items.map(i => ({ description: i.description, quantity: Number(i.quantity), unit_price: Number(i.unit_price) })) : [{ ...emptyItem }],
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

  const formSubtotal = calcSubtotal(formData.items)
  const formTax = calcTax(formSubtotal, formData.tax_rate)
  const formTotal = calcTotal(formSubtotal, formTax)

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
        client: formData.client,
        issue_date: formData.issue_date,
        due_date: formData.due_date,
        tax_rate: Number(formData.tax_rate) || 0,
        notes: formData.notes,
        items: validItems.map(i => ({
          description: i.description,
          quantity: Number(i.quantity) || 1,
          unit_price: Number(i.unit_price) || 0,
        })),
      }

      if (editing) {
        await invoicesApi.update(editing.id, payload)
        toast.success('Factura actualizada!')
      } else {
        await invoicesApi.create(payload)
        toast.success('Factura creada!')
      }

      setShowModal(false)
      setEditing(null)
      await load()
    } catch (error) {
      const msg = error?.response?.data
        ? Object.values(error.response.data).flat().join(', ')
        : 'Error al guardar factura'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await invoicesApi.delete(id)
      toast.success('Factura eliminada!')
      setDeleting(null)
      setInvoices(p => p.filter(inv => inv.id !== id))
    } catch {
      toast.error('Error al eliminar factura')
    }
  }

  const handleMarkSent = async (id) => {
    try {
      await invoicesApi.markSent(id)
      toast.success('Factura marcada como enviada!')
      await load()
    } catch {
      toast.error('Error al marcar como enviada')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await invoicesApi.markPaid(id)
      toast.success('Factura marcada como pagada!')
      await load()
    } catch {
      toast.error('Error al marcar como pagada')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-8 w-40 mb-6" />
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-lg" />)}
        </div>
        <div className="skeleton h-10 w-full mb-4 rounded-lg" />
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="card"><div className="skeleton h-6 w-full" /></div>)}</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Receipt className="w-6 h-6 text-indigo-600" />
          <h2 className="text-xl font-semibold">Facturas</h2>
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>({invoices.length})</span>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nueva Factura
        </button>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold">{formatCurrency(totals.total)}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Total facturado</p>
        </div>
        <div className="card text-center" style={{ border: '1px solid', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totals.pending)}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pendiente</p>
        </div>
        <div className="card text-center" style={{ border: '1px solid', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totals.paid)}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Pagado</p>
        </div>
        <div className="card text-center" style={{ border: '1px solid', borderColor: 'var(--border)' }}>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.overdue)}</p>
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Vencido</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por número o cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto">
          {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="input w-auto">
          <option value="">Todos los clientes</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={applyFilters} className="btn btn-primary py-1.5 text-sm">Filtrar</button>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Receipt className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-muted)' }} />
          <p style={{ color: 'var(--text-secondary)' }} className="mb-4">
            {invoices.length === 0 ? 'No hay facturas todavía' : 'No se encontraron facturas'}
          </p>
          {invoices.length === 0 && (
            <button onClick={openCreate} className="btn btn-primary">Crear primera factura</button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm border-b" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-3 font-medium">Número</th>
                <th className="pb-3 font-medium">Cliente</th>
                <th className="pb-3 font-medium">Emisión</th>
                <th className="pb-3 font-medium">Vencimiento</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Estado</th>
                <th className="pb-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => {
                const status = STATUSES.find(s => s.value === inv.status) || STATUSES[0]
                const isOverdue = inv.status !== 'PAID' && inv.status !== 'CANCELLED' && inv.due_date && dayjs(inv.due_date).isBefore(dayjs())
                return (
                  <tr key={inv.id} className={`border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isOverdue ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`} style={{ borderColor: 'var(--border)' }}>
                    <td className="py-3 font-medium tabular-nums" style={{ color: 'var(--text)' }}>{inv.number}</td>
                    <td className="py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.client_name || '—'}</td>
                    <td className="py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{inv.issue_date ? dayjs(inv.issue_date).format('DD/MM/YYYY') : '—'}</td>
                    <td className="py-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {inv.due_date ? dayjs(inv.due_date).format('DD/MM/YYYY') : '—'}
                      {isOverdue && <span className="ml-1 text-red-500 text-xs">(vencida)</span>}
                    </td>
                    <td className="py-3 text-sm font-medium tabular-nums">{formatCurrency(inv.total)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full font-medium" style={{ backgroundColor: status.bg, color: status.color }}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {['DRAFT', 'OVERDUE'].includes(inv.status) && (
                          <>
                            <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-indigo-600 rounded" title="Editar">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleMarkSent(inv.id)} className="p-1.5 text-blue-400 hover:text-blue-600 rounded" title="Marcar enviada">
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {['DRAFT', 'SENT', 'OVERDUE'].includes(inv.status) && (
                          <button onClick={() => handleMarkPaid(inv.id)} className="p-1.5 text-green-400 hover:text-green-600 rounded" title="Marcar pagada">
                            <CheckCheck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {inv.status !== 'PAID' && (
                          <button onClick={() => setDeleting(inv)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 rounded" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
          <div className="rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--surface)' }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{editing ? 'Editar Factura' : 'Nueva Factura'}</h3>
              <button onClick={() => setShowModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Cliente *</label>
                <select
                  required
                  value={formData.client}
                  onChange={e => setFormData({ ...formData, client: e.target.value })}
                  className="input"
                >
                  <option value="">Seleccionar cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha emisión *</label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date}
                    onChange={e => setFormData({ ...formData, issue_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Fecha vencimiento *</label>
                  <input
                    type="date"
                    required
                    value={formData.due_date}
                    onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">IVA (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.tax_rate}
                    onChange={e => setFormData({ ...formData, tax_rate: e.target.value })}
                    className="input"
                    placeholder="21"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Notas</label>
                  <input
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    className="input"
                    placeholder="Notas (opcional)"
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Items</label>
                  <button type="button" onClick={handleAddItem} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Agregar item
                  </button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs border-b" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--surface)' }}>
                        <th className="px-3 py-2 font-medium">Descripción</th>
                        <th className="px-3 py-2 font-medium w-20">Cant.</th>
                        <th className="px-3 py-2 font-medium w-28">Precio unit.</th>
                        <th className="px-3 py-2 font-medium w-24 text-right">Subtotal</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
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
                              step="0.01"
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
                              <button type="button" onClick={() => handleRemoveItem(i)} className="text-gray-300 dark:text-gray-600 hover:text-red-500">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                        <td colSpan={3} className="px-3 py-2 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>Subtotal</td>
                        <td className="px-3 py-2 text-sm font-medium text-right tabular-nums">{formatCurrency(formSubtotal)}</td>
                        <td></td>
                      </tr>
                      <tr style={{ backgroundColor: 'var(--surface)' }}>
                        <td colSpan={3} className="px-3 py-1 text-sm text-right" style={{ color: 'var(--text-secondary)' }}>IVA ({Number(formData.tax_rate) || 0}%)</td>
                        <td className="px-3 py-1 text-sm text-right tabular-nums">{formatCurrency(formTax)}</td>
                        <td></td>
                      </tr>
                      <tr className="border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
                        <td colSpan={3} className="px-3 py-2 text-sm font-bold text-right">Total</td>
                        <td className="px-3 py-2 text-sm font-bold text-right tabular-nums">{formatCurrency(formTotal)}</td>
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
                  {editing ? 'Guardar cambios' : 'Crear factura'}
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
            <h3 className="text-lg font-semibold mb-2">Eliminar factura</h3>
            <p style={{ color: 'var(--text-secondary)' }} className="mb-6">
              ¿Eliminar <strong>{deleting.number}</strong> ({formatCurrency(deleting.total)})?
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
