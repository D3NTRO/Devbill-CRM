import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogoHorizontal } from '../components/brand/Logo'
import toast from 'react-hot-toast'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const { register, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden')
      return
    }
    const result = await register(formData.email, formData.password, formData.firstName, formData.lastName)
    if (result.success) {
      toast.success('Cuenta creada!')
      navigate('/')
    } else {
      toast.error(typeof result.error === 'object' ? JSON.stringify(result.error) : result.error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-md w-full p-8 rounded-2xl shadow-lg dark:shadow-2xl" style={{ backgroundColor: 'var(--surface)' }}>
        <div className="text-center mb-8 flex flex-col items-center">
          <LogoHorizontal size={40} showTagline className="mb-2" />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Crea tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Nombre</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Apellido</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Confirmar Password</label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="input"
              required
            />
          </div>
          <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>
        <p className="text-center mt-6" style={{ color: 'var(--text-secondary)' }}>
          Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            Ingresa
          </Link>
        </p>
      </div>
    </div>
  )
}