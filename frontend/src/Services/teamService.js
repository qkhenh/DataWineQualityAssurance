import axios from '../lib/axios'

export const teamService = {
  getTeam: async () => {
    const response = await axios.get('/team')
    return response.data
  },

  removeMember: async (userId) => {
    const response = await axios.delete(`/team/${userId}`)
    return response.data
  }
}
