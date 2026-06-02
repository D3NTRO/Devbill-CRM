import api from './client'

export const proposalsApi = {
  getAll: (params = {}) => api.get('/proposals/', { params }),
  getOne: (id) => api.get(`/proposals/${id}/`),
  create: (data) => api.post('/proposals/', data),
  update: (id, data) => api.patch(`/proposals/${id}/`, data),
  delete: (id) => api.delete(`/proposals/${id}/`),
  getPdf: (id) => api.get(`/proposals/${id}/pdf/`),
  markSent: (id) => api.post(`/proposals/${id}/mark_sent/`),
  accept: (id) => api.post(`/proposals/${id}/accept/`),
}
