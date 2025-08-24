import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Stack,
  Divider,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
} from '@mui/material';
import {
  LocalShipping,
  Schedule,
  FlightTakeoff,
  FlightLand,
  CheckCircle,
  Cancel,
  Info,
  Search,
  FilterList,
  Visibility,
  Edit,
  Close,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { 
  useGetMyBookingsQuery, 
  useDepartBookingMutation,
  useArriveBookingMutation,
  useCancelBookingMutation 
} from '../../store/api/apiSlice';
import type { Booking, UserBookingsResponse } from '../../types';

const MyBookingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: bookingsData, isLoading, error, refetch } = useGetMyBookingsQuery();
  const [departBooking, { isLoading: isDeparting }] = useDepartBookingMutation();
  const [arriveBooking, { isLoading: isArriving }] = useArriveBookingMutation();
  const [cancelBooking, { isLoading: isCancelling }] = useCancelBookingMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Status update dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [location, setLocation] = useState('');
  const [flightInfo, setFlightInfo] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

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

  const filteredAndSortedBookings = React.useMemo(() => {
    if (!bookingsData?.data?.bookings) return [];
    
    let filtered = bookingsData.data.bookings.filter((booking: Booking) => {
      const matchesSearch = 
        booking.ref_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.destination.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'ALL' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    return filtered.sort((a: Booking, b: Booking) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'ref_id':
          aValue = a.ref_id;
          bValue = b.ref_id;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'updated_at':
        default:
          aValue = new Date(a.updated_at);
          bValue = new Date(b.updated_at);
          break;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [bookingsData, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleTrackBooking = (refId: string) => {
    navigate(`/tracking?ref_id=${refId}`);
  };

  const handleStatusChange = (booking: Booking) => {
    setSelectedBooking(booking);
    setNewStatus('');
    setLocation('');
    setFlightInfo('');
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setSelectedBooking(null);
    setNewStatus('');
    setLocation('');
    setFlightInfo('');
  };

  const getAvailableStatusOptions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'BOOKED':
        return [
          { value: 'DEPARTED', label: 'Mark as Departed' },
          { value: 'CANCELLED', label: 'Cancel Booking' }
        ];
      case 'DEPARTED':
        return [
          { value: 'ARRIVED', label: 'Mark as Arrived' }
        ];
      case 'ARRIVED':
      case 'DELIVERED':
      case 'CANCELLED':
        return [];
      default:
        return [];
    }
  };

  const handleConfirmStatusUpdate = async () => {
    if (!selectedBooking || !newStatus) return;

    try {
      let result;
      
      switch (newStatus) {
        case 'DEPARTED':
          if (!location.trim()) {
            setErrorMessage('Location is required for departure');
            return;
          }
          result = await departBooking({
            refId: selectedBooking.ref_id,
            location: location.trim(),
            flight_info: flightInfo.trim() || undefined
          }).unwrap();
          break;
          
        case 'ARRIVED':
          if (!location.trim()) {
            setErrorMessage('Location is required for arrival');
            return;
          }
          result = await arriveBooking({
            refId: selectedBooking.ref_id,
            location: location.trim(),
            flight_info: flightInfo.trim() || undefined
          }).unwrap();
          break;
          
        case 'CANCELLED':
          result = await cancelBooking(selectedBooking.ref_id).unwrap();
          break;
          
        default:
          setErrorMessage('Invalid status update');
          return;
      }
      
      setSuccessMessage(result.message || 'Status updated successfully');
      handleCloseStatusDialog();
      refetch(); // Refresh the bookings list
      
    } catch (error: any) {
      setErrorMessage(error?.data?.message || 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bookings
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress size={40} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading your bookings...
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Bookings
        </Typography>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load your bookings. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Bookings
      </Typography>
      
      {/* Filter and Search Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search Bookings"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by reference ID, origin, or destination"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={2}>
            <TextField
              fullWidth
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="BOOKED">Booked</MenuItem>
              <MenuItem value="DEPARTED">Departed</MenuItem>
              <MenuItem value="ARRIVED">Arrived</MenuItem>
              <MenuItem value="DELIVERED">Delivered</MenuItem>
              <MenuItem value="CANCELLED">Cancelled</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="updated_at">Last Updated</MenuItem>
              <MenuItem value="created_at">Date Created</MenuItem>
              <MenuItem value="ref_id">Reference ID</MenuItem>
              <MenuItem value="status">Status</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              select
              label="Order"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <MenuItem value="desc">Newest First</MenuItem>
              <MenuItem value="asc">Oldest First</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Bookings List */}
      {filteredAndSortedBookings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <LocalShipping sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          {bookingsData?.data?.bookings?.length === 0 ? (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Bookings Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                You haven't created any bookings yet. Start by searching for routes and creating your first booking.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/booking')}
                sx={{ mt: 2 }}
              >
                Create Your First Booking
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Matching Bookings
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No bookings match your current filters. Try adjusting your search or filter criteria.
              </Typography>
              <Button 
                variant="text" 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                sx={{ mt: 2 }}
              >
                Clear Filters
              </Button>
            </>
          )}
        </Paper>
      ) : (
        <Stack spacing={2}>
          {filteredAndSortedBookings.map((booking: Booking) => (
            <Card key={booking.id} variant="outlined">
              <CardContent>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <Typography variant="h6" component="div">
                      {booking.ref_id}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.origin} → {booking.destination}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Typography variant="body2" color="text.secondary">
                      Cargo Details
                    </Typography>
                    <Typography variant="body1">
                      {booking.pieces} piece(s)
                    </Typography>
                    <Typography variant="body1">
                      {booking.weight_kg} kg
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Chip
                      icon={getStatusIcon(booking.status)}
                      label={booking.status}
                      color={getStatusColor(booking.status) as any}
                      size="medium"
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Created: {formatDateTime(booking.created_at)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Updated: {formatDateTime(booking.updated_at)}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12} md={2}>
                    <Stack spacing={1}>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleTrackBooking(booking.ref_id)}
                      >
                        Track
                      </Button>
                      {getAvailableStatusOptions(booking.status).length > 0 && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Edit />}
                          onClick={() => handleStatusChange(booking)}
                          disabled={isDeparting || isArriving || isCancelling}
                        >
                          Change Status
                        </Button>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
      
      {/* Summary */}
      {filteredAndSortedBookings.length > 0 && (
        <Paper sx={{ p: 2, mt: 3, bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Showing {filteredAndSortedBookings.length} of {bookingsData?.data?.bookings?.length || 0} booking(s)
          </Typography>
        </Paper>
      )}
      
      {/* Status Update Dialog */}
      <Dialog 
        open={statusDialogOpen} 
        onClose={handleCloseStatusDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Update Booking Status
          {selectedBooking && (
            <Typography variant="body2" color="text.secondary">
              {selectedBooking.ref_id}
            </Typography>
          )}
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>New Status</InputLabel>
              <Select
                value={newStatus}
                label="New Status"
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {selectedBooking && getAvailableStatusOptions(selectedBooking.status).map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {(newStatus === 'DEPARTED' || newStatus === 'ARRIVED') && (
              <>
                <TextField
                  fullWidth
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={newStatus === 'DEPARTED' ? 'Departure location (e.g., DEL)' : 'Arrival location (e.g., BLR)'}
                  required
                  helperText="3-letter airport code"
                />
                
                <TextField
                  fullWidth
                  label="Flight Information (Optional)"
                  value={flightInfo}
                  onChange={(e) => setFlightInfo(e.target.value)}
                  placeholder="Flight number or additional details"
                  multiline
                  rows={2}
                />
              </>
            )}
            
            {newStatus === 'CANCELLED' && (
              <Alert severity="warning">
                This action cannot be undone. The booking will be marked as cancelled.
              </Alert>
            )}
            
            {errorMessage && (
              <Alert severity="error" onClose={() => setErrorMessage('')}>
                {errorMessage}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmStatusUpdate}
            variant="contained"
            disabled={!newStatus || isDeparting || isArriving || isCancelling}
          >
            {isDeparting || isArriving || isCancelling ? (
              <CircularProgress size={20} />
            ) : (
              'Update Status'
            )}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Success/Error Notifications */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage('')} 
          severity="success" 
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyBookingsPage;