import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Página no encontrada</p>
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
