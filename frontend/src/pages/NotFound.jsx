import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: 'var(--text-muted)' }}>404</h1>
        <p className="text-xl mb-6" style={{ color: 'var(--text-secondary)' }}>Página no encontrada</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Home className="w-4 h-4" />
          Volver al Dashboard
        </Link>
      </div>
    </div>
  )
}
