import { Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggle } = useThemeStore()

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
      title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <Sun className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
      )}
    </button>
  )
}
