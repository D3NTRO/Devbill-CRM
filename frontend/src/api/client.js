import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.defaults.xsrfCookieName = 'csrftoken'
api.defaults.xsrfHeaderName = 'X-CSRFToken'

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devbill-auth')
    if (token) {
      const parsed = JSON.parse(token)
      if (parsed.state?.token) {
        config.headers.Authorization = `Bearer ${parsed.state.token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const token = localStorage.getItem('devbill-auth')
        if (token) {
          const parsed = JSON.parse(token)
          const refreshToken = parsed.state?.refreshToken
          if (refreshToken) {
            const response = await axios.post(`${api.defaults.baseURL}/auth/refresh/`, {
              refresh: refreshToken,
            })
            const { access } = response.data
            parsed.state.token = access
            localStorage.setItem('devbill-auth', JSON.stringify(parsed))
            originalRequest.headers.Authorization = `Bearer ${access}`
            return api(originalRequest)
          }
        }
      } catch (refreshError) {
        localStorage.removeItem('devbill-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api