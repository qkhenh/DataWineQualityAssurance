import { create } from 'zustand'
import { 
  getAuditLogs, 
  getAuditLogDetail, 
  createAuditLog, 
  deleteAuditLog 
} from '../Services/auditLogService'

export const useAuditLogStore = create((set, get) => ({
  logs: [],
  selectedLog: null,
  loading: false,
  detailLoading: false,

  fetchAuditLogs: async () => {
    set({ loading: true })
    try {
      const { logs } = await getAuditLogs()
      set({ logs, loading: false })
    } catch (error) {
      console.error('Failed to fetch audit logs', error)
      set({ loading: false })
    }
  },

  fetchLogDetail: async (logId) => {
    set({ detailLoading: true })
    try {
      const { log } = await getAuditLogDetail(logId)
      set({ selectedLog: log, detailLoading: false })
    } catch (error) {
      console.error('Failed to fetch log detail', error)
      set({ detailLoading: false })
    }
  },

  clearSelectedLog: () => {
    set({ selectedLog: null })
  },

  addAuditLog: async (event, description) => {
    try {
      const { log } = await createAuditLog(event, description)
      set((state) => ({
        logs: [{ ...log, time_log: new Date().toISOString() }, ...state.logs]
      }))
      return { success: true }
    } catch (error) {
      console.error('Failed to add audit log', error)
      return { success: false, error }
    }
  },

  removeAuditLog: async (logId) => {
    try {
      await deleteAuditLog(logId)
      set((state) => ({
        logs: state.logs.filter(log => log.log_id !== logId),
        selectedLog: state.selectedLog?.log_id === logId ? null : state.selectedLog
      }))
      return { success: true }
    } catch (error) {
      console.error('Failed to delete audit log', error)
      return { success: false, error }
    }
  }
}))
