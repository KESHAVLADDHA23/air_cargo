import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Stack,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocalShipping,
  Search,
  TrackChanges,
  Dashboard as DashboardIcon,
  Schedule,
  FlightTakeoff,
  FlightLand,
  CheckCircle,
  Cancel,
  Info,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { RootState } from '../../store';
import type { Booking } from '../../types';
import { useGetMyBookingsQuery } from '../../store/api/apiSlice';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: bookingsData, isLoading: bookingsLoading, error: bookingsError } = useGetMyBookingsQuery();


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'BOOKED': return 'info';
      case 'DEPARTED': return 'warning';
      case 'ARRIVED': return 'primary';
      case 'DELIVERED': return 'success';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'BOOKED': return <Schedule />;
      case 'DEPARTED': return <FlightTakeoff />;
      case 'ARRIVED': return <FlightLand />;
      case 'DELIVERED': return <CheckCircle />;
      case 'CANCELLED': return <Cancel />;
      default: return <Info />;
    }
  };

  const formatDateTime = (datetime: string | undefined | null) => {
    if (!datetime) {
      return 'Date not available';
    }
    
    try {
      // Handle SQLite datetime format or ISO string
      let dateObj: Date;
      
      // SQLite CURRENT_TIMESTAMP format: '2024-01-15 14:30:25'
      // ISO format: '2024-01-15T14:30:25.000Z'
      if (datetime.includes('T')) {
        // Already in ISO format
        dateObj = new Date(datetime);
      } else {
        // SQLite format, convert to ISO
        const isoString = datetime.replace(' ', 'T') + 'Z';
        dateObj = new Date(isoString);
      }
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        console.warn('Invalid date format:', datetime);
        return 'Invalid date';
      }
      
      return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.warn('Error formatting date:', datetime, error);
      return 'Invalid date';
    }
  };

  // Sort bookings by updated_at in descending order (most recent first)
  const sortedBookings = React.useMemo(() => {
    if (!bookingsData?.data?.bookings || !Array.isArray(bookingsData.data.bookings)) {
      return [];
    }
    
    return [...bookingsData.data.bookings].sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  }, [bookingsData]);

  const quickActions = [
    {
      title: 'Search Routes',
      description: 'Find available flights for your cargo shipment',
      icon: <Search fontSize="large" />,
      action: () => navigate('/search'),
      color: 'primary.main',
    },
    {
      title: 'My Bookings',
      description: 'View and manage your existing bookings',
      icon: <LocalShipping fontSize="large" />,
      action: () => navigate('/my-bookings'),
      color: 'secondary.main',
    },
    {
      title: 'Create Booking',
      description: 'Book cargo shipment on available flights',
      icon: <LocalShipping fontSize="large" />,
      action: () => navigate('/booking'),
      color: 'warning.main',
    },
    {
      title: 'Track Cargo',
      description: 'Track your shipments using booking reference ID',
      icon: <TrackChanges fontSize="large" />,
      action: () => navigate('/tracking'),
      color: 'success.main',
    },
  ];

  return (
    <Box>
      <Box mb={4}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <DashboardIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome back, {user?.username}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your air cargo bookings and track shipments
            </Typography>
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
                ...(index === 0 && {
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  color: 'white',
                  '& .MuiTypography-root': {
                    color: 'white',
                  },
                }),
                ...(index === 3 && {
                  background: 'linear-gradient(135deg, #ed6c02 0%, #ff9800 100%)',
                  color: 'white',
                  '& .MuiTypography-root': {
                    color: 'white',
                  },
                }),
              }}
              onClick={action.action}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', p: 3 }}>
                <Box
                  sx={{
                    color: action.color,
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {action.description}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.action();
                  }}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box mt={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Recent Activity
          </Typography>
          {sortedBookings.length > 0 && (
            <Button 
              variant="text" 
              size="small" 
              onClick={() => navigate('/my-bookings')}
            >
              View All
            </Button>
          )}
        </Box>
        
        {bookingsLoading ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading your bookings...
              </Typography>
            </CardContent>
          </Card>
        ) : bookingsError ? (
          <Alert severity="error">
            Failed to load your recent bookings. Please try again later.
          </Alert>
        ) : !sortedBookings || sortedBookings.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary" align="center" py={2}>
                No recent activity. Start by searching routes or creating your first booking.
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                💡 Tip: Try tracking with sample reference: <strong>AC-20241225-0001</strong>
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent sx={{ p: 0 }}>
              <Stack divider={<Divider />}>
                {sortedBookings.slice(0, 5).map((booking: Booking, index: number) => (
                  <Box
                    key={booking.id}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => navigate(`/tracking?ref_id=${booking.ref_id}`)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {booking.ref_id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {booking.origin} → {booking.destination}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {booking.pieces} piece(s), {booking.weight_kg} kg
                        </Typography>
                      </Box>
                      
                      <Box textAlign="right">
                        <Chip
                          icon={getStatusIcon(booking.status)}
                          label={booking.status}
                          color={getStatusColor(booking.status) as any}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block">
                          Updated: {formatDateTime(booking.updated_at)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                ))}
              </Stack>
              
              {sortedBookings.length > 5 && (
                <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'action.hover' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => navigate('/my-bookings')}
                  >
                    View {sortedBookings.length - 5} more booking{sortedBookings.length - 5 > 1 ? 's' : ''}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;