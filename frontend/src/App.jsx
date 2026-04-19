import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" />
  return children
}

function AppLayout({ children }) {
  const { user, logout } = useAuthStore()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">DevBill</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Hola, {user?.first_name || 'Usuario'}</span>
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] p-4">
          <nav className="space-y-1">
            <a href="/" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Dashboard
            </a>
            <a href="/clients" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Clientes
            </a>
            <a href="/projects" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Proyectos
            </a>
            <a href="/tasks" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Tareas
            </a>
            <a href="/time-tracker" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Tiempo
            </a>
            <a href="/proposals" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Propuestas
            </a>
            <a href="/invoices" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Facturas
            </a>
            <a href="/analytics" className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
              Analytics
            </a>
          </nav>
        </aside>
        <main className="flex-1">
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
      </Routes>
    </BrowserRouter>
  )
}

export default App