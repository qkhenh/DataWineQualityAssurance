import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Card, CardContent, TextField, Typography, Divider, Stack } from '@mui/material'
import { warehouseService } from '../Services/warehouseService'
import { useAuthStore } from '../stores/useAuthStore'
import { toast } from 'sonner'

export default function WarehouseSetup() {
  const navigate = useNavigate()
  const updateUserWarehouse = useAuthStore((s) => s.updateUserWarehouse)

  const [categories, setCategories] = useState('')
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreate = async () => {
    if (!categories) return toast.error('Please enter categories')
    try {
      setLoading(true)
      const data = await warehouseService.createWarehouse(categories)
      updateUserWarehouse(data.warehouseId)
      toast.success('Warehouse created!')
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Failed to create warehouse')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!token) return toast.error('Please enter a token')
    try {
      setLoading(true)
      const data = await warehouseService.joinWarehouse(token)
      updateUserWarehouse(data.warehouseId)
      toast.success('Joined warehouse!')
      navigate('/dashboard')
    } catch (error) {
      console.error(error)
      toast.error('Failed to join warehouse. Invalid token?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.default'
    }}>
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Card sx={{ maxWidth: 600, width: '100%', p: 2 }}>
          <CardContent>
            <Typography variant="h4" gutterBottom align="center">
            Welcome!
            </Typography>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
            To get started, please create a new warehouse or join an existing one.
            </Typography>

            <Stack spacing={4}>
              {/* Create Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Create New Warehouse</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Categories (e.g. Red Wine, White Wine)"
                    value={categories}
                    onChange={(e) => setCategories(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    variant="contained"
                    onClick={handleCreate}
                    disabled={loading}
                  >
                  Create
                  </Button>
                </Stack>
              </Box>

              <Divider>OR</Divider>

              {/* Join Section */}
              <Box>
                <Typography variant="h6" gutterBottom>Join Existing Warehouse</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField
                    fullWidth
                    label="Invitation Token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    disabled={loading}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleJoin}
                    disabled={loading}
                  >
                  Join
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
      {/* <Footer /> */}
    </Box>
  )
}
