import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { Box, Card, CardContent, Typography, ToggleButton, ToggleButtonGroup, useTheme } from '@mui/material'
import { useDashboardStore } from '../../stores/useDashboardStore'

const ComparisonChart = () => {
  const theme = useTheme()
  const [period, setPeriod] = useState('week')
  const { comparisonData, fetchComparisonData } = useDashboardStore()

  useEffect(() => {
    fetchComparisonData(period)
  }, [period])

  const handlePeriodChange = (event, newPeriod) => {
    if (newPeriod !== null) {
      setPeriod(newPeriod)
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">
            Production & Quality Trends
          </Typography>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            size="small"
            aria-label="time period"
            sx={{
              ml: 2,
              '& .MuiToggleButton-root': {
                textTransform: 'none',
                px: 2,
                py: 0.5,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                borderColor: theme.palette.divider,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  bgcolor: theme.palette.primary.light,
                  borderColor: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: theme.palette.primary.light
                  }
                }
              }
            }}
          >
            <ToggleButton value="week">Week</ToggleButton>
            <ToggleButton value="month">Month</ToggleButton>
            <ToggleButton value="year">Year</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={comparisonData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
            <YAxis yAxisId="left" stroke={theme.palette.primary.main} />
            <YAxis yAxisId="right" orientation="right" stroke={theme.palette.secondary.main} />
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="avg_quality"
              name="Avg Quality"
              stroke={theme.palette.primary.main}
              activeDot={{ r: 8 }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="production_count"
              name="Production Count"
              stroke={theme.palette.secondary.main}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export default ComparisonChart
