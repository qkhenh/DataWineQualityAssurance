import { create } from 'zustand'
import { toast } from 'sonner'
import { authService } from '../Services/authService'

export const useAuthStore = create ((set, get) => ({
  accessToken: localStorage.getItem('accessToken') || null,
  user: localStorage.getItem('role') ? {
    user_id: localStorage.getItem('userId') ? parseInt(localStorage.getItem('userId')) : null,
    username: localStorage.getItem('username'),
    role: localStorage.getItem('role'),
    warehouseId: localStorage.getItem('warehouseId') ? parseInt(localStorage.getItem('warehouseId')) : null,
    warehouse_id: localStorage.getItem('warehouseId') ? parseInt(localStorage.getItem('warehouseId')) : null
  } : null,
  loading: false,

  signUp: async (username, password, email, firstName, lastName, exp, role) => {
    try {
      set({ loading: true })

      await authService.signUp(username, password, email, firstName, lastName, exp, role)

      toast.success('Sign up success! Navigate to login')
    } catch (error) {
      console.error(error)
      toast.error('Fail to sign up')
    } finally {
      set({ loading: false })
    }
  },

  signIn: async (username, password) => {
    try {
      set({ loading: true })

      const data = await authService.signIn(username, password)
      set({
        accessToken: data.token,
        user: {
          username: data.username,
          role: data.role,
          warehouseId: data.warehouseId
        }
      })

      const me = await authService.fetchMe()
      
      set({
        accessToken: data.token,
        user: me
      })

      // Store in localStorage for persistence
      localStorage.setItem('accessToken', data.token)
      localStorage.setItem('userId', me.user_id)
      localStorage.setItem('username', data.username)
      localStorage.setItem('role', data.role)
      if (data.warehouseId) {
        localStorage.setItem('warehouseId', data.warehouseId)
      } else {
        localStorage.removeItem('warehouseId')
      }

      toast.success('Sign in success!')
      return { role: data.role, warehouseId: data.warehouseId }
    } catch (error) {
      console.error(error)
      toast.error('Fail to sign in')
      throw error
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    try {
      set({ loading: true })

      await authService.signOut()
      toast.success('Sign out success!')
    } catch (error) {
      console.error(error)
      // If it's 401, it means token expired, which is fine since we are logging out anyway
      if (error.response?.status !== 401) {
        toast.error('Fail to sign out')
      }
    } finally {
      // Clear user state
      set({
        accessToken: null,
        user: null,
        loading: false
      })

      // Clear localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('userId')
      localStorage.removeItem('username')
      localStorage.removeItem('role')
      localStorage.removeItem('warehouseId')
    }
  },

  updateUserWarehouse: (warehouseId) => {
    const currentUser = get().user
    if (currentUser) {
      const newUser = { ...currentUser, warehouseId }
      set({ user: newUser })
      localStorage.setItem('warehouseId', warehouseId)
    }
  },

  fetchCurrentUser: async () => {
    try {
      const me = await authService.fetchMe()
      // Normalize user object to have both camelCase and snake_case for compatibility
      const normalizedUser = {
        ...me,
        warehouseId: me.warehouse_id
      }
      set({ user: normalizedUser })
      
      // Update localStorage to ensure consistency
      localStorage.setItem('userId', me.user_id)
      localStorage.setItem('username', me.username)
      localStorage.setItem('role', me.role)
      if (me.warehouse_id) {
        localStorage.setItem('warehouseId', me.warehouse_id)
      } else {
        localStorage.removeItem('warehouseId')
      }
    } catch (error) {
      console.error('Failed to fetch current user', error)
    }
  }
}))
