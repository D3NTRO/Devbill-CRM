import api from './client'

export const tasksApi = {
  getAll: () => api.get('/tasks/'),
  getById: (id) => api.get(`/tasks/${id}/`),
  create: (data) => api.post('/tasks/', data),
  update: (id, data) => api.patch(`/tasks/${id}/`, data),
  delete: (id) => api.delete(`/tasks/${id}/`),
}
