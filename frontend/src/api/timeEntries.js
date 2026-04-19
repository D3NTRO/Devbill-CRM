import api from './client'

export const timeEntriesApi = {
  getAll: () => api.get('/time-entries/'),
  getOne: (id) => api.get(`/time-entries/${id}/`),
  create: (data) => api.post('/time-entries/', data),
  update: (id, data) => api.patch(`/time-entries/${id}/`, data),
  delete: (id) => api.delete(`/time-entries/${id}/`),
  start: (projectId, description = '') => 
    api.post('/time-entries/start/', { project_id: projectId, description }),
  stop: (entryId = null) => 
    api.post('/time-entries/stop/', { entry_id: entryId }),
  getRunning: () => api.get('/time-entries/running/'),
}