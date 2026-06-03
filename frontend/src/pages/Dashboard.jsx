import { useEffect, useState } from 'react'
import { dashboardApi } from '../api/dashboard'
import { Link } from 'react-router-dom'
import { useThemeStore } from '../store/themeStore'
import {
  Users, FolderKanban, Clock, DollarSign, Receipt, ListTodo,
  BarChart3, TrendingUp, Target, Calendar, AlertTriangle,
  RefreshCw, Star, CheckCircle2, Timer,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dec']

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmtHours = (n) => Number(n).toFixed(1)

const statItems = [
  { key: 'clients', label: 'Clientes Activos', icon: Users, color: 'bg-blue-500', link: '/clients' },
  { key: 'projects', label: 'Proyectos', icon: FolderKanban, color: 'bg-purple-500', link: '/projects' },
  { key: 'hours', label: 'Horas este mes', icon: Clock, color: 'bg-green-500', format: (v) => fmtHours(v) + 'h' },
  { key: 'revenue', label: 'Ingresos este mes', icon: DollarSign, color: 'bg-yellow-500', format: fmt },
  { key: 'pending_invoices', label: 'Facturas Pendientes', icon: Receipt, color: 'bg-orange-500', link: '/invoices' },
  { key: 'tasks_pending', label: 'Tareas Pendientes', icon: ListTodo, color: 'bg-indigo-500', link: '/tasks' },
]

const PIPELINE_COLORS = { LEAD: '#93C5FD', PROPOSAL: '#A78BFA', NEGOTIATION: '#F472B6', ACTIVE: '#34D399', COMPLETED: '#10B981', BILLED: '#6366F1' }
const PIPELINE_ORDER = ['LEAD', 'PROPOSAL', 'NEGOTIATION', 'ACTIVE', 'COMPLETED', 'BILLED']

function StatCardSkeleton() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-9 w-9 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-20" />
    </div>
  )
}

export default function Dashboard() {
  const { theme } = useThemeStore()
  const isDark = theme === 'dark'
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [stats, revenue, overdue, topClients, pipeline, winRate, avgDays, billableRatio] = await Promise.all([
        dashboardApi.getStats().then(r => r.data).catch(() => null),
        dashboardApi.getRevenueChart().then(r => r.data).catch(() => null),
        dashboardApi.getOverdueInvoices().then(r => r.data).catch(() => null),
        dashboardApi.getTopClients().then(r => r.data).catch(() => null),
        dashboardApi.getPipelineValue().then(r => r.data).catch(() => null),
        dashboardApi.getWinRate().then(r => r.data).catch(() => null),
        dashboardApi.getAvgPaymentDays().then(r => r.data).catch(() => null),
        dashboardApi.getBillableRatio().then(r => r.data).catch(() => null),
      ])
      setData({ stats, revenue, overdue, topClients, pipeline, winRate, avgDays, billableRatio })
      if (!stats && !revenue && !overdue) setError('No se pudieron cargar los datos')
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAll() }, [])

  const { stats, revenue, overdue, topClients, pipeline, winRate, avgDays, billableRatio } = data

  if (error && !stats) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Algo salió mal</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
            <button onClick={loadAll} className="btn btn-primary inline-flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Dashboard</h2>
        {loading ? (
          <div className="skeleton h-8 w-24 rounded-lg" />
        ) : (
          <button onClick={loadAll} className="btn btn-secondary text-sm inline-flex items-center gap-1.5" title="Actualizar">
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          statItems.map(item => {
            const raw = stats?.[item.key]
            const val = item.format ? item.format(raw) : (raw ?? 0)
            return (
              <div key={item.key} className="card relative overflow-hidden">
                {item.link ? (
                  <Link to={item.link} className="absolute inset-0 z-10" aria-label={item.label} />
                ) : null}
                <div className="flex items-center justify-between mb-3 relative z-0">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{item.label}</span>
                  <div className={`p-2 rounded-lg ${item.color}`}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">{val}</p>
              </div>
            )
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Ingresos Mensuales
          </h3>
          {loading ? (
            <div className="skeleton h-64 w-full rounded" />
          ) : !revenue || revenue.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
              Sin datos de ingresos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenue.map(r => ({ ...r, month: MONTHS[parseInt(r.month.split('-')[1]) - 1] || r.month }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={isDark ? '#6B7280' : '#9ca3af'} />
                <YAxis tick={{ fontSize: 12 }} stroke={isDark ? '#6B7280' : '#9ca3af'} tickFormatter={v => '$' + (v / 1000).toFixed(0) + 'k'} />
                <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} formatter={(val) => [fmt(val), 'Ingresos']} />
                <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline Value */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <TrendingUp className="w-4 h-4 text-purple-500" />
            Pipeline
          </h3>
          {loading ? (
            <div className="skeleton h-64 w-full rounded" />
          ) : !pipeline || Object.values(pipeline).every(s => s.count === 0) ? (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-gray-500 text-sm">
              Sin proyectos en pipeline
            </div>
          ) : (
            <div className="space-y-4">
              {PIPELINE_ORDER.map(stage => {
                const s = pipeline[stage]
                if (!s || s.count === 0) return null
                const maxVal = Math.max(...PIPELINE_ORDER.map(k => pipeline[k]?.value || 0)) || 1
                const pct = Math.max(4, (s.value / maxVal) * 100)
                return (
                  <div key={stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">{s.label}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100">{fmt(s.value)} ({s.count})</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: PIPELINE_COLORS[stage] }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top Clients */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Star className="w-4 h-4 text-yellow-500" />
            Top Clientes
          </h3>
          {loading ? (
            <div className="skeleton h-48 w-full rounded" />
          ) : !topClients || topClients.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
              Sin clientes con facturación
            </div>
          ) : (
            <div className="space-y-3">
              {topClients.slice(0, 5).map(c => {
                const pct = (c.total / topClients[0].total) * 100
                return (
                  <Link key={c.id} to={`/clients/${c.id}`} className="block group">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{c.name}</span>
                      <span className="font-medium text-gray-800 dark:text-gray-100 ml-2 flex-shrink-0">{fmt(c.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-yellow-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Overdue Invoices */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
            Facturas Vencidas
          </h3>
          {loading ? (
            <div className="skeleton h-48 w-full rounded" />
          ) : !overdue || overdue.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 dark:text-gray-500 text-sm">
              <div className="text-center">
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                No hay facturas vencidas
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {overdue.slice(0, 5).map(inv => (
                <div key={inv.id} className="block cursor-default">
                  <div className="flex items-center justify-between p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{inv.number}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{inv.client}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-sm font-semibold text-red-600 dark:text-red-400">{fmt(inv.total)}</p>
                      <p className="text-xs text-red-500 dark:text-red-400">{inv.days_overdue}d vencido</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* KPIs */}
        <div className="card">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-100">
            <Target className="w-4 h-4 text-green-500" />
            Indicadores
          </h3>
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="skeleton h-16 w-full rounded" />)}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Win Rate */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Win Rate</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {winRate ? `${winRate.rate}% (${winRate.accepted}/${winRate.total})` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Avg Payment Days */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pago Promedio</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {avgDays ? `${avgDays.average_days} días` : '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Billable Ratio */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Timer className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Horas Facturables</p>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      {billableRatio ? `${billableRatio.ratio}% (${fmtHours(billableRatio.billable_hours)}/${fmtHours(billableRatio.total_hours)}h)` : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
