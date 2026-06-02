import api from './client'

export const invoicesApi = {
  getAll: (params = {}) => api.get('/invoices/', { params }),
  getOne: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  delete: (id) => api.delete(`/invoices/${id}/`),
  getPdf: (id) => api.get(`/invoices/${id}/pdf/`),
  markSent: (id) => api.post(`/invoices/${id}/mark_sent/`),
  markPaid: (id) => api.post(`/invoices/${id}/mark_paid/`),
  fromProject: (projectId) => api.post(`/invoices/${projectId}/from_project/`),
}
