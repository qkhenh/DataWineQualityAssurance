import { create } from 'zustand'
import { getAlerts, markRead, deleteRead, getSettings, updateSettings, deleteSetting, getAlertDetails, deleteAlert, announceAlert } from '../Services/alertService'
import { io } from 'socket.io-client'
import { toast } from 'sonner'

const SOCKET_URL = 'http://localhost:5001'

export const useAlertStore = create((set, get) => ({
  alerts: [],
  unreadCount: 0,
  settings: [],
  loading: false,
  socket: null,

  fetchAlerts: async () => {
    set({ loading: true })
    try {
      const { alerts, unreadCount } = await getAlerts()
      set({ alerts, unreadCount, loading: false })
    } catch (error) {
      console.error('Failed to fetch alerts', error)
      set({ loading: false })
    }
  },

  getAlertDetails: async (alertId) => {
    try {
      return await getAlertDetails(alertId)
    } catch (error) {
      console.error('Failed to fetch alert details', error)
      throw error
    }
  },

  deleteAlert: async (alertId) => {
    try {
      await deleteAlert(alertId)
      set((state) => ({
        alerts: state.alerts.filter(a => a.alert_id !== alertId)
      }))
      toast.success('Alert deleted successfully')
    } catch (error) {
      console.error('Failed to delete alert', error)
      toast.error('Failed to delete alert')
      throw error
    }
  },

  announceAlert: async (data) => {
    try {
      await announceAlert(data)
      toast.success('Alert announced successfully')
    } catch (error) {
      console.error('Failed to announce alert', error)
      toast.error('Failed to announce alert')
      throw error
    }
  },

  toggleAlertStatus: async (alertId, isRead) => {
    try {
      await markRead(alertId, isRead)
      // Optimistic update
      set((state) => {
        const newAlerts = state.alerts.map(a =>
          (alertId === undefined || a.alert_id === alertId) ? { ...a, is_read: isRead } : a
        )
        
        // Recalculate unread count
        const newUnreadCount = newAlerts.filter(a => !a.is_read).length
        
        return { alerts: newAlerts, unreadCount: newUnreadCount }
      })
    } catch (error) {
      console.error('Failed to toggle alert status', error)
    }
  },

  markAsRead: async (alertId) => {
    try {
      await markRead(alertId, true)
      // Optimistic update
      set((state) => {
        const newAlerts = state.alerts.map(a =>
          (alertId === undefined || a.alert_id === alertId) ? { ...a, is_read: true } : a
        )
        const newUnreadCount = alertId === undefined ? 0 : state.unreadCount - 1
        return { alerts: newAlerts, unreadCount: Math.max(0, newUnreadCount) }
      })
    } catch (error) {
      console.error('Failed to mark read', error)
    }
  },

  deleteReadAlerts: async () => {
    try {
      await deleteRead()
      set((state) => ({
        alerts: state.alerts.filter(a => !a.is_read)
      }))
    } catch (error) {
      console.error('Failed to delete read alerts', error)
    }
  },

  fetchSettings: async () => {
    try {
      const settings = await getSettings()
      set({ settings })
    } catch (error) {
      console.error('Failed to fetch settings', error)
    }
  },

  saveSettings: async (newSettings) => {
    try {
      await updateSettings(newSettings)
      set({ settings: newSettings })
    } catch (error) {
      console.error('Failed to save settings', error)
      throw error
    }
  },

  removeSetting: async (metric) => {
    try {
      await deleteSetting(metric)
      set((state) => ({
        settings: state.settings.filter(s => s.metric !== metric)
      }))
    } catch (error) {
      console.error('Failed to remove setting', error)
      throw error
    }
  },

  connectSocket: (warehouseId) => {
    if (get().socket) return

    const socket = io(SOCKET_URL, { withCredentials: true })

    socket.on('connect', () => {
      if (warehouseId) {
        socket.emit('join_warehouse', warehouseId)
      }
    })

    socket.on('alert_new', (newAlert) => {
      set((state) => ({
        alerts: [newAlert, ...state.alerts],
        unreadCount: state.unreadCount + 1
      }))
    })

    set({ socket })
  },

  disconnectSocket: () => {
    const socket = get().socket
    if (socket) {
      socket.disconnect()
      set({ socket: null })
    }
  }
}))
