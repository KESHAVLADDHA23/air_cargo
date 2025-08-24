import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search,
  LocalShipping,
  FlightTakeoff,
  FlightLand,
  CheckCircle,
  Cancel,
  Schedule,
  LocationOn,
  Info,
} from '@mui/icons-material';
import { useLazyTrackBookingQuery } from '../../store/api/apiSlice';
import type { BookingHistoryResponse, TimelineEvent, Flight as FlightType } from '../../types';

const TrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackBooking, { isLoading }] = useLazyTrackBookingQuery();
  
  const [refId, setRefId] = useState('');
  const [trackingData, setTrackingData] = useState<BookingHistoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');
  const [isAutoTracking, setIsAutoTracking] = useState(false);

  // Check for ref_id in URL parameters and auto-track
  useEffect(() => {
    const urlRefId = searchParams.get('ref_id');
    if (urlRefId) {
      setRefId(urlRefId.toUpperCase());
      // Auto-trigger tracking if the ref_id is valid
      if (/^AC-\d{8}-\d{4}$/.test(urlRefId)) {
        setIsAutoTracking(true);
        handleTrackWithRefId(urlRefId.toUpperCase());
      }
    }
  }, [searchParams]);

  const handleTrackWithRefId = async (refIdToTrack: string) => {
    try {
      setError(null);
      setValidationError('');
      
      const result = await trackBooking(refIdToTrack).unwrap();
      setTrackingData(result.data);
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'Tracking failed. Please check your reference ID.';
      setError(errorMessage);
      setTrackingData(null);
    } finally {
      setIsAutoTracking(false);
    }
  };

  const handleRefIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setRefId(value);
    
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const validateRefId = () => {
    if (!refId) {
      setValidationError('Booking reference ID is required');
      return false;
    }
    
    // Validate AC-YYYYMMDD-XXXX format
    if (!/^AC-\d{8}-\d{4}$/.test(refId)) {
      setValidationError('Please enter a valid booking reference (e.g., AC-20241225-0001)');
      return false;
    }
    
    return true;
  };

  const handleTrack = async () => {
    if (!validateRefId()) {
      return;
    }

    await handleTrackWithRefId(refId);
  };

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
        year: 'numeric',
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

  // Helper function to get the appropriate date for timeline events
  const getEventDate = (event: TimelineEvent, booking: any) => {
    // First try to use the event's created_at date
    if (event.created_at) {
      const formattedDate = formatDateTime(event.created_at);
      if (formattedDate !== 'Date not available' && formattedDate !== 'Invalid date') {
        return formattedDate;
      }
    }
    
    // Fallback to booking dates based on event type
    switch (event.event_type) {
      case 'CREATED':
        return formatDateTime(booking.created_at) + ' (Created)';
      case 'DEPARTED':
      case 'ARRIVED':
      case 'DELIVERED':
      case 'CANCELLED':
        return formatDateTime(booking.updated_at) + ' (Updated)';
      default:
        // Final fallback to booking created date
        return formatDateTime(booking.created_at) + ' (Estimated)';
    }
  };

  const getActiveStep = (status: string) => {
    switch (status) {
      case 'BOOKED': return 0;
      case 'DEPARTED': return 1;
      case 'ARRIVED': return 2;
      case 'DELIVERED': return 3;
      case 'CANCELLED': return -1;
      default: return 0;
    }
  };

  const BookingDetails = () => {
    if (!trackingData) return null;

    const { booking, flight_details = [], airline_details = [] } = trackingData;
    
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Booking Information
              </Typography>
              <Stack spacing={1}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Reference ID</Typography>
                  <Typography variant="body1" fontWeight="bold">{booking.ref_id}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Route</Typography>
                  <Typography variant="body1">{booking.origin} → {booking.destination}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Cargo Details</Typography>
                  <Typography variant="body1">{booking.pieces} piece(s), {booking.weight_kg} kg</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Status</Typography>
                  <Chip 
                    icon={getStatusIcon(booking.status)}
                    label={booking.status}
                    color={getStatusColor(booking.status) as any}
                    size="small"
                  />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Booking Created</Typography>
                  <Typography variant="body2">{formatDateTime(booking.created_at)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Last Updated</Typography>
                  <Typography variant="body2">{formatDateTime(booking.updated_at)}</Typography>
                </Box>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Flight Information
              </Typography>
              {flight_details.length > 0 ? (
                <Stack spacing={2}>
                  {flight_details.map((flight: FlightType, index: number) => {
                    const airline = airline_details.find(a => a.id === flight.airline_id);
                    return (
                      <Paper key={flight.id} variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2">
                              {airline?.name || 'Unknown Airline'} {flight.flight_number}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {flight.origin} → {flight.destination}
                            </Typography>
                          </Box>
                          <Box textAlign="right">
                            <Typography variant="body2">
                              Dep: {formatDateTime(flight.departure_datetime)}
                            </Typography>
                            <Typography variant="body2">
                              Arr: {formatDateTime(flight.arrival_datetime)}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Flight details not available
                </Typography>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const TrackingTimeline = () => {
    if (!trackingData) return null;

    const { booking, timeline } = trackingData;
    const activeStep = getActiveStep(booking.status);
    const isCancelled = booking.status === 'CANCELLED';

    const steps = [
      { label: 'Booking Confirmed', description: 'Your cargo booking has been confirmed' },
      { label: 'Departed', description: 'Cargo has departed from origin' },
      { label: 'Arrived', description: 'Cargo has arrived at destination' },
      { label: 'Delivered', description: 'Cargo has been delivered' },
    ];

    if (isCancelled) {
      return (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              Booking Cancelled
            </Typography>
            <Alert severity="error">
              This booking has been cancelled. Please contact customer service for more information.
            </Alert>
            
            {timeline.length > 0 && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Timeline Events
                </Typography>
                <Stack spacing={1}>
                  {timeline.map((event: TimelineEvent) => (
                    <Paper key={event.id} variant="outlined" sx={{ p: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {event.event_type}
                          </Typography>
                          {event.location && (
                            <Typography variant="body2" color="text.secondary">
                              <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                              {event.location}
                            </Typography>
                          )}
                          {event.notes && (
                            <Typography variant="body2">{event.notes}</Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {getEventDate(event, booking)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Tracking Progress
          </Typography>
          
          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((step, index) => {
              const stepEvent = timeline.find(e => {
                const eventMapping: Record<string, number> = {
                  'CREATED': 0,
                  'DEPARTED': 1,
                  'ARRIVED': 2,
                  'DELIVERED': 3,
                };
                return eventMapping[e.event_type] === index;
              });
              
              return (
                <Step key={step.label}>
                  <StepLabel>
                    <Box>
                      <Typography variant="body1">{step.label}</Typography>
                      {stepEvent && (
                        <Typography variant="caption" color="text.secondary">
                          {getEventDate(stepEvent, booking)}
                        </Typography>
                      )}
                    </Box>
                  </StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="text.secondary">
                      {step.description}
                    </Typography>
                    {stepEvent?.location && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        {stepEvent.location}
                      </Typography>
                    )}
                    {stepEvent?.notes && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {stepEvent.notes}
                      </Typography>
                    )}
                  </StepContent>
                </Step>
              );
            })}
          </Stepper>
          
          {timeline.length > 0 && (
            <Box mt={3}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                All Timeline Events
              </Typography>
              <Stack spacing={1}>
                {timeline.map((event: TimelineEvent) => (
                  <Paper key={event.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {event.event_type}
                        </Typography>
                        {event.location && (
                          <Typography variant="caption" color="text.secondary">
                            <LocationOn fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                            {event.location}
                          </Typography>
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {getEventDate(event, booking)}
                      </Typography>
                    </Stack>
                    {event.notes && (
                      <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                        {event.notes}
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Track Cargo
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Enter Booking Reference
        </Typography>
        
        {isAutoTracking && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Automatically tracking booking: {refId}...
          </Alert>
        )}
        
        <Box display="flex" gap={2} alignItems="flex-start">
          <TextField
            fullWidth
            label="Booking Reference ID"
            value={refId}
            onChange={handleRefIdChange}
            error={!!validationError}
            helperText={validationError || 'e.g., AC-20241225-0001'}
            placeholder="AC-20241225-0001"
            sx={{ maxWidth: 400 }}
          />
          
          <Button
            variant="contained"
            size="large"
            onClick={handleTrack}
            disabled={isLoading || isAutoTracking}
            startIcon={(isLoading || isAutoTracking) ? <CircularProgress size={20} /> : <Search />}
          >
            {(isLoading || isAutoTracking) ? 'Tracking...' : 'Track'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {trackingData && (
        <Box>
          <BookingDetails />
          <TrackingTimeline />
        </Box>
      )}

      {!trackingData && !error && !isLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Enter Your Booking Reference
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your cargo shipment by entering the booking reference ID provided when you made your booking.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default TrackingPage;