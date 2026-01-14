import React, { useEffect } from 'react'
import { useTeamStore } from '../stores/useTeamStore'
import { useAuthStore } from '../stores/useAuthStore'
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  IconButton,
  Divider,
  CircularProgress,
  useTheme,
  Toolbar
} from '@mui/material'
import StarIcon from '@mui/icons-material/Star'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import EngineeringIcon from '@mui/icons-material/Engineering'
import ScienceIcon from '@mui/icons-material/Science'
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount'
import Header from '../Components/Header'
import Footer from '../Components/Footer'

const RoleSection = ({ title, members, icon, currentUser, isOwner, onRemove }) => {
  const theme = useTheme()

  if (members.length === 0) return null

  return (
    <Box mb={4}>
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        {icon}
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
        <Chip label={members.length} size="small" color="primary" variant="outlined" />
      </Box>
      <Grid container spacing={3}>
        {members.map((member) => (
          <Grid item xs={12} sm={6} md={4} key={member.user_id}>
            <Card
              sx={{
                position: 'relative',
                height: '100%',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4]
                }
              }}
            >

              {/* Remove Button */}
              {isOwner && member.user_id !== currentUser.user_id && (
                <IconButton
                  size="small"
                  onClick={() => onRemove(member.user_id)}
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: member.user_id === member.owner_id ? 40 : 12,
                    color: theme.palette.error.main,
                    bgcolor: theme.palette.error.lighter,
                    '&:hover': {
                      bgcolor: theme.palette.background.paper
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}

              <CardContent>
                <Box display="flex" flexDirection="column" gap={1.5}>
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar
                      sx={{
                        bgcolor: theme.palette.primary.main,
                        width: 56,
                        height: 56
                      }}
                    >
                      {member.firstname?.[0]}{member.lastname?.[0]}
                    </Avatar>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h6" fontWeight="bold">
                          {member.firstname} {member.lastname}
                        </Typography>
                        {/* Owner Star */}
                        {member.user_id === member.owner_id && (
                          <Box
                            sx={{
                              color: '#FFD700',
                              zIndex: 1
                            }}
                          >
                            <StarIcon />
                          </Box>
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {member.email}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider />

                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Experience
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {member.exp_year} years
                      </Typography>
                    </Box>

                    {/* Role Specific Fields */}
                    {member.role === 'manager' && member.department_leading && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Department
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {member.department_leading}
                        </Typography>
                      </Box>
                    )}

                    {member.role === 'engineer' && member.expertise && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Expertise
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {member.expertise}
                        </Typography>
                      </Box>
                    )}

                    {member.role === 'tester' && member.flavor_profile && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Flavor Profile
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {member.flavor_profile}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

const Team = () => {
  const { members, loading, fetchTeam, removeMember } = useTeamStore()
  const { user } = useAuthStore()

  useEffect(() => {
    fetchTeam()
  }, [])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  const managers = members.filter(m => m.role === 'manager')
  const engineers = members.filter(m => m.role === 'engineer')
  const testers = members.filter(m => m.role === 'tester')

  // Check if current user is owner.
  // We can check if any member has owner_id === user.user_id
  const isOwner = members.length > 0 && members[0].owner_id === user?.user_id

  const handleRemove = (userId) => {
    if (window.confirm('Are you sure you want to remove this member from the warehouse?')) {
      removeMember(userId)
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Toolbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Box mb={4}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Warehouse Team
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Meet the dedicated professionals managing Warehouse #{user?.warehouse_id}
          </Typography>
        </Box>

        <RoleSection
          title="Managers"
          members={managers}
          icon={<SupervisorAccountIcon color="primary" fontSize="large" />}
          currentUser={user}
          isOwner={isOwner}
          onRemove={handleRemove}
        />

        <RoleSection
          title="Engineers"
          members={engineers}
          icon={<EngineeringIcon color="primary" fontSize="large" />}
          currentUser={user}
          isOwner={isOwner}
          onRemove={handleRemove}
        />

        <RoleSection
          title="Testers"
          members={testers}
          icon={<ScienceIcon color="primary" fontSize="large" />}
          currentUser={user}
          isOwner={isOwner}
          onRemove={handleRemove}
        />
      </Container>
      <Footer />
    </Box>
  )
}

export default Team
