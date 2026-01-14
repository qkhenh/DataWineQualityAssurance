import api from '../lib/axios'

export const authService = {
  signUp: async (username, password, email, firstName, lastName, exp, role) => {
    const res = await api.post('/auth/signup', {
      username,
      password,
      email,
      firstName,
      lastName,
      exp,
      role
    }, { withCredentials: true })
    return res.data
  },

  signIn: async (username, password) => {
    const res = await api.post('/auth/signin', {
      username,
      password
    }, { withCredentials: true })
    return res.data
  },

  signOut: async () => {
    const res = await api.post('/auth/signout', {}, { withCredentials: true })
    return res.data
  },

  fetchMe: async () => {
    const res = await api.get('/users/me', { withCredentials: true })
    return res.data.user
  }
}