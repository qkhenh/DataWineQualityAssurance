import React, { useEffect, useState } from 'react'
import { useAuditLogStore } from '../stores/useAuditLogStore'
import Header from '../Components/Header'
import Footer from '../Components/Footer'
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import EventNoteIcon from '@mui/icons-material/EventNote'

const AuditLog = () => {
  const {
    logs,
    selectedLog,
    loading,
    detailLoading,
    fetchAuditLogs,
    fetchLogDetail,
    clearSelectedLog,
    addAuditLog
  } = useAuditLogStore()

  const [tabValue, setTabValue] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [description, setDescription] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  useEffect(() => {
    fetchAuditLogs()
  }, [fetchAuditLogs])

  const handleRowClick = async (logId) => {
    await fetchLogDetail(logId)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    clearSelectedLog()
  }

  const handleSubmitLog = async () => {
    if (!eventTitle.trim()) {
      setSnackbar({ open: true, message: 'Event title is required', severity: 'error' })
      return
    }

    const result = await addAuditLog(eventTitle, description)
    if (result.success) {
      setEventTitle('')
      setDescription('')
      setSnackbar({ open: true, message: 'Audit log created successfully', severity: 'success' })
    } else {
      setSnackbar({ open: true, message: 'Failed to create audit log', severity: 'error' })
    }
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <Box sx={{ height: 64 }} /> {/* Toolbar spacer */}

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab icon={<HistoryIcon />} label="Service History" iconPosition="start" />
            <Tab icon={<AddIcon />} label="New Audit Log" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 1: Service History */}
        {tabValue === 0 && (
          <Paper sx={{ p: 0 }}>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
              <Typography variant="h6">Service History</Typography>
              <Typography variant="body2" color="text.secondary">
                Click on an event to view details
              </Typography>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>Log ID</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '50%' }}>Event</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '35%' }}>Time Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="text.secondary" sx={{ py: 4 }}>
                            No audit logs found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      logs.map((log) => (
                        <TableRow 
                          key={log.log_id}
                          hover
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                          onClick={() => handleRowClick(log.log_id)}
                        >
                          <TableCell>#{log.log_id}</TableCell>
                          <TableCell>
                            <Typography
                              sx={{
                                color: 'primary.main',
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  textDecoration: 'underline',
                                  opacity: 0.8
                                }
                              }}
                            >
                              {log.event}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDateTime(log.time_log)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        )}

        {/* Tab 2: New Audit Log */}
        {tabValue === 1 && (
          <Card>
            <CardHeader
              title="Create New Audit Log"
              subheader="Add a new service event to the audit log"
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Event Title"
                  variant="outlined"
                  fullWidth
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title..."
                  required
                />
                <TextField
                  label="Description"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed description..."
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmitLog}
                    startIcon={<AddIcon />}
                  >
                    Create Audit Log
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}
      </Container>

      {/* Detail Drawer - Right Side Panel */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={handleCloseDrawer}
        PaperProps={{
          sx: { width: { xs: '100%', sm: '45%' } }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header with close button */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EventNoteIcon color="primary" />
              <Typography variant="h6">Event Details</Typography>
            </Box>
            <IconButton onClick={handleCloseDrawer}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {detailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : selectedLog ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1, overflow: 'hidden' }}>
              {/* Event Title */}
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Event Title
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5, wordBreak: 'break-word' }}>
                  {selectedLog.event}
                </Typography>
              </Box>

              {/* Event Details Section */}
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Event Details
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Log ID
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        #{selectedLog.log_id}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Time Updated
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDateTime(selectedLog.time_log)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>

              {/* Description Section */}
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Typography variant="overline" color="text.secondary">
                  Description
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    mt: 1, 
                    flexGrow: 1,
                    overflow: 'auto',
                    bgcolor: 'background.paper'
                  }}
                >
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word',
                      color: 'text.primary'
                    }}
                  >
                    {selectedLog.description || 'No description provided'}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ) : (
            <Typography color="text.secondary">No log selected</Typography>
          )}
        </Box>
      </Drawer>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </Box>
  )
}

export default AuditLog
