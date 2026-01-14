import React from 'react'
import { useAuthStore } from '../../stores/useAuthStore'
import { Navigate, Outlet, useLocation } from 'react-router'

const ProtectedRoute = () => {
  const { accessToken, user } = useAuthStore()
  const location = useLocation()

  if (!accessToken) {
    return (
      <Navigate
        to='/login'
        replace
      />
    )
  }

  if (user?.role === 'tester' && location.pathname !== '/tester') {
    return <Navigate to='/tester' replace />
  }

  return (
    <Outlet></Outlet>
  )
}

export default ProtectedRoute