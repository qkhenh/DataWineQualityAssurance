import React, { useEffect, useState } from 'react'
import { useAlertStore } from '../stores/useAlertStore'
import { useAuthStore } from '../stores/useAuthStore'
import { useWarehouseStore } from '../stores/useWarehouseStore'
import Header from '../Components/Header'
import Footer from '../Components/Footer'
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Button,
  Grid,
  TextField,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Checkbox,
  Toolbar,
  Menu
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import NotificationsIcon from '@mui/icons-material/Notifications'
import SettingsIcon from '@mui/icons-material/Settings'

const ALL_METRICS = [
  'density',
  'chlorides',
  'alcohol',
  'sulphates',
  'pH',
  'fixed_acidity',
  'citric_acid',
  'volatile_acidity',
  'free_sulfur_dioxide',
  'total_sulfur_dioxide',
  'residual_sugar',
  'quality_score'
]

const Notification = () => {
  const { user } = useAuthStore()
  const {
    alerts,
    fetchAlerts,
    markAsRead,
    toggleAlertStatus,
    deleteReadAlerts,
    settings,
    fetchSettings,
    saveSettings,
    removeSetting,
    connectSocket,
    disconnectSocket,
    getAlertDetails,
    deleteAlert,
    announceAlert
  } = useAlertStore()
  const { deleteProduct, deleteBatch } = useWarehouseStore()

  const [tabValue, setTabValue] = useState(0)
  const [filter, setFilter] = useState('all')
  const [localSettings, setLocalSettings] = useState([])
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [newSetting, setNewSetting] = useState({
    metric: '',
    min: 0,
    max: 0,
    enabled: true
  })

  // Alert Details Dialog State
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [selectedAlertDetails, setSelectedAlertDetails] = useState(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [announceAnchorEl, setAnnounceAnchorEl] = useState(null)
  const [removeAnchorEl, setRemoveAnchorEl] = useState(null)

  useEffect(() => {
    fetchAlerts()
    fetchSettings()
  }, [fetchAlerts, fetchSettings])

  useEffect(() => {
    if (user?.warehouseId) {
      connectSocket(user.warehouseId)
    }
    return () => disconnectSocket()
  }, [user, connectSocket, disconnectSocket])

  useEffect(() => {
    // Sync local settings with store settings
    if (settings) {
      setLocalSettings(settings.map(s => ({
        metric: s.metric,
        min: s.min_value,
        max: s.max_value,
        enabled: s.enabled === 1 || s.enabled === true
      })))
    }
  }, [settings])

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue)
  }

  const handleFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter)
    }
  }

  const handleMarkAllRead = () => {
    markAsRead() // undefined means all
  }

  const handleDeleteRead = () => {
    if (window.confirm('Are you sure you want to delete all read alerts?')) {
      deleteReadAlerts()
    }
  }

  const handleSettingChange = (index, field, value) => {
    const newSettings = [...localSettings]
    newSettings[index][field] = value
    setLocalSettings(newSettings)
  }

  const handleSaveSettings = async () => {
    try {
      await saveSettings(localSettings)
      alert('Settings saved successfully!')
    } catch (error) {
      alert('Failed to save settings.')
    }
  }

  const handleAddSetting = async () => {
    if (!newSetting.metric) return

    const settingToAdd = {
      ...newSetting,
      min: Number(newSetting.min),
      max: Number(newSetting.max)
    }

    // Optimistically update local state
    const updatedSettings = [...localSettings, settingToAdd]
    setLocalSettings(updatedSettings)

    try {
      await saveSettings(updatedSettings)
      setOpenAddDialog(false)
      setNewSetting({ metric: '', min: 0, max: 100, enabled: true })
    } catch (error) {
      alert('Failed to add setting.')
    }
  }

  const handleDeleteSetting = async (metric) => {
    if (window.confirm(`Are you sure you want to remove the alert setting for ${metric}?`)) {
      try {
        await removeSetting(metric)
      } catch (error) {
        alert('Failed to delete setting.')
      }
    }
  }

  const handleAlertClick = async (alert) => {
    if (user?.role !== 'engineer') return

    setLoadingDetails(true)
    setOpenDetailsDialog(true)
    try {
      const details = await getAlertDetails(alert.alert_id)
      setSelectedAlertDetails(details)
    } catch (error) {
      console.error('Failed to fetch alert details', error)
      alert('Failed to load alert details.')
      setOpenDetailsDialog(false)
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleAnnounceClick = (event) => {
    setAnnounceAnchorEl(event.currentTarget)
  }

  const handleAnnounceClose = () => {
    setAnnounceAnchorEl(null)
  }

  const handleAnnounceProduct = async () => {
    handleAnnounceClose()
    if (!selectedAlertDetails?.product?.product_id) return
    try {
      await announceAlert({
        title: 'Product Alert!',
        description: `Engineer ${user.user_id} marked product ${selectedAlertDetails.product.product_id} as important!`,
        productId: selectedAlertDetails.product.product_id
      })
    } catch (error) {
      // Error handled in store
    }
  }

  const handleAnnounceBatch = async () => {
    handleAnnounceClose()
    if (!selectedAlertDetails?.product?.batch_id) return
    try {
      await announceAlert({
        title: 'Batch Alert!',
        description: `Engineer ${user.user_id} marked batch ${selectedAlertDetails.product.batch_id} as important!`,
        productId: null
      })
    } catch (error) {
      // Error handled in store
    }
  }

  const handleAnnounceLine = async () => {
    handleAnnounceClose()
    if (!selectedAlertDetails?.product?.line_id) return
    try {
      await announceAlert({
        title: 'Line Alert!',
        description: `Engineer ${user.user_id} marked line ${selectedAlertDetails.product.line_id} as important!`,
        productId: null
      })
    } catch (error) {
      // Error handled in store
    }
  }

  const handleRemoveClick = (event) => {
    setRemoveAnchorEl(event.currentTarget)
  }

  const handleRemoveClose = () => {
    setRemoveAnchorEl(null)
  }

  const handleRemoveProduct = async () => {
    handleRemoveClose()
    if (!selectedAlertDetails?.product?.product_id) return
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(selectedAlertDetails.product.product_id)
        setOpenDetailsDialog(false)
        fetchAlerts()
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const handleRemoveBatch = async () => {
    handleRemoveClose()
    if (!selectedAlertDetails?.product?.batch_id) return
    if (window.confirm('Are you sure you want to delete this entire batch?')) {
      try {
        await deleteBatch(selectedAlertDetails.product.batch_id)
        setOpenDetailsDialog(false)
        fetchAlerts()
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const handleDeleteNotification = async () => {
    if (!selectedAlertDetails?.alert?.alert_id) return

    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await deleteAlert(selectedAlertDetails.alert.alert_id)
        setOpenDetailsDialog(false)
        fetchAlerts() // Refresh list
      } catch (error) {
        // Error handled in store
      }
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.is_read
    return true
  })

  const availableMetrics = ALL_METRICS.filter(
    metric => !localSettings.some(s => s.metric === metric)
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Toolbar />
      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Paper sx={{ width: '100%', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            centered
          >
            <Tab label="Alerts" icon={<NotificationsIcon />} iconPosition="start" />
            <Tab label="Configuration" icon={<SettingsIcon />} iconPosition="start" />
          </Tabs>
        </Paper>

        {tabValue === 0 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <ToggleButtonGroup
                value={filter}
                exclusive
                onChange={handleFilterChange}
                aria-label="alert filter"
                size="small"
              >
                <ToggleButton value="all">
                  All
                </ToggleButton>
                <ToggleButton value="unread">
                  Unread Only
                </ToggleButton>
              </ToggleButtonGroup>

              <Box>
                <Button
                  variant="outlined"
                  startIcon={<CheckCircleIcon />}
                  onClick={handleMarkAllRead}
                  sx={{ mr: 1 }}
                >
                  Mark All Read
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteRead}
                >
                  Delete Read
                </Button>
              </Box>
            </Box>

            <List>
              {filteredAlerts.length === 0 ? (
                <Typography variant="body1" align="center" color="textSecondary">
                  No alerts found.
                </Typography>
              ) : (
                filteredAlerts.map((alert) => (
                  <React.Fragment key={alert.alert_id}>
                    <ListItem
                      sx={{
                        bgcolor: alert.is_read ? 'transparent' : 'action.hover',
                        borderRadius: 1,
                        cursor: user?.role === 'engineer' ? 'pointer' : 'default'
                      }}
                      onClick={() => handleAlertClick(alert)}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight={alert.is_read ? 'normal' : 'bold'}>
                              {alert.title || alert.alert_type || 'Alert'}
                            </Typography>
                            {!alert.is_read && (
                              <Chip label="New" color="primary" size="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="textPrimary">
                              {alert.description || alert.message || 'No description'}
                              {alert.product_id && ` (Product ID: ${alert.product_id})`}
                            </Typography>
                            <br />
                            <Typography component="span" variant="caption" color="textSecondary">
                              {new Date(alert.created_at).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Tooltip title={alert.is_read ? 'Mark as Unread' : 'Mark as Read'}>
                          <Checkbox
                            edge="end"
                            checked={!!alert.is_read}
                            onChange={(e) => toggleAlertStatus(alert.alert_id, e.target.checked)}
                            color="primary"
                          />
                        </Tooltip>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))
              )}
            </List>
          </Paper>
        )}

        {tabValue === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenAddDialog(true)}
                disabled={availableMetrics.length === 0}
              >
                Add Setting
              </Button>
            </Box>

            <Grid container spacing={3}>
              {localSettings.map((setting, index) => (
                <Grid item xs={12} md={6} lg={4} key={setting.metric}>
                  <Card>
                    <CardHeader
                      title={setting.metric.replace(/_/g, ' ').toUpperCase()}
                      action={
                        <IconButton onClick={() => handleDeleteSetting(setting.metric)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    />
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={setting.enabled}
                                onChange={(e) => handleSettingChange(index, 'enabled', e.target.checked)}
                                color="primary"
                              />
                            }
                            label={setting.enabled ? 'Enabled' : 'Disabled'}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Min Value"
                            type="number"
                            fullWidth
                            value={setting.min}
                            onChange={(e) => handleSettingChange(index, 'min', Number(e.target.value))}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            label="Max Value"
                            type="number"
                            fullWidth
                            value={setting.max}
                            onChange={(e) => handleSettingChange(index, 'max', Number(e.target.value))}
                            size="small"
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<SaveIcon />}
                onClick={handleSaveSettings}
              >
                Save Configuration
              </Button>
            </Box>
          </Box>
        )}
      </Container>

      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Alert Setting</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2} alignItems="center" sx={{ mt: 1 }}>
            <Grid item xs={4}>
              <FormControl fullWidth>
                <InputLabel>Metric</InputLabel>
                <Select
                  value={newSetting.metric}
                  label="Metric"
                  onChange={(e) => setNewSetting({ ...newSetting, metric: e.target.value })}
                >
                  {availableMetrics.map((metric) => (
                    <MenuItem key={metric} value={metric}>
                      {metric.replace(/_/g, ' ').toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Min Value"
                type="number"
                fullWidth
                value={newSetting.min}
                onChange={(e) => setNewSetting({ ...newSetting, min: e.target.value })}
              />
            </Grid>
            <Grid item xs={4}>
              <TextField
                label="Max Value"
                type="number"
                fullWidth
                value={newSetting.max}
                onChange={(e) => setNewSetting({ ...newSetting, max: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddSetting} variant="contained" disabled={!newSetting.metric}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Details Dialog */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Alert Details</DialogTitle>
        <DialogContent dividers>
          {loadingDetails ? (
            <Typography>Loading details...</Typography>
          ) : selectedAlertDetails ? (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Product Information
                </Typography>
                <Typography><strong>Product ID:</strong> {selectedAlertDetails.product.product_id}</Typography>
                <Typography><strong>Line ID:</strong> {selectedAlertDetails.product.line_id}</Typography>
                <Typography><strong>Batch ID:</strong> {selectedAlertDetails.product.batch_id}</Typography>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Alert Context ({selectedAlertDetails.metric || 'Unknown Metric'})
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="textSecondary">Line Average</Typography>
                      <Typography variant="h4">
                        {selectedAlertDetails.lineAvg !== null
                          ? Number(selectedAlertDetails.lineAvg).toFixed(2)
                          : 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" color="textSecondary">Batch Average</Typography>
                      <Typography variant="h4">
                        {selectedAlertDetails.batchAvg !== null
                          ? Number(selectedAlertDetails.batchAvg).toFixed(2)
                          : 'N/A'}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Product Parameters
                </Typography>
                <Grid container spacing={1}>
                  {Object.entries(selectedAlertDetails.product).map(([key, value]) => {
                    if (['product_id', 'line_id', 'batch_id', 'warehouse_id', 'timestamp'].includes(key)) return null
                    return (
                      <Grid item xs={6} sm={4} key={key}>
                        <Typography variant="body2">
                          <strong>{key.replace(/_/g, ' ')}:</strong> {typeof value === 'number' ? value.toFixed(2) : value}
                        </Typography>
                      </Grid>
                    )
                  })}
                </Grid>
              </Grid>
            </Grid>
          ) : (
            <Typography color="error">Failed to load details.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAnnounceClick} color="primary">
            Announce
          </Button>
          <Menu
            anchorEl={announceAnchorEl}
            open={Boolean(announceAnchorEl)}
            onClose={handleAnnounceClose}
          >
            <MenuItem onClick={handleAnnounceProduct}>Announce Product</MenuItem>
            <MenuItem onClick={handleAnnounceBatch}>Announce Batch</MenuItem>
            <MenuItem onClick={handleAnnounceLine}>Announce Line</MenuItem>
          </Menu>

          <Button onClick={handleRemoveClick} color="warning">
            Remove
          </Button>
          <Menu
            anchorEl={removeAnchorEl}
            open={Boolean(removeAnchorEl)}
            onClose={handleRemoveClose}
          >
            <MenuItem onClick={handleRemoveProduct}>Remove Product</MenuItem>
            <MenuItem onClick={handleRemoveBatch}>Remove Batch</MenuItem>
          </Menu>

          <Button onClick={handleDeleteNotification} color="error">
            Delete Notification
          </Button>
          <Button onClick={() => setOpenDetailsDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  )
}

export default Notification
