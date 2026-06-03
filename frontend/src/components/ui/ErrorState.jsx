import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message = 'Error al cargar los datos', onRetry }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-1">Algo salió mal</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        )}
      </div>
    </div>
  )
}
