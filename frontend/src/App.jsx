import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Pipeline from './pages/Pipeline'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Tasks from './pages/Tasks'
import TimeTracker from './pages/TimeTracker'
import Proposals from './pages/Proposals'
import Invoices from './pages/Invoices'
import NotFound from './pages/NotFound'
import TimerWidget from './components/timer/TimerWidget'
import { useAuthStore } from './store/authStore'
import { useTimerStore } from './store/timerStore'
import { projectsApi } from './api/projects'
import {
  LayoutDashboard, Users, Kanban, FolderKanban, ListTodo, Clock, FileText, Receipt, Menu, X,
} from 'lucide-react'

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  return children
}

function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const { fetchRunning } = useTimerStore()
  const [projects, setProjects] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    fetchRunning()
    projectsApi.getAll().then(res => {
      setProjects(res.data.results || res.data)
    }).catch(() => {})
  }, [fetchRunning])

  const navItems = [
    { to: '/', end: true, icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clients', icon: Users, label: 'Clientes' },
    { to: '/projects', icon: FolderKanban, label: 'Proyectos' },
    { to: '/pipeline', icon: Kanban, label: 'Pipeline' },
    { to: '/tasks', icon: ListTodo, label: 'Tareas' },
    { to: '/time-tracker', icon: Clock, label: 'Time Tracker' },
    { to: '/proposals', icon: FileText, label: 'Propuestas' },
    { to: '/invoices', icon: Receipt, label: 'Facturas' },
  ]
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-gray-500 hover:text-gray-700">
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-indigo-600">DevBill</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <TimerWidget projects={projects} />
            <span className="text-sm md:text-base text-gray-600 hidden sm:inline">Hola, {user?.first_name || 'Usuario'}</span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="flex relative">
        {/* Mobile overlay */}
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 
          min-h-[calc(100vh-73px)] p-4 transform transition-transform duration-200
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="space-y-1 pt-14 lg:pt-0">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`
                }
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute>
            <AppLayout>
              <Clients />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/clients/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <ClientDetail />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/pipeline" element={
          <ProtectedRoute>
            <AppLayout>
              <Pipeline />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/projects" element={
          <ProtectedRoute>
            <AppLayout>
              <Projects />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/projects/:id" element={
          <ProtectedRoute>
            <AppLayout>
              <ProjectDetail />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute>
            <AppLayout>
              <Tasks />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/time-tracker" element={
          <ProtectedRoute>
            <AppLayout>
              <TimeTracker />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/proposals" element={
          <ProtectedRoute>
            <AppLayout>
              <Proposals />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="/invoices" element={
          <ProtectedRoute>
            <AppLayout>
              <Invoices />
            </AppLayout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App