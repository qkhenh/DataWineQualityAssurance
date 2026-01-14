import { useState } from 'react'
import { useColorScheme } from '@mui/material/styles'
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom'
import ComputerIcon from '@mui/icons-material/Computer'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import AppBar from '@mui/material/AppBar'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import BuildIcon from '@mui/icons-material/Build'
import MonitorIcon from '@mui/icons-material/Monitor'
import Container from '@mui/material/Container'
import TextField from '@mui/material/TextField'
import Link from '@mui/material/Link'
import VerifiedIcon from '@mui/icons-material/Verified'

import theme from '../theme'
import Footer from '../Components/Footer'
import { useAuthStore } from '../stores/useAuthStore'

function ModeSwitcher() {
  const { mode, setMode } = useColorScheme()

  const handleModeChange = (event) => {
    setMode(event.target.value)
  }

  if (!mode) {
    return null
  }

  return (
    <FormControl>
      <Select
        labelId='mode-select-label'
        id='mode-select'
        value={mode}
        onChange={handleModeChange}
        sx={{ minWidth: 128, fontSize: { xs: '0.75rem', sm: '1rem' } }}
        variant='standard'
        disableUnderline='true'
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
          <Box sx={{ display: 'flex', alignItems: 'center', mr: { xs: 1, sm: 1.5 } }}>
            {/* <SchoolIcon color="primary" sx={{ mr: 0.5, fontSize: { xs: 20, sm: 24 } }} /> */}
          </Box>
          <Typography
            variant="h6"
            component="div"
            sx={{
              fontWeight: 600,
              fontSize: { xs: '1rem', sm: '1.25rem' }
            }}
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

function RoleCard({ icon, title, description, selected, onClick }) {
  return (
    <Card
      sx={{
        width: 200,
        cursor: 'pointer',
        transition: 'all 0.3s',
        border: 1,
        borderColor: 'divider',
        outline: selected ? '2px solid' : 'none',
        outlineColor: 'primary.main',
        outlineOffset: '-1px',
        '&:hover': {
          borderColor: 'primary.main',
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }}
      onClick={onClick}
    >
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          py: 3
        }}
      >
        <Box sx={{ color: 'primary.main', fontSize: 48 }}>
          {icon}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ fontSize: '0.875rem' }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  )
}

function Signup() {
  const navigate = useNavigate()
  const { signUp } = useAuthStore()
  const [selectedRole, setSelectedRole] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    experienceYears: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const roles = [
    {
      id: 'engineer',
      icon: <BuildIcon sx={{ fontSize: 48 }} />,
      title: 'Engineer',
      description: 'Engineering and managing system.'
    },
    {
      id: 'manager',
      icon: <MonitorIcon sx={{ fontSize: 48 }} />,
      title: 'Manager',
      description: 'Monitoring and receiving alerts.'
    },
    {
      id: 'tester',
      icon: <VerifiedIcon sx={{ fontSize: 48 }} />,
      title: 'Tester',
      description: 'Test and validation.'
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate role selection
    if (!selectedRole) {
      setError('Please select a role before signing up')
      return
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate experience years
    if (formData.experienceYears && (isNaN(formData.experienceYears) || formData.experienceYears < 0)) {
      setError('Please enter a valid number for experience years')
      return
    }

    setLoading(true)

    try {
      // Send data to backend API
      await signUp(formData.username, formData.password, formData.email, formData.firstName, formData.lastName, formData.experienceYears, selectedRole)


      navigate('/login')

    } catch (err) {
      setError('Network error. Please check your connection.', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default'
      }}
    >
      <Header />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          alignItems: 'center',
          py: 10
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Join WineManu
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create your account and start your journey with us.
            </Typography>
          </Box>

          {/* Role Selection Cards */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 3,
              mb: 6,
              flexWrap: 'wrap'
            }}
          >
            {roles.map((role) => (
              <RoleCard
                key={role.id}
                icon={role.icon}
                title={role.title}
                description={role.description}
                selected={selectedRole === role.id}
                onClick={() => setSelectedRole(role.id)}
              />
            ))}
          </Box>

          {/* Signup Form */}
          <Box sx={{ maxWidth: 700, mx: 'auto' }}>
            {error && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: 'error.light',
                  color: 'error.contrastText',
                  borderRadius: 1,
                  textAlign: 'center'
                }}
              >
                {error}
              </Box>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              {/* Username */}
              <TextField
                fullWidth
                label="Username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleInputChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />

              {/* Email */}
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />

              {/* First Name and Last Name in a row */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  placeholder="Enter your first name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper'
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  placeholder="Enter your last name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'background.paper'
                    }
                  }}
                />
              </Box>

              {/* Password */}
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />

              {/* Confirm Password */}
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />

              {/* Experience Years */}
              <TextField
                fullWidth
                label="Experience Years"
                name="experienceYears"
                type="number"
                placeholder="Enter your years of experience"
                value={formData.experienceYears}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0, step: 1 }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'background.paper'
                  }
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  mt: 1,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark'
                  }
                }}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              {/* Login Link */}
              <Box sx={{ textAlign: 'center' }}>
                Already have an account?
                {' '}
                <Link component={RouterLink} to="/login" underline="hover" color="primary">
                  Sign In
                </Link>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  )
}

export default Signup