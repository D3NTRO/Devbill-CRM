import api from './client'

export const projectsApi = {
  getAll: () => api.get('/projects/'),
  getOne: (id) => api.get(`/projects/${id}/`),
  create: (data) => api.post('/projects/', data),
  update: (id, data) => api.patch(`/projects/${id}/`, data),
  delete: (id) => api.delete(`/projects/${id}/`),
  getTimeEntries: (id) => api.get(`/projects/${id}/time_entries/`),
  getUnbilledHours: (id) => api.get(`/projects/${id}/unbilled_hours/`),
}

export const pipelineApi = {
  get: () => api.get('/projects/pipeline/'),
  move: (id, stage) => api.patch(`/projects/pipeline/${id}/move/`, { pipeline_stage: stage }),
  reorder: (projectIds) => api.post('/projects/pipeline/reorder/', { projects: projectIds }),
}