import React, { useEffect, useState, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material'
import { io } from 'socket.io-client'
import { useAuthStore } from '../../stores/useAuthStore'
import 'chartjs-adapter-date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
)

const SOCKET_URL = 'http://localhost:5001'

const StreamingChart = () => {
  const theme = useTheme()
  const { user } = useAuthStore()
  const [dataPoints, setDataPoints] = useState([])

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true })

    socket.on('connect', () => {
      if (user?.warehouseId) {
        socket.emit('join_warehouse', user.warehouseId)
      }
    })

    socket.on('sensor_update', (data) => {
      setDataPoints(prev => {
        const newPoint = {
          x: new Date(data.timestamp),
          y: data.quality_score
        }
        // Keep last 50 points
        const newData = [...prev, newPoint]
        if (newData.length > 50) return newData.slice(newData.length - 50)
        return newData
      })
    })

    return () => socket.disconnect()
  }, [user?.warehouseId])

  const data = {
    datasets: [
      {
        label: 'Real-time Quality Score',
        data: dataPoints,
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.4,
        pointRadius: 2
      }
    ]
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        right: 0
      }
    },
    animation: {
      duration: 0 // Disable animation for performance
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'second',
          displayFormats: {
            second: 'HH:mm:ss'
          }
        },
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      },
      y: {
        min: 0,
        max: 10,
        grid: {
          color: theme.palette.divider
        },
        ticks: {
          color: theme.palette.text.secondary
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: theme.palette.text.primary
        }
      }
    }
  }

  return (
    <Card sx={{ height: '100%', minWidth: '600px' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Live Quality Stream
        </Typography>
        <Box sx={{ flexGrow: 1, minHeight: 300, position: 'relative' }}>
          <Line options={options} data={data} />
        </Box>
      </CardContent>
    </Card>
  )
}

export default StreamingChart
