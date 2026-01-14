import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useColorScheme } from '@mui/material/styles'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  AppBar,
  Toolbar,
  FormControl,
  Select,
  MenuItem
} from '@mui/material'
import WineBarIcon from '@mui/icons-material/WineBar'
import ComputerIcon from '@mui/icons-material/Computer'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import SpeedIcon from '@mui/icons-material/Speed'
import SecurityIcon from '@mui/icons-material/Security'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import GroupsIcon from '@mui/icons-material/Groups'
import AutoGraphIcon from '@mui/icons-material/AutoGraph'
import Footer from '../Components/Footer'
import theme from '../theme'

function ModeSwitcher() {
  const { mode, setMode } = useColorScheme()

  const handleModeChange = (event) => {
    setMode(event.target.value)
  }

  if (!mode) return null

  return (
    <FormControl>
      <Select
        value={mode}
        onChange={handleModeChange}
        sx={{ minWidth: 128, fontSize: { xs: '0.75rem', sm: '1rem' } }}
        variant='standard'
        disableUnderline={true}
        IconComponent={() => null}
      >
        <MenuItem value="light">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightModeIcon fontSize='small'/> Light
          </Box>
        </MenuItem>
        <MenuItem value="dark">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DarkModeIcon fontSize='small'/> Dark
          </Box>
        </MenuItem>
        <MenuItem value="system">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ComputerIcon fontSize='small'/> System
          </Box>
        </MenuItem>
      </Select>
    </FormControl>
  )
}

function Header() {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { label: 'Help', path: '/help' },
    { label: 'About', path: '/about' }
  ]

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backdropFilter: 'blur(10px)',
        backgroundColor: theme.vars.palette.primary.header,
        color: 'text.primary'
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            WineManu
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                textDecoration: location.pathname === item.path ? 'underline' : 'none',
                textUnderlineOffset: '4px',
                fontSize: { xs: '0.75rem', sm: '1rem' },
                px: { xs: 1, sm: 2 },
                minWidth: 'auto'
              }}
            >
              {item.label}
            </Button>
          ))}
          <ModeSwitcher />
        </Box>
      </Toolbar>
    </AppBar>
  )
}

const features = [
  {
    icon: <SpeedIcon sx={{ fontSize: 40 }} />,
    title: 'Real-time Monitoring',
    description: 'Monitor wine production metrics in real-time with live sensor data streaming and instant updates.'
  },
  {
    icon: <AutoGraphIcon sx={{ fontSize: 40 }} />,
    title: 'AI Quality Prediction',
    description: 'Leverage machine learning models to predict wine quality scores based on chemical properties.'
  },
  {
    icon: <NotificationsActiveIcon sx={{ fontSize: 40 }} />,
    title: 'Smart Alerts',
    description: 'Receive instant notifications when sensor readings fall outside configured thresholds.'
  },
  {
    icon: <AnalyticsIcon sx={{ fontSize: 40 }} />,
    title: 'Comprehensive Analytics',
    description: 'Analyze production trends, batch performance, and quality metrics with detailed dashboards.'
  },
  {
    icon: <GroupsIcon sx={{ fontSize: 40 }} />,
    title: 'Team Collaboration',
    description: 'Invite engineers and testers to your warehouse with role-based access control.'
  },
  {
    icon: <SecurityIcon sx={{ fontSize: 40 }} />,
    title: 'Secure & Reliable',
    description: 'Enterprise-grade security with JWT authentication and encrypted data transmission.'
  }
]

const About = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: 'background.default' 
    }}>
      <Header />
      <Toolbar />

      {/* Hero Section */}
      <Box
        sx={{
          py: { xs: 6, md: 10 },
          background: 'linear-gradient(135deg, rgba(114, 47, 55, 0.1) 0%, rgba(114, 47, 55, 0.05) 100%)',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <WineBarIcon sx={{ fontSize: 64, color: 'primary.main' }} />
          </Box>
          <Typography variant="h2" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}>
            About WineManu
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
            WineManu is a comprehensive wine production management system designed to revolutionize 
            how wineries monitor, analyze, and optimize their production processes using cutting-edge 
            AI technology and real-time data analytics.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/login')}
              sx={{ px: 4, py: 1.5, fontWeight: 600 }}
            >
              Sign In
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/signup')}
              sx={{ px: 4, py: 1.5, fontWeight: 600 }}
            >
              Create Account
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 }, flexGrow: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, textAlign: 'center', mb: 6 }}>
          Key Features
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Row 1: Real-time Monitoring & AI Quality Prediction */}
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {features.slice(0, 2).map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: '1 1 45%',
                  maxWidth: '45%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          {/* Row 2: Smart Alerts & Comprehensive Analytics */}
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {features.slice(2, 4).map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: '1 1 45%',
                  maxWidth: '45%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          {/* Row 3: Team Collaboration & Secure & Reliable */}
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
            {features.slice(4, 6).map((feature, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: '1 1 45%',
                  maxWidth: '45%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Box sx={{ color: 'primary.main', mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Container>

      {/* CTA Section */}
      <Box sx={{ py: 6, bgcolor: 'primary.main', color: 'primary.contrastText', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            Ready to Get Started?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Join WineManu today and transform your wine production management.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            onClick={() => navigate('/signup')}
            sx={{ 
              px: 5, 
              py: 1.5, 
              fontWeight: 600,
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100'
              }
            }}
          >
            Get Started Free
          </Button>
        </Container>
      </Box>

      <Footer />
    </Box>
  )
}

export default About
