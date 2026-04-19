import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { BarChart3, Users, FolderKanban, Clock, FileText, DollarSign } from 'lucide-react'

export default function Dashboard() {
  const { user, checkAuth } = useAuthStore()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const statCards = [
    { label: 'Clientes Activos', value: stats?.clients || 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Proyectos', value: stats?.projects || 0, icon: FolderKanban, color: 'bg-purple-500' },
    { label: 'Horas este mes', value: stats?.hours || 0, icon: Clock, color: 'bg-green-500' },
    { label: 'Ingresos', value: `$${stats?.revenue || 0}`, icon: DollarSign, color: 'bg-yellow-500' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">DevBill</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hola, {user?.first_name || 'Usuario'}</span>
          </div>
        </div>
      </header>

      <main className="p-6">
        <h2 className="text-xl font-semibold mb-6">Dashboard</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">{stat.label}</span>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Actividad Reciente
            </h3>
            <p className="text-gray-500 text-sm">No hay actividad reciente</p>
          </div>
          <div className="card">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Pendientes
            </h3>
            <p className="text-gray-500 text-sm">No hay pendientes</p>
          </div>
        </div>
      </main>
    </div>
  )
}