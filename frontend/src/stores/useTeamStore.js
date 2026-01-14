import { create } from 'zustand'
import { teamService } from '../Services/teamService'
import { toast } from 'sonner'

export const useTeamStore = create((set, get) => ({
  members: [],
  loading: false,
  error: null,

  fetchTeam: async () => {
    set({ loading: true, error: null })
    try {
      const members = await teamService.getTeam()
      set({ members, loading: false })
    } catch (error) {
      console.error('Error fetching team:', error)
      set({ error: error.message, loading: false })
      toast.error('Failed to load team members')
    }
  },

  removeMember: async (userId) => {
    try {
      await teamService.removeMember(userId)
      set((state) => ({
        members: state.members.filter((m) => m.user_id !== userId)
      }))
      toast.success('Member removed successfully')
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error(error.response?.data?.message || 'Failed to remove member')
    }
  }
}))
