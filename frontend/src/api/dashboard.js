import api from './client'

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats/'),
  getRevenueChart: () => api.get('/dashboard/revenue-chart/'),
  getOverdueInvoices: () => api.get('/dashboard/overdue-invoices/'),
  getTopClients: () => api.get('/dashboard/top-clients/'),
  getPipelineValue: () => api.get('/dashboard/pipeline-value/'),
  getWinRate: () => api.get('/dashboard/win-rate/'),
  getAvgPaymentDays: () => api.get('/dashboard/avg-payment-days/'),
  getBillableRatio: () => api.get('/dashboard/billable-ratio/'),
}

export const searchApi = {
  search: (query) => api.get(`/search/?q=${encodeURIComponent(query)}`),
}