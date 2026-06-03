import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { clientsApi } from '../api/clients'
import { projectsApi } from '../api/projects'
import { ArrowLeft, Mail, Phone, Building, MapPin, FileText, Clock, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import 'dayjs/locale/es'

dayjs.locale('es')

export default function ClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [summary, setSummary] = useState(null)
  const [activity, setActivity] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')

  const fetchData = useCallback(async () => {
    try {
      const [clientRes, summaryRes, activityRes, projectsRes] = await Promise.all([
        clientsApi.getOne(id),
        clientsApi.getSummary(id),
        clientsApi.getActivity(id),
        projectsApi.getAll(),
      ])
      setClient(clientRes.data)
      setSummary(summaryRes.data)
      setActivity(activityRes.data)
      setProjects(projectsRes.data.results?.filter(p => (p.client?.toString() === id || p.client?.id === id)) || [])
    } catch (error) {
      toast.error('Error al cargar cliente')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!note.trim()) return
    try {
      await clientsApi.addNote(id, note)
      setNote('')
      fetchData()
      toast.success('Nota agregada!')
    } catch (error) {
      toast.error('Error al agregar nota')
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="skeleton h-5 w-32 mb-6 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="skeleton h-8 w-48 mb-2" />
              <div className="skeleton h-4 w-32 mb-4" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>
          <div className="space-y-6">
            <div className="card">
              <div className="skeleton h-5 w-20 mb-4" />
              <div className="space-y-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return <div className="p-6 text-center" style={{ color: 'var(--text-secondary)' }}>Cliente no encontrado</div>
  }

  return (
    <div className="p-6">
      <Link to="/clients" className="flex items-center gap-2 mb-6" style={{ color: 'var(--text-secondary)' }}>
        <ArrowLeft className="w-4 h-4" /> Volver a Clientes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{client.name}</h1>
                {client.company && (
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <Building className="w-4 h-4" /> {client.company}
                  </p>
                )}
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                client.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {client.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {client.email && (
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Mail className="w-4 h-4" /> {client.email}
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                  <Phone className="w-4 h-4" /> {client.phone}
                </div>
              )}
              {client.address && (
                <div className="flex items-center gap-2 col-span-2" style={{ color: 'var(--text-secondary)' }}>
                  <MapPin className="w-4 h-4" /> {client.address}
                </div>
              )}
            </div>

            {client.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                {client.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 text-sm rounded-full"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}

            {client.notes && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <h3 className="font-medium mb-2">Notas</h3>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{client.notes}</p>
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Proyectos ({projects.length})</h2>
            {projects.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">No hay proyectos</p>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="block p-3 rounded-lg"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.name}</p>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{project.client_name}</p>
                      </div>
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: project.color + '20', color: project.color }}
                      >
                        {project.pipeline_stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="font-semibold mb-4">Actividad Reciente</h2>
            
            <form onSubmit={handleAddNote} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Agregar una nota..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input flex-1"
                />
                <button type="submit" className="btn btn-primary">
                  Agregar
                </button>
              </div>
            </form>

            {activity.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm">No hay actividad</p>
            ) : (
              <div className="space-y-3">
                {activity.map((item) => (
                  <div key={item.id} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 mt-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div>
                      <p>{item.description}</p>
                      <p style={{ color: 'var(--text-muted)' }} className="text-xs">
                        {dayjs(item.created_at).format('MMM D, YYYY h:mm A')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold mb-4">Resumen</h3>
              <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Proyectos
                </span>
                <span className="font-semibold">{summary?.total_projects || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Horas
                </span>
                <span className="font-semibold">{summary?.total_hours || 0}h</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--text-secondary)' }} className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Facturado
                </span>
                <span className="font-semibold">
                  {client.currency} {summary?.total_invoiced?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Pagado</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {client.currency} {summary?.total_paid?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-2">Información</h3>
            <div className="text-sm space-y-2" style={{ color: 'var(--text-secondary)' }}>
              <p>Creado: {dayjs(client.created_at).format('D MMM YYYY')}</p>
              {client.tax_id && <p>CUIT/RUT: {client.tax_id}</p>}
              <p>Moneda: {client.currency}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}