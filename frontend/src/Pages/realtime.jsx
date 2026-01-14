import React, { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../lib/axios'
import { useAuthStore } from '../stores/useAuthStore'
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Toolbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import {
  Science,
  Opacity,
  LocalDrink,
  Speed,
  Thermostat,
  Assessment
} from '@mui/icons-material'
import Header from '../Components/Header'
import Footer from '../Components/Footer'

// Connect to backend socket
const SOCKET_URL = 'http://localhost:5001'

const Realtime = () => {
  const { user } = useAuthStore()
  const warehouseId = user?.warehouseId
  const [currentData, setCurrentData] = useState(null)
  const [history, setHistory] = useState([])
  const [connected, setConnected] = useState(false)
  const [selectedLine, setSelectedLine] = useState('all')
  const selectedLineRef = useRef(selectedLine)

  // Update ref when state changes
  useEffect(() => {
    selectedLineRef.current = selectedLine
  }, [selectedLine])

  // Socket connection for status only
  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true })
    socket.on('connect', () => {
      setConnected(true)
      if (warehouseId) {
        socket.emit('join_warehouse', warehouseId)
      }
    })
    socket.on('disconnect', () => setConnected(false))

    return () => socket.disconnect()
  }, [warehouseId])

  // Polling data from DB every second
  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = `/simulation/recent?limit=50${warehouseId ? `&warehouse_id=${warehouseId}` : ''}`
        const response = await api.get(url)
        const data = response.data

        if (data && data.length > 0) {
          setHistory(data)

          // Determine current data to display based on selection
          let latestRelevant = null
          if (selectedLineRef.current === 'all') {
            latestRelevant = data[0]
          } else {
            latestRelevant = data.find(d => d.line_id === selectedLineRef.current)
          }

          if (latestRelevant) {
            setCurrentData(latestRelevant)
          }
        }
      } catch (error) {
        console.error('Error fetching realtime data:', error)
      }
    }

    // Initial fetch
    fetchData()

    // Poll every 1 second
    const intervalId = setInterval(fetchData, 1000)

    return () => clearInterval(intervalId)
  }, [warehouseId]) // Re-run when warehouseId changes

  // Effect to update currentData immediately when selectedLine changes
  useEffect(() => {
    if (history.length > 0) {
      let latestRelevant = null
      if (selectedLine === 'all') {
        latestRelevant = history[0]
      } else {
        latestRelevant = history.find(d => d.line_id === selectedLine)
      }

      if (latestRelevant) {
        setCurrentData(latestRelevant)
      }
    }
  }, [selectedLine, history])

  const getQualityColor = (score) => {
    if (score >= 7) return 'success'
    if (score >= 5) return 'warning'
    return 'error'
  }

  const SensorCard = ({ title, value, unit, icon, color }) => (
    <Card sx={{ width: 115, height: 95, p: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <CardContent sx={{ p: '6px !important', '&:last-child': { pb: '6px !important' } }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color="textSecondary" noWrap sx={{ fontWeight: 500, fontSize: '0.8rem', maxWidth: '100px' }} title={title}>
            {title}
          </Typography>
          {React.cloneElement(icon, { sx: { fontSize: 18, opacity: 0.7 } })}
        </Box>
        <Typography variant="body2" component="div" fontWeight="bold" color={color} sx={{ lineHeight: 1.2, fontSize: '1.5rem', mt: 0.5 }}>
          {value}
        </Typography>
        <Typography component="div" variant="caption" color="textSecondary" sx={{ fontSize: '0.8rem', lineHeight: 1 }}>{unit}</Typography>
      </CardContent>
    </Card>
  )

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Header />
      <Toolbar />
      <Container maxWidth={false} sx={{ mt: 2, mb: 2, flexGrow: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" component="h1" fontWeight="bold">
              Real-time Quality Monitoring
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="line-select-label">Line</InputLabel>
              <Select
                labelId="line-select-label"
                id="line-select"
                value={selectedLine}
                label="Line"
                onChange={(e) => setSelectedLine(e.target.value)}
              >
                <MenuItem value="all">All Lines</MenuItem>
                {[1, 2, 3, 4, 5, 6].map((lineNum) => {
                  const lineId = (warehouseId ? parseInt(warehouseId) : 1) * 100 + lineNum
                  return (
                    <MenuItem key={lineId} value={lineId}>Line {lineNum}</MenuItem>
                  )
                })}
              </Select>
            </FormControl>
          </Box>
          <Chip
            label={connected ? 'System Online' : 'Disconnected'}
            color={connected ? 'success' : 'error'}
            icon={<CheckIcon />}
            size="medium"
          />
        </Box>

        {currentData ? (
          <Grid container spacing={2}>
            {/* Top Section: AI Prediction & Sensors */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box display="flex" flexWrap="wrap" gap={1} justifyContent="center">
                {/* AI Prediction Cards */}
                <SensorCard
                  title="Quality Score"
                  value={currentData.quality_score?.toFixed(1)}
                  unit="/10"
                  icon={<Assessment color="primary" />}
                  color={getQualityColor(currentData.quality_score) + '.main'}
                />
                <SensorCard
                  title="Quality Class"
                  value={currentData.quality_class}
                  unit="/10"
                  icon={<Assessment color="primary" />}
                  color={getQualityColor(currentData.quality_score) + '.main'}
                />

                {/* Sensor Data Cards */}
                <SensorCard
                  title="Alcohol"
                  value={currentData.alcohol}
                  unit="%"
                  icon={<LocalDrink color="primary" />}
                  color="primary.main"
                />
                <SensorCard
                  title="pH Level"
                  value={currentData.pH}
                  unit=""
                  icon={<Science color="secondary" />}
                  color="secondary.main"
                />
                <SensorCard
                  title="Density"
                  value={currentData.density}
                  unit="g/cm³"
                  icon={<Opacity color="info" />}
                  color="info.main"
                />
                <SensorCard
                  title="Fixed Acidity"
                  value={currentData['fixed acidity']}
                  unit="g/dm³"
                  icon={<Thermostat color="action" />}
                  color="text.primary"
                />
                <SensorCard
                  title="Vol. Acidity"
                  value={currentData['volatile acidity']}
                  unit="g/dm³"
                  icon={<Thermostat color="error" />}
                  color="error.main"
                />
                <SensorCard
                  title="Citric Acid"
                  value={currentData['citric acid']}
                  unit="g/dm³"
                  icon={<LocalDrink color="warning" />}
                  color="warning.main"
                />
                <SensorCard
                  title="Res. Sugar"
                  value={currentData['residual sugar']}
                  unit="g/dm³"
                  icon={<Science color="success" />}
                  color="success.main"
                />
                <SensorCard
                  title="Chlorides"
                  value={currentData.chlorides}
                  unit="g/dm³"
                  icon={<Science color="error" />}
                  color="error.main"
                />
                <SensorCard
                  title="Free SO₂"
                  value={currentData['free sulfur dioxide']}
                  unit="mg/dm³"
                  icon={<Speed color="info" />}
                  color="info.main"
                />
                <SensorCard
                  title="Total SO₂"
                  value={currentData['total sulfur dioxide']}
                  unit="mg/dm³"
                  icon={<Speed color="primary" />}
                  color="primary.main"
                />
                <SensorCard
                  title="Sulphates"
                  value={currentData.sulphates}
                  unit="g/dm³"
                  icon={<Science color="warning" />}
                  color="warning.main"
                />
              </Box>
            </Grid>

            {/* History Table */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <Paper sx={{ width: '100%', overflow: 'hidden', mt: 1 }}>
                <Box p={2} pb={1}>
                  <Typography variant="h6" fontWeight={900} component="div">
                    Recent Readings Log
                  </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
                  <Table stickyHeader size="small" aria-label="sticky table">
                    <TableHead sx={{ fontWeight: 900 }}>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        {selectedLine === 'all' && <TableCell>Line</TableCell>}
                        <TableCell>Product ID</TableCell>
                        <TableCell>Batch ID</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Quality</TableCell>
                        <TableCell align="right">Alcohol</TableCell>
                        <TableCell align="right">pH</TableCell>
                        <TableCell align="right">Density</TableCell>
                        <TableCell align="right">Fixed Acidity</TableCell>
                        <TableCell align="right">Vol. Acidity</TableCell>
                        <TableCell align="right">Citric</TableCell>
                        <TableCell align="right">Sugar</TableCell>
                        <TableCell align="right">Chlorides</TableCell>
                        <TableCell align="right">Free SO₂</TableCell>
                        <TableCell align="right">Total SO₂</TableCell>
                        <TableCell align="right">Sulphates</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {history
                        .filter(row => selectedLine === 'all' || row.line_id === selectedLine)
                        .map((row, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{new Date(row.timestamp).toLocaleTimeString()}</TableCell>
                            {selectedLine === 'all' && (
                              <TableCell>
                                <Chip label={`Line ${row.line_id % 100}`} size="small" variant="outlined" />
                              </TableCell>
                            )}
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                              {row.product_id || `L${row.line_id}B${row.batch_id}P${row.product_number}`}
                            </TableCell>
                            <TableCell>{row.batch_id}</TableCell>
                            <TableCell sx={{ textTransform: 'capitalize' }}>
                              <Chip
                                label={row.type}
                                size="small"
                                color={row.type === 'red' ? 'error' : 'default'}
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={row.quality_score?.toFixed(1)}
                                color={getQualityColor(row.quality_score)}
                                size="small"
                                sx={{ height: 20, fontSize: '0.75rem', fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell align="right">{row.alcohol}</TableCell>
                            <TableCell align="right">{row.pH}</TableCell>
                            <TableCell align="right">{row.density}</TableCell>
                            <TableCell align="right">{row['fixed acidity']}</TableCell>
                            <TableCell align="right">{row['volatile acidity']}</TableCell>
                            <TableCell align="right">{row['citric acid']}</TableCell>
                            <TableCell align="right">{row['residual sugar']}</TableCell>
                            <TableCell align="right">{row.chlorides}</TableCell>
                            <TableCell align="right">{row['free sulfur dioxide']}</TableCell>
                            <TableCell align="right">{row['total sulfur dioxide']}</TableCell>
                            <TableCell align="right">{row.sulphates}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
            <LinearProgress sx={{ width: '50%' }} />
            <Typography variant="h6" color="textSecondary" sx={{ ml: 2 }}>
              Waiting for sensor stream...
            </Typography>
          </Box>
        )}
      </Container>

      <Footer />
    </Box>
  )
}

export default Realtime
