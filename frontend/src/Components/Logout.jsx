import React from 'react'
import Button from '@mui/material/Button'
import { useAuthStore } from '../stores/useAuthStore'
import { useNavigate } from 'react-router'

const Logout = () => {
  const signOut = useAuthStore((state) => state.signOut)
  const navigate = useNavigate()

  const handleLogout = async () => {
    console.log('Logout clicked!')
    try {
      console.log('Calling signOut...')
      await signOut()
      console.log('SignOut successful, navigating to login...')
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="contained"
      color="error"
    >
      Logout
    </Button>
  )
}

export default Logout