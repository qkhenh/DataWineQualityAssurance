import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Divider from '@mui/material/Divider'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import WineBarIcon from '@mui/icons-material/WineBar'

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        borderTop: 1,
        borderColor: 'divider',
        py: 4,
        px: 3,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'center', md: 'flex-start' },
          gap: 3
        }}>
          {/* Project Info */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' }, maxWidth: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, gap: 1, mb: 1 }}>
              <WineBarIcon sx={{ fontSize: 28 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                WineManu
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9, lineHeight: 1.6 }}>
              A comprehensive wine production management system with AI-powered quality prediction, 
              real-time monitoring, and intelligent alerting for modern wineries.
            </Typography>
          </Box>

          {/* Contact Info */}
          <Box sx={{ textAlign: { xs: 'center', md: 'right' } }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-end' }, gap: 1 }}>
                <EmailIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                <Link 
                  href="mailto:dangquockhanh2k5@gmail.com" 
                  underline="hover" 
                  sx={{ color: 'inherit', opacity: 0.9, '&:hover': { opacity: 1 } }}
                >
                  dangquockhanh2k5@gmail.com
                </Link>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-end' }, gap: 1 }}>
                <PhoneIcon sx={{ fontSize: 18, opacity: 0.9 }} />
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  (+84) 76 408 2335
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 1
        }}>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            © 2025 WineManu. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3 }}>
            <Link href="#" underline="hover" sx={{ color: 'inherit', opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Privacy Policy
            </Link>
            <Link href="#" underline="hover" sx={{ color: 'inherit', opacity: 0.8, '&:hover': { opacity: 1 } }}>
              Terms of Service
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}

export default Footer