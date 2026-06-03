import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Suspense, lazy, useEffect, useState } from 'react'
import TimerWidget from './components/timer/TimerWidget'
import { LogoHorizontal } from './components/brand/Logo'
import ThemeToggle from './components/ui/ThemeToggle'
import { useAuthStore } from './store/authStore'
import { useTimerStore } from './store/timerStore'
import { projectsApi } from './api/projects'
import {
  LayoutDashboard, Users, Kanban, FolderKanban, ListTodo, Clock, FileText, Receipt, Menu, X,
} from 'lucide-react'

const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Clients = lazy(() => import('./pages/Clients'))
const ClientDetail = lazy(() => import('./pages/ClientDetail'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const Projects = lazy(() => import('./pages/Projects'))
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'))
const Tasks = lazy(() => import('./pages/Tasks'))
const TimeTracker = lazy(() => import('./pages/TimeTracker'))
const Proposals = lazy(() => import('./pages/Proposals'))
const Invoices = lazy(() => import('./pages/Invoices'))
const NotFound = lazy(() => import('./pages/NotFound'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] p-6">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  return children
}

function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  const { fetchRunning, isRunning } = useTimerStore()
  const [projects, setProjects] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const isTimeTracker = location.pathname === '/time-tracker'

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
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <header className="px-4 md:px-6 py-4" style={{ backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden" style={{ color: 'var(--text-secondary)' }}>
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <LogoHorizontal size={28} />
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            {(!isTimeTracker || isRunning) && <TimerWidget projects={projects} />}
            <span className="text-sm md:text-base hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>Hola, {user?.first_name || 'Usuario'}</span>
            <ThemeToggle />
            <button onClick={logout} className="text-sm" style={{ color: 'var(--text-muted)' }}>Salir</button>
          </div>
        </div>
      </header>
      <div className="flex relative">
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64
          min-h-[calc(100vh-73px)] p-4 transform transition-transform duration-200
          border-r
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `} style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <nav className="space-y-1 pt-14 lg:pt-0">
            {navItems.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'font-medium'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                style={({ isActive }) => ({
                  backgroundColor: isActive ? 'var(--primary)' : undefined,
                  color: isActive ? '#fff' : 'var(--text)',
                })}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="flex-1 min-w-0">
          <Suspense fallback={<PageLoader />}>
            {children}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <AppLayout><Clients /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients/:id" element={
            <ProtectedRoute>
              <AppLayout><ClientDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/pipeline" element={
            <ProtectedRoute>
              <AppLayout><Pipeline /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <AppLayout><Projects /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/projects/:id" element={
            <ProtectedRoute>
              <AppLayout><ProjectDetail /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <AppLayout><Tasks /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/time-tracker" element={
            <ProtectedRoute>
              <AppLayout><TimeTracker /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/proposals" element={
            <ProtectedRoute>
              <AppLayout><Proposals /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <AppLayout><Invoices /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
