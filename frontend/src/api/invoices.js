import api from './client'

export const invoicesApi = {
  getAll: () => api.get('/invoices/'),
  getOne: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  delete: (id) => api.delete(`/invoices/${id}/`),
  getPdf: (id) => api.get(`/invoices/${id}/pdf/`, { responseType: 'blob' }),
  markSent: (id) => api.post(`/invoices/${id}/mark_sent/`),
  markPaid: (id) => api.post(`/invoices/${id}/mark_paid/`),
  fromProject: (projectId) => api.post(`/invoices/from-project/${projectId}/`),
}