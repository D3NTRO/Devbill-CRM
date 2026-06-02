import { Loader2 } from 'lucide-react'

export default function LoadingState({ message = 'Cargando...' }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  )
}
