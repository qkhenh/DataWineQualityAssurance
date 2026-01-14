import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths, addDays } from 'date-fns'
import { Box, Card, CardContent, Typography, IconButton, Grid, useTheme } from '@mui/material'
import { ChevronLeft, ChevronRight } from '@mui/icons-material'
import { useDashboardStore } from '../../stores/useDashboardStore'

const AlertCalendar = () => {
  const theme = useTheme()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { alertsCalendar } = useDashboardStore()

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const dateFormat = 'd'
  const rows = []
  let days = []
  let day = startDate
  let formattedDate = ''

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat)
      const cloneDay = day

      const hasAlert = alertsCalendar && alertsCalendar.find(a => isSameDay(new Date(a.date), cloneDay))

      days.push(
        <Grid item xs={1} key={day.toString()} sx={{ textAlign: 'center', p: 0.5 }}>
          <Box
            sx={{
              color: !isSameMonth(day, monthStart)
                ? theme.palette.text.disabled
                : theme.palette.text.primary,
              fontWeight: isSameDay(day, new Date()) ? 'bold' : 'normal',
              bgcolor: isSameDay(day, new Date()) ? theme.palette.action.selected : 'transparent',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
              position: 'relative',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
          >
            {formattedDate}
            {hasAlert && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  width: 4,
                  height: 4,
                  bgcolor: theme.palette.error.main,
                  borderRadius: '50%'
                }}
              />
            )}
          </Box>
        </Grid>
      )
      day = addDays(day, 1)
    }
    rows.push(
      <Grid container key={day.toString()} justifyContent="center" columns={7}>
        {days}
      </Grid>
    )
    days = []
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" fontWeight="bold">
            Alert Calendar
          </Typography>
          <Box>
            <IconButton onClick={prevMonth} size="small"><ChevronLeft /></IconButton>
            <Typography variant="body2" component="span" sx={{ mx: 1, fontWeight: 'bold' }}>
              {format(currentMonth, 'MMM yyyy')}
            </Typography>
            <IconButton onClick={nextMonth} size="small"><ChevronRight /></IconButton>
          </Box>
        </Box>

        <Grid container mb={1} columns={7} gap={1} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-evenly' }}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <Grid item xs={1} key={d} sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary" fontWeight="bold">
                {d}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {rows}

        <Box mt={2} display="flex" alignItems="center" gap={1} justifyContent="center">
          <Box sx={{ width: 6, height: 6, bgcolor: theme.palette.error.main, borderRadius: '50%' }} />
          <Typography variant="caption" color="textSecondary">
             Alerts
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default AlertCalendar
