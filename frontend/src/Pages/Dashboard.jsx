import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/useAuthStore'
import { useDashboardStore } from '../stores/useDashboardStore'
import Logout from '../Components/Logout'
import Header from '../Components/Header'
import Footer from '../Components/Footer'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import TimelineIcon from '@mui/icons-material/Timeline'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import WineBarIcon from '@mui/icons-material/WineBar'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import DoneAllIcon from '@mui/icons-material/DoneAll'
import CompareArrowsIcon from '@mui/icons-material/CompareArrows'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import ComparisonChart from '../Components/Dashboard/ComparisonChart'
import StreamingChart from '../Components/Dashboard/StreamingChart'
import AlertCalendar from '../Components/Dashboard/AlertCalendar'

// Stat Card Component
const StatCard = ({ title, value, icon, color = 'primary' }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography color="text.secondary" variant="body2" gutterBottom>
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 600 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: `${color}.lighter`,
            color: `${color}.main`
          }}
        >
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
)

const Dashboard = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const {
    warehouse,
    lines,
    batches,
    recentProducts,
    testerComparisons,
    warehouseInfo,
    loading,
    fetchDashboardData,
    generateToken
  } = useDashboardStore()

  const [tabValue, setTabValue] = useState(0)

  useEffect(() => {
    if (!user?.warehouseId) {
      navigate('/setup-warehouse')
      return
    }
    fetchDashboardData()
  }, [user, navigate])

  const getStatusChip = (status) => {
    const statusConfig = {
      active: { label: 'Active', color: 'success' },
      maintenance: { label: 'Maintenance', color: 'warning' },
      inactive: { label: 'Inactive', color: 'error' },
      in_progress: { label: 'In Progress', color: 'info' },
      completed: { label: 'Completed', color: 'success' },
      good: { label: 'Good', color: 'success' },
      warning: { label: 'Warning', color: 'warning' },
      error: { label: 'Error', color: 'error' }
    }
    const config = statusConfig[status] || { label: status, color: 'default' }
    return <Chip label={config.label} color={config.color} size="small" />
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  const handleGenerateToken = async () => {
    await generateToken()
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Toolbar />

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
              Manager Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Welcome back, {user?.username}! Monitor your warehouse operations.
            </Typography>
          </Box>
          <Logout />
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Stats Cards Scrollable Container */}
        {warehouse && (
          <Box
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              pb: 2, // Padding bottom for scrollbar
              mb: 4,
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: '#f1f1f1',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#888',
                borderRadius: 4,
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#555',
              },
            }}
          >
            <Box sx={{ minWidth: 130 }}>
              <StatCard
                title="Total Lines"
                value={warehouse.total_lines}
                icon={<TimelineIcon />}
                color="primary"
              />
            </Box>
            <Box sx={{ minWidth: 130 }}>
              <StatCard
                title="Active Lines"
                value={warehouse.active_lines}
                icon={<TimelineIcon />}
                color="success"
              />
            </Box>
            <Box sx={{ minWidth: 130 }}>
              <StatCard
                title="Total Batches"
                value={warehouse.total_batches}
                icon={<LocalShippingIcon />}
                color="info"
              />
            </Box>
            <Box sx={{ minWidth: 130 }}>
              <StatCard
                title="Total Products"
                value={warehouse.total_products.toLocaleString()}
                icon={<WineBarIcon />}
                color="secondary"
              />
            </Box>

            {warehouse.testing_stats && (
              <>
                <Box sx={{ minWidth: 130 }}>
                  <StatCard
                    title="Total Tested"
                    value={warehouse.testing_stats.total_tested}
                    icon={<FactCheckIcon />}
                    color="primary"
                  />
                </Box>
                <Box sx={{ minWidth: 130 }}>
                  <StatCard
                    title="Accuracy (±1)"
                    value={`${warehouse.testing_stats.accuracy_1}%`}
                    icon={<GpsFixedIcon />}
                    color="success"
                  />
                </Box>
                <Box sx={{ minWidth: 130 }}>
                  <StatCard
                    title="Accuracy (±3)"
                    value={`${warehouse.testing_stats.accuracy_3}%`}
                    icon={<DoneAllIcon />}
                    color="info"
                  />
                </Box>
                <Box sx={{ minWidth: 130 }}>
                  <StatCard
                    title="Avg Difference"
                    value={warehouse.testing_stats.avg_diff}
                    icon={<CompareArrowsIcon />}
                    color="warning"
                  />
                </Box>
              </>
            )}
          </Box>
        )}

        {/* Warehouse Info */}
        {warehouse && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <WarehouseIcon sx={{ mr: 1, color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Warehouse Information
                  </Typography>
                </Box>
                {warehouseInfo?.isOwner && (
                  <Button variant="contained" onClick={handleGenerateToken}>
                    Share Warehouse
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Warehouse ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {warehouse.warehouse_id}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="body2" color="text.secondary">
                    Category
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {warehouse.categories}
                  </Typography>
                </Grid>
                {warehouseInfo?.invitation_token && (
                  <Grid item xs={12} md={4}>
                    <Typography variant="body2" color="text.secondary">
                      Invitation Token (Expires in 24h)
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, color: 'primary.main' }}>
                      {warehouseInfo.invitation_token}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Analytics Section */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <ComparisonChart />
          </Grid>
          <Grid item xs={12} md={4}>
            <AlertCalendar />
          </Grid>
          <Grid item xs={12}>
            <StreamingChart />
          </Grid>
        </Grid>

        {/* Tabs for different views */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Production Lines" />
            <Tab label="Active Batches" />
            <Tab label="Recent Products" />
            <Tab label="Tester Comparisons" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        {tabValue === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Production Lines
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Line ID</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Active Since</TableCell>
                      <TableCell>Current Batch</TableCell>
                      <TableCell>Sensors</TableCell>
                      <TableCell align="right">Products Today</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line) => (
                      <TableRow key={line.line_id}>
                        <TableCell>Line {line.line_id % 100}</TableCell>
                        <TableCell>{getStatusChip(line.status)}</TableCell>
                        <TableCell>{formatDate(line.active_date)}</TableCell>
                        <TableCell>{line.current_batch || '-'}</TableCell>
                        <TableCell>{line.sensors_count} sensors</TableCell>
                        <TableCell align="right">{line.products_today}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Active Batches
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Batch Name</TableCell>
                      <TableCell>Line</TableCell>
                      <TableCell>Start Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Products</TableCell>
                      <TableCell align="right">Quality Score</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.batch_id}>
                        <TableCell sx={{ fontWeight: 500 }}>{batch.batch_name}</TableCell>
                        <TableCell>Line {batch.line_id % 100}</TableCell>
                        <TableCell>{formatDate(batch.start_date)}</TableCell>
                        <TableCell>{getStatusChip(batch.status)}</TableCell>
                        <TableCell align="right">{batch.products_count}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={batch.quality_score}
                            color={batch.quality_score >= 8.5 ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined">
                            Monitor
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 2 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Products
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product ID</TableCell>
                      <TableCell>Batch</TableCell>
                      <TableCell>Alcohol %</TableCell>
                      <TableCell>pH Level</TableCell>
                      <TableCell>Quality</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentProducts.map((product) => (
                      <TableRow key={product.product_id}>
                        <TableCell>#{product.product_id}</TableCell>
                        <TableCell>{product.batch_id}</TableCell>
                        <TableCell>{product.alcohol}%</TableCell>
                        <TableCell>{product.pH}</TableCell>
                        <TableCell>{getStatusChip(product.quality_status)}</TableCell>
                        <TableCell>{formatDateTime(product.timestamp)}</TableCell>
                        <TableCell align="center">
                          <Button size="small" variant="outlined">
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {tabValue === 3 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Tester Comparisons
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Tester Name</TableCell>
                      <TableCell>Tester ID</TableCell>
                      <TableCell>Product ID</TableCell>
                      <TableCell align="right">Tester Score</TableCell>
                      <TableCell align="right">Model Score</TableCell>
                      <TableCell align="right">Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {testerComparisons && testerComparisons.length > 0 ? (
                      testerComparisons.map((row, index) => {
                        const diff = row.model_score !== null 
                          ? Math.abs(row.tester_score - row.model_score).toFixed(2) 
                          : 'N/A';
                        return (
                          <TableRow key={index}>
                            <TableCell>{row.tester_name}</TableCell>
                            <TableCell>{row.tester_id}</TableCell>
                            <TableCell>{row.product_id}</TableCell>
                            <TableCell align="right">{Number(row.tester_score).toFixed(2)}</TableCell>
                            <TableCell align="right">
                              {row.model_score !== null ? Number(row.model_score).toFixed(2) : 'N/A'}
                            </TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={diff} 
                                color={diff !== 'N/A' && parseFloat(diff) > 1.0 ? 'error' : 'success'} 
                                size="small" 
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No comparison data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Alert for notifications */}
        <Alert severity="info" sx={{ mt: 3 }}>
          All data shown is mock data. Real-time monitoring will be available once database is populated with sensor data.
        </Alert>
      </Container>

      <Footer />
    </Box>
  )
}

export default Dashboard
