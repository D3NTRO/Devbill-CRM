import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../api/client'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/login/', { email, password })
          const { access, refresh, user } = response.data
          set({ user, token: access, refreshToken: refresh, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.response?.data?.detail || 'Login failed' }
        }
      },

      register: async (email, password, firstName, lastName) => {
        set({ isLoading: true })
        try {
          const response = await api.post('/auth/register/', {
            email,
            password,
            first_name: firstName,
            last_name: lastName,
          })
          const { access, refresh, user } = response.data
          set({ user, token: access, refreshToken: refresh, isLoading: false })
          return { success: true }
        } catch (error) {
          set({ isLoading: false })
          return { success: false, error: error.response?.data || 'Registration failed' }
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null })
      },

      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },

      checkAuth: async () => {
        const { token } = get()
        if (!token) return
        try {
          const response = await api.get('/auth/me/')
          set({ user: response.data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'devbill-auth',
      partialize: (state) => ({ token: state.token, refreshToken: state.refreshToken, user: state.user }),
    }
  )
)