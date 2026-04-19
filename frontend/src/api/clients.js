import api from './client'

export const clientsApi = {
  getAll: () => api.get('/clients/'),
  getOne: (id) => api.get(`/clients/${id}/`),
  create: (data) => api.post('/clients/', data),
  update: (id, data) => api.patch(`/clients/${id}/`, data),
  delete: (id) => api.delete(`/clients/${id}/`),
  getSummary: (id) => api.get(`/clients/${id}/summary/`),
  getActivity: (id) => api.get(`/clients/${id}/activity/`),
  addNote: (id, note) => api.post(`/clients/${id}/notes/`, { note }),
  setTags: (id, tagIds) => api.post(`/clients/${id}/tags/`, { tag_ids: tagIds }),
}

export const tagsApi = {
  getAll: () => api.get('/clients/tags/'),
  create: (data) => api.post('/clients/tags/', data),
  update: (id, data) => api.patch(`/clients/tags/${id}/`, data),
  delete: (id) => api.delete(`/clients/tags/${id}/`),
}