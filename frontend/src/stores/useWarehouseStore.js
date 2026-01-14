import { create } from 'zustand'
import { warehouseService } from '../Services/warehouseService'
import { toast } from 'sonner'

export const useWarehouseStore = create((set) => ({
  warehouse: null,
  loading: false,
  error: null,

  createWarehouse: async (categories) => {
    set({ loading: true, error: null })
    try {
      const data = await warehouseService.createWarehouse(categories)
      set({ loading: false })
      return data
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  joinWarehouse: async (token) => {
    set({ loading: true, error: null })
    try {
      const data = await warehouseService.joinWarehouse(token)
      set({ loading: false })
      return data
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  generateToken: async () => {
    set({ loading: true, error: null })
    try {
      const data = await warehouseService.generateToken()
      set({ loading: false })
      return data
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  getWarehouseInfo: async () => {
    set({ loading: true, error: null })
    try {
      const data = await warehouseService.getWarehouseInfo()
      set({ warehouse: data, loading: false })
      return data
    } catch (error) {
      set({ loading: false, error: error.message })
      throw error
    }
  },

  deleteProduct: async (productId) => {
    set({ loading: true, error: null })
    try {
      await warehouseService.deleteProduct(productId)
      set({ loading: false })
      toast.success('Product deleted successfully')
    } catch (error) {
      set({ loading: false, error: error.message })
      toast.error('Failed to delete product')
      throw error
    }
  },

  deleteBatch: async (batchId) => {
    set({ loading: true, error: null })
    try {
      await warehouseService.deleteBatch(batchId)
      set({ loading: false })
      toast.success('Batch deleted successfully')
    } catch (error) {
      set({ loading: false, error: error.message })
      toast.error('Failed to delete batch')
      throw error
    }
  }
}))
