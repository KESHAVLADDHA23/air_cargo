import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search,
  Flight,
  AccessTime,
  LocationOn,
  FlightTakeoff,
  FlightLand,
  SwapHoriz,
} from '@mui/icons-material';
import { useLazySearchRoutesQuery } from '../../store/api/apiSlice';
import { searchStart, searchSuccess, searchFailure } from '../../store/slices/bookingSlice';
import type { RouteSearchForm, Flight as FlightType } from '../../types';

const SearchPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchRoutes, { isLoading }] = useLazySearchRoutesQuery();
  
  const [formData, setFormData] = useState<RouteSearchForm>({
    origin: '',
    destination: '',
    departure_date: new Date().toISOString().split('T')[0], // Today's date
  });
  
  const [searchResults, setSearchResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.origin) {
      errors.origin = 'Origin airport code is required';
    } else if (!/^[A-Z]{3}$/.test(formData.origin)) {
      errors.origin = 'Please enter a valid 3-letter airport code (e.g., DEL)';
    }
    
    if (!formData.destination) {
      errors.destination = 'Destination airport code is required';
    } else if (!/^[A-Z]{3}$/.test(formData.destination)) {
      errors.destination = 'Please enter a valid 3-letter airport code (e.g., BLR)';
    }
    
    if (formData.origin === formData.destination) {
      errors.destination = 'Destination must be different from origin';
    }
    
    if (!formData.departure_date) {
      errors.departure_date = 'Departure date is required';
    } else if (new Date(formData.departure_date) < new Date()) {
      errors.departure_date = 'Departure date cannot be in the past';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSearch = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      dispatch(searchStart());
      setError(null);
      
      const result = await searchRoutes(formData).unwrap();
      
      dispatch(searchSuccess(result));
      setSearchResults(result);
    } catch (err: any) {
      const errorMessage = err?.data?.message || 'Search failed. Please try again.';
      dispatch(searchFailure(errorMessage));
      setError(errorMessage);
    }
  };

  const handleSwapAirports = () => {
    setFormData(prev => ({
      ...prev,
      origin: prev.destination,
      destination: prev.origin,
    }));
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
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

  const FlightCard: React.FC<{ flight: FlightType; isTransit?: boolean }> = ({ flight, isTransit = false }) => (
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ pb: 1 }}>
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
    </Card>
  );

  const DirectFlightResults = () => {
    if (!searchResults?.data?.results?.direct_flights?.flights?.length) return null;
    
    return (
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>
          <Flight sx={{ mr: 1, verticalAlign: 'middle' }} />
          Direct Flights ({searchResults.data.results.direct_flights.count})
        </Typography>
        
        {searchResults.data.results.direct_flights.flights.map((flight: FlightType) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </Box>
    );
  };

  const TransitFlightResults = () => {
    if (!searchResults?.data?.results?.transit_routes?.routes?.length) return null;
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          <SwapHoriz sx={{ mr: 1, verticalAlign: 'middle' }} />
          Transit Routes ({searchResults.data.results.transit_routes.count})
        </Typography>
        
        {searchResults.data.results.transit_routes.routes.map((route: any, index: number) => (
          <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Via {route.transit_hub} • Total Duration: {formatDuration(route.total_duration_minutes)}
            </Typography>
            
            <FlightCard flight={route.first_flight} isTransit />
            
            <Box textAlign="center" py={1}>
              <Chip 
                label={`${formatDuration(route.connection_time_minutes)} layover in ${route.transit_hub}`}
                size="small"
                color="info"
                variant="outlined"
              />
            </Box>
            
            <FlightCard flight={route.second_flight} isTransit />
          </Paper>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Search Routes
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Find Available Flights
        </Typography>
        
        <Grid container spacing={3} alignItems="flex-end">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Origin Airport"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
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
              disabled={isLoading}
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
              onChange={handleChange}
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
              value={formData.departure_date}
              onChange={handleChange}
              error={!!validationErrors.departure_date}
              helperText={validationErrors.departure_date}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
        
        <Box mt={3}>
          <Button
            variant="contained"
            size="large"
            onClick={handleSearch}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Search />}
          >
            {isLoading ? 'Searching...' : 'Search Flights'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {searchResults && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Search Results
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {formData.origin} → {formData.destination} on {new Date(formData.departure_date).toLocaleDateString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
            Found {searchResults.data.total_options} flight option(s)
          </Typography>
          
          <Divider sx={{ mb: 3 }} />
          
          <DirectFlightResults />
          <TransitFlightResults />
          
          {searchResults.data.total_options === 0 && (
            <Alert severity="info">
              No flights found for the selected route and date. Please try different airports or dates.
            </Alert>
          )}
          
          {searchResults.data.total_options > 0 && (
            <Alert severity="success" sx={{ mt: 2 }}>
              🚀 Found {searchResults.data.total_options} flight option(s)! 
              <Button 
                variant="text" 
                size="small" 
                onClick={() => navigate('/booking')}
                sx={{ ml: 1 }}
              >
                Create Booking Now
              </Button>
            </Alert>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default SearchPage;