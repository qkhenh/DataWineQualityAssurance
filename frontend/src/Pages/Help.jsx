import React, { useState } from 'react'
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
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Paper
} from '@mui/material'
import ComputerIcon from '@mui/icons-material/Computer'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import DashboardIcon from '@mui/icons-material/Dashboard'
import NotificationsIcon from '@mui/icons-material/Notifications'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import SettingsIcon from '@mui/icons-material/Settings'
import SearchIcon from '@mui/icons-material/Search'
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

const quickGuides = [
  {
    icon: <PersonAddIcon sx={{ fontSize: 32 }} />,
    title: 'Getting Started',
    description: 'Create your account and set up your first warehouse.'
  },
  {
    icon: <DashboardIcon sx={{ fontSize: 32 }} />,
    title: 'Dashboard Overview',
    description: 'Navigate the dashboard and understand key metrics.'
  },
  {
    icon: <NotificationsIcon sx={{ fontSize: 32 }} />,
    title: 'Alert Configuration',
    description: 'Set up custom alerts for sensor thresholds.'
  },
  {
    icon: <GroupAddIcon sx={{ fontSize: 32 }} />,
    title: 'Team Management',
    description: 'Invite team members and manage permissions.'
  }
]

const faqs = [
  {
    question: 'How do I create a warehouse?',
    answer: 'After signing up as a Manager, you will be prompted to create a warehouse. Enter a category name (e.g., "Red Wine Production") and click Create. Your warehouse will be set up immediately with a unique ID.'
  },
  {
    question: 'How can I invite team members to my warehouse?',
    answer: 'Go to your Dashboard and click the "Share Warehouse" button. This will generate an invitation token that expires in 24 hours. Share this token with your team members who can use it to join your warehouse during their signup or from the Warehouse Setup page.'
  },
  {
    question: 'What are the different user roles?',
    answer: 'WineManu supports three roles: Manager (can create warehouses, invite members, and has full access), Engineer (can monitor production lines and configure settings), and Tester (can view data and perform quality tests).'
  },
  {
    question: 'How does the AI quality prediction work?',
    answer: 'Our AI model analyzes wine properties such as alcohol content, pH level, acidity, and other chemical parameters to predict a quality score from 1-10. The model was trained on thousands of wine samples and provides real-time predictions during production.'
  },
  {
    question: 'How do I configure alert thresholds?',
    answer: 'Navigate to the Alerts page and click on the Configuration tab. You can set minimum and maximum values for each sensor metric. When readings fall outside these ranges, you will receive instant notifications.'
  },
  {
    question: 'Can I monitor multiple production lines?',
    answer: 'Yes! The Realtime page allows you to monitor all production lines simultaneously or filter by a specific line. Each line displays live sensor data and quality predictions.'
  },
  {
    question: 'How is the audit log used?',
    answer: 'The Audit Log tracks important events in your warehouse. You can view service history and add new log entries to document maintenance, configuration changes, or any significant events.'
  },
  {
    question: 'What happens if I forget my password?',
    answer: 'Click on "Forgot Password?" on the login page. Enter your email address and we will send you instructions to reset your password. Make sure to check your spam folder if you do not receive the email.'
  }
]

const Help = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expanded, setExpanded] = useState(false)

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
          py: { xs: 6, md: 8 },
          background: 'linear-gradient(135deg, rgba(114, 47, 55, 0.1) 0%, rgba(114, 47, 55, 0.05) 100%)',
          textAlign: 'center'
        }}
      >
        <Container maxWidth="md">
          <HelpOutlineIcon sx={{ fontSize: 56, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1.75rem', md: '2.5rem' } }}>
            How can we help you?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Find answers to common questions or get in touch with our support team.
          </Typography>
          
          {/* Search Box */}
          <Paper 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              maxWidth: 500, 
              mx: 'auto',
              px: 2,
              py: 0.5,
              borderRadius: 2
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ disableUnderline: true }}
            />
          </Paper>
        </Container>
      </Box>

      {/* Quick Guides */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
          Quick Guides
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Row 1: Getting Started & Dashboard Overview */}
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            {quickGuides.slice(0, 2).map((guide, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: '1 1 45%',
                  maxWidth: '45%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 1.5 }}>
                    {guide.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {guide.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {guide.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
          {/* Row 2: Alert Configuration & Team Management */}
          <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
            {quickGuides.slice(2, 4).map((guide, index) => (
              <Card 
                key={index}
                sx={{ 
                  flex: '1 1 45%',
                  maxWidth: '45%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Box sx={{ color: 'primary.main', mb: 1.5 }}>
                    {guide.icon}
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {guide.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {guide.description}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Container>

      {/* FAQ Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 6, flexGrow: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
            Frequently Asked Questions
          </Typography>
          
          {filteredFaqs.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No results found for "{searchQuery}"
              </Typography>
            </Paper>
          ) : (
            filteredFaqs.map((faq, index) => (
              <Accordion 
                key={index}
                expanded={expanded === `panel${index}`}
                onChange={handleChange(`panel${index}`)}
                sx={{ mb: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography sx={{ fontWeight: 500 }}>{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))
          )}
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 5, textAlign: 'center', bgcolor: 'background.paper' }}>
        <Container maxWidth="sm">
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
            Still need help?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Can't find what you're looking for? Sign in to access more support options.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={() => navigate('/login')}
              sx={{ fontWeight: 600 }}
            >
              Sign In
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/signup')}
              sx={{ fontWeight: 600 }}
            >
              Create Account
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  )
}

export default Help
