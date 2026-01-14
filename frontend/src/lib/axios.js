import axios from 'axios'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'sonner'

const api = axios.create({
  baseURL:
    import.meta.env.MODE === 'development' ? 'http://localhost:5001/api' : '/api',
  withCredentials:true
})

api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState()

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Check for 401 Token expired
    if (error.response?.status === 401 && error.response?.data?.message === 'Token expired') {
      // Prevent infinite loop if logout itself fails
      if (!originalRequest._retry && !originalRequest.url.includes('/auth/logout')) {
        originalRequest._retry = true
        
        const { signOut } = useAuthStore.getState()
        toast.error('Session expired. Please login again.')
        
        // We call signOut but we also need to ensure we don't get stuck if signOut fails
        try {
            await signOut()
        } catch (e) {
            // If signOut fails (e.g. API error), we should still clear local state manually if needed
            // But useAuthStore.signOut might not clear state if API fails.
            // Let's rely on the store update I will do next.
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
