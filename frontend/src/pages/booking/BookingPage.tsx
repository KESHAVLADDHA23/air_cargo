import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Checkbox,
  FormControlLabel,
  Divider,
  Stack,
  Chip,
} from '@mui/material';
import {
  Flight,
  LocalShipping,
  CheckCircle,
  ArrowForward,
  Scale,
  Inventory,
  FlightTakeoff,
  FlightLand,
  SwapHoriz,
} from '@mui/icons-material';
import { useCreateBookingMutation, useLazySearchRoutesQuery } from '../../store/api/apiSlice';
import type { RootState } from '../../store';
import type { BookingForm, Flight as FlightType, RouteResponse, CreateBookingResponse } from '../../types';

const BookingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const [searchRoutes, { isLoading: isSearching }] = useLazySearchRoutesQuery();
  const [createBooking, { isLoading: isCreating }] = useCreateBookingMutation();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<BookingForm>({
    origin: '',
    destination: '',
    pieces: 1,
    weight_kg: 1,
    selectedFlights: [],
  });
  
  const [searchData, setSearchData] = useState({
    departure_date: new Date().toISOString().split('T')[0],
  });
  
  const [searchResults, setSearchResults] = useState<RouteResponse | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const steps = ['Route & Cargo Details', 'Select Flights', 'Confirm Booking'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'departure_date') {
      setSearchData(prev => ({ ...prev, [name]: value }));
    } else if (name === 'origin' || name === 'destination') {
      setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    } else if (name === 'pieces' || name === 'weight_kg') {
      setFormData(prev => ({ ...prev, [name]: Math.max(1, parseInt(value) || 1) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStep1 = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.origin) {
      errors.origin = 'Origin airport code is required';
    } else if (!/^[A-Z]{3}$/.test(formData.origin)) {
      errors.origin = 'Please enter a valid 3-letter airport code';
    }
    
    if (!formData.destination) {
      errors.destination = 'Destination airport code is required';
    } else if (!/^[A-Z]{3}$/.test(formData.destination)) {
      errors.destination = 'Please enter a valid 3-letter airport code';
    }
    
    if (formData.origin === formData.destination) {
      errors.destination = 'Destination must be different from origin';
    }
    
    if (!searchData.departure_date) {
      errors.departure_date = 'Departure date is required';
    } else if (new Date(searchData.departure_date) < new Date()) {
      errors.departure_date = 'Departure date cannot be in the past';
    }
    
    if (formData.pieces < 1) {
      errors.pieces = 'At least 1 piece is required';
    }
    
    if (formData.weight_kg < 1) {
      errors.weight_kg = 'Weight must be at least 1 kg';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    if (formData.selectedFlights.length === 0) {
      setError('Please select at least one flight for your booking');
      return false;
    }
    setError(null);
    return true;
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!validateStep1()) return;
      
      try {
        setError(null);
        const result = await searchRoutes({
          origin: formData.origin,
          destination: formData.destination,
          departure_date: searchData.departure_date,
        }).unwrap();
        
        setSearchResults(result);
        setActiveStep(1);
      } catch (err: any) {
        setError(err?.data?.message || 'Failed to search flights. Please try again.');
      }
    } else if (activeStep === 1) {
      if (!validateStep2()) return;
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError(null);
  };

  const handleFlightSelection = (flightId: number, isSelected: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedFlights: isSelected
        ? [...prev.selectedFlights, flightId]
        : prev.selectedFlights.filter(id => id !== flightId),
    }));
  };

  const handleConfirmBooking = async () => {
    try {
      setError(null);
      
      const bookingData = {
        origin: formData.origin,
        destination: formData.destination,
        pieces: formData.pieces,
        weight_kg: formData.weight_kg,
        flight_ids: formData.selectedFlights,
      };
      
      const result: CreateBookingResponse = await createBooking(bookingData).unwrap();
      
      setSuccess(`Booking created successfully! Reference ID: ${result.data.booking.ref_id}`);
      
      // Navigate to tracking page after 3 seconds
      setTimeout(() => {
        navigate('/tracking');
      }, 3000);
      
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to create booking. Please try again.');
    }
  };

  const handleSwapAirports = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getSelectedFlights = () => {
    if (!searchResults) return [];
    
    const allFlights = [
      ...searchResults.data.results.direct_flights.flights,
      ...searchResults.data.results.transit_routes.routes.flatMap(route => [
        route.first_flight,
        route.second_flight,
      ]),
    ];
    
    return allFlights.filter(flight => formData.selectedFlights.includes(flight.id));
  };

  const FlightCard: React.FC<{ 
    flight: FlightType; 
    isSelected: boolean; 
    onSelect: (id: number, selected: boolean) => void;
    disabled?: boolean;
  }> = ({ flight, isSelected, onSelect, disabled = false }) => (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        border: isSelected ? 2 : 1,
        borderColor: isSelected ? 'primary.main' : 'grey.300',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" component="div">
              {flight.airline_name} {flight.flight_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {flight.airline_code}
            </Typography>
          </Box>
          
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box textAlign="center">
              <Typography variant="body1" fontWeight="bold">
                {flight.origin}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(flight.departure_datetime)}
              </Typography>
            </Box>
            
            <Box textAlign="center">
              <FlightTakeoff color="primary" />
              <Typography variant="caption" display="block">
                {flight.duration_minutes ? formatDuration(flight.duration_minutes) : 'N/A'}
              </Typography>
              <FlightLand color="primary" />
            </Box>
            
            <Box textAlign="center">
              <Typography variant="body1" fontWeight="bold">
                {flight.destination}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDateTime(flight.arrival_datetime)}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
      <CardActions>
        <FormControlLabel
          control={
            <Checkbox
              checked={isSelected}
              onChange={(e) => onSelect(flight.id, e.target.checked)}
              disabled={disabled}
            />
          }
          label="Select this flight"
        />
      </CardActions>
    </Card>
  );

  const StepContent1 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Route Information
      </Typography>
      
      <Grid container spacing={3} alignItems="flex-end" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Origin Airport"
            name="origin"
            value={formData.origin}
            onChange={handleInputChange}
            error={!!validationErrors.origin}
            helperText={validationErrors.origin || 'e.g., DEL, BOM, CCU'}
            placeholder="DEL"
            inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
          />
        </Grid>
        
        <Grid item xs={12} sm={1} sx={{ textAlign: 'center' }}>
          <Button
            onClick={handleSwapAirports}
            sx={{ minWidth: 'auto', p: 1 }}
          >
            <SwapHoriz />
          </Button>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Destination Airport"
            name="destination"
            value={formData.destination}
            onChange={handleInputChange}
            error={!!validationErrors.destination}
            helperText={validationErrors.destination || 'e.g., BLR, HYD, MAA'}
            placeholder="BLR"
            inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
          />
        </Grid>
        
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            label="Departure Date"
            name="departure_date"
            type="date"
            value={searchData.departure_date}
            onChange={handleInputChange}
            error={!!validationErrors.departure_date}
            helperText={validationErrors.departure_date}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Cargo Details
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Number of Pieces"
            name="pieces"
            type="number"
            value={formData.pieces}
            onChange={handleInputChange}
            error={!!validationErrors.pieces}
            helperText={validationErrors.pieces || 'Total number of packages'}
            InputProps={{
              startAdornment: <Inventory sx={{ mr: 1, color: 'action.active' }} />,
              inputProps: { min: 1, max: 999 },
            }}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Total Weight (kg)"
            name="weight_kg"
            type="number"
            value={formData.weight_kg}
            onChange={handleInputChange}
            error={!!validationErrors.weight_kg}
            helperText={validationErrors.weight_kg || 'Total weight in kilograms'}
            InputProps={{
              startAdornment: <Scale sx={{ mr: 1, color: 'action.active' }} />,
              inputProps: { min: 1, max: 99999 },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );

  const StepContent2 = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Available Flights
      </Typography>
      
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Select the flights for your cargo shipment from {formData.origin} to {formData.destination}
      </Typography>
      
      {(searchResults?.data?.results?.direct_flights?.flights?.length ?? 0) > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            <Flight sx={{ mr: 1, verticalAlign: 'middle' }} />
            Direct Flights ({searchResults?.data?.results?.direct_flights?.count ?? 0})
          </Typography>
          
          {searchResults?.data?.results?.direct_flights?.flights?.map((flight: FlightType) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              isSelected={formData.selectedFlights.includes(flight.id)}
              onSelect={handleFlightSelection}
            />
          ))}
        </Box>
      )}
      
      {(searchResults?.data?.results?.transit_routes?.routes?.length ?? 0) > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            <SwapHoriz sx={{ mr: 1, verticalAlign: 'middle' }} />
            Transit Routes ({searchResults?.data?.results?.transit_routes?.count ?? 0})
          </Typography>
          
          {searchResults?.data?.results?.transit_routes?.routes?.map((route: any, index: number) => (
            <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Via {route.transit_hub} • Total Duration: {formatDuration(route.total_duration_minutes)}
              </Typography>
              
              <FlightCard
                flight={route.first_flight}
                isSelected={formData.selectedFlights.includes(route.first_flight.id)}
                onSelect={handleFlightSelection}
              />
              
              <Box textAlign="center" py={1}>
                <Chip 
                  label={`${formatDuration(route.connection_time_minutes)} layover in ${route.transit_hub}`}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              </Box>
              
              <FlightCard
                flight={route.second_flight}
                isSelected={formData.selectedFlights.includes(route.second_flight.id)}
                onSelect={handleFlightSelection}
              />
            </Paper>
          ))}
        </Box>
      )}
      
      {searchResults?.data?.total_options === 0 && (
        <Alert severity="info">
          No flights found for the selected route and date. Please go back and try different airports or dates.
        </Alert>
      )}
    </Box>
  );

  const StepContent3 = () => {
    const selectedFlights = getSelectedFlights();
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Booking Summary
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Route & Cargo Details
                </Typography>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Route</Typography>
                    <Typography variant="body1">{formData.origin} → {formData.destination}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Departure Date</Typography>
                    <Typography variant="body1">{new Date(searchData.departure_date).toLocaleDateString()}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Cargo</Typography>
                    <Typography variant="body1">{formData.pieces} piece(s), {formData.weight_kg} kg</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{user?.username} ({user?.email})</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Flights ({selectedFlights.length})
                </Typography>
                <Stack spacing={1}>
                  {selectedFlights.map((flight: FlightType) => (
                    <Paper key={flight.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Typography variant="body2" fontWeight="bold">
                        {flight.airline_name} {flight.flight_number}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {flight.origin} → {flight.destination}
                      </Typography>
                      <Typography variant="caption" display="block">
                        Dep: {formatDateTime(flight.departure_datetime)}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Alert severity="info" sx={{ mt: 3 }}>
          Please review your booking details carefully. Once confirmed, you will receive a booking reference ID for tracking.
        </Alert>
      </Box>
    );
  };

  if (success) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Booking Successful!
        </Typography>
        
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom color="success.main">
            Booking Created Successfully!
          </Typography>
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
          <Typography variant="body1" gutterBottom>
            You will be redirected to the tracking page automatically, or you can navigate manually.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate('/tracking')}
            sx={{ mt: 2 }}
          >
            Go to Tracking
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Create Booking
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
              <StepContent>
                {index === 0 && <StepContent1 />}
                {index === 1 && <StepContent2 />}
                {index === 2 && <StepContent3 />}
                
                {error && (
                  <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                    {error}
                  </Alert>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <Button
                    disabled={index === 0}
                    onClick={handleBack}
                    sx={{ mr: 1 }}
                  >
                    Back
                  </Button>
                  
                  {index === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      onClick={handleConfirmBooking}
                      disabled={isCreating}
                      startIcon={isCreating ? <CircularProgress size={20} /> : <LocalShipping />}
                    >
                      {isCreating ? 'Creating Booking...' : 'Confirm Booking'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={isSearching}
                      startIcon={isSearching ? <CircularProgress size={20} /> : <ArrowForward />}
                    >
                      {isSearching ? 'Searching...' : 'Next'}
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Paper>
    </Box>
  );
};

export default BookingPage;