import api from '../lib/axios'

export const warehouseService = {
  createWarehouse: async (categories) => {
    const response = await api.post('/warehouse/create', { categories })
    return response.data
  },

  joinWarehouse: async (token) => {
    const response = await api.post('/warehouse/join', { token })
    return response.data
  },

  generateToken: async () => {
    const response = await api.post('/warehouse/token')
    return response.data
  },

  getWarehouseInfo: async () => {
    const response = await api.get('/warehouse')
    return response.data
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/warehouse/product/${productId}`);
    return response.data;
  },

  deleteBatch: async (batchId) => {
    const response = await api.delete(`/warehouse/batch/${batchId}`);
    return response.data;
  }
}
