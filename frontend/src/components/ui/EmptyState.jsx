import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, message, action }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-600 mb-1">{title}</h3>
        {message && <p className="text-sm text-gray-400 mb-4">{message}</p>}
        {action}
      </div>
    </div>
  )
}
