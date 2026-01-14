import api from '../lib/axios'

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats')
    return response.data
  },

  getLines: async () => {
    const response = await api.get('/dashboard/lines')
    return response.data
  },

  getBatches: async () => {
    const response = await api.get('/dashboard/batches')
    return response.data
  },

  getRecentProducts: async () => {
    const response = await api.get('/dashboard/products')
    return response.data
  },

  getComparisonData: async (period) => {
    const response = await api.get(`/dashboard/comparison?period=${period}`)
    return response.data
  },

  getAlertsByDate: async () => {
    const response = await api.get('/dashboard/alerts-calendar')
    return response.data
  },

  getTesterComparisons: async () => {
    const response = await api.get('/dashboard/tester-comparisons')
    return response.data
  }
}

