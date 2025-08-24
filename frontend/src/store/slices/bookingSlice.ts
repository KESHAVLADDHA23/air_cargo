import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { BookingState, Booking, RouteResponse } from '../../types';

const initialState: BookingState = {
  currentBooking: null,
  myBookings: [],
  searchResults: null,
  isLoading: false,
  error: null,
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    searchStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    searchSuccess: (state, action: PayloadAction<RouteResponse>) => {
      state.isLoading = false;
      state.searchResults = action.payload;
      state.error = null;
    },
    searchFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    bookingStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    bookingSuccess: (state, action: PayloadAction<Booking>) => {
      state.isLoading = false;
      state.currentBooking = action.payload;
      // Add to myBookings if not already there
      const exists = state.myBookings.find(b => b.id === action.payload.id);
      if (!exists) {
        state.myBookings.unshift(action.payload);
      }
      state.error = null;
    },
    bookingFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setMyBookings: (state, action: PayloadAction<Booking[]>) => {
      state.myBookings = action.payload;
    },
    updateBookingStatus: (state, action: PayloadAction<{ id: number; status: string }>) => {
      // Update in myBookings
      const booking = state.myBookings.find(b => b.id === action.payload.id);
      if (booking) {
        booking.status = action.payload.status as any;
      }
      // Update currentBooking if it matches
      if (state.currentBooking && state.currentBooking.id === action.payload.id) {
        state.currentBooking.status = action.payload.status as any;
      }
    },
    clearSearchResults: (state) => {
      state.searchResults = null;
    },
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  searchStart,
  searchSuccess,
  searchFailure,
  bookingStart,
  bookingSuccess,
  bookingFailure,
  setMyBookings,
  updateBookingStatus,
  clearSearchResults,
  clearCurrentBooking,
  clearError,
} = bookingSlice.actions;

export default bookingSlice.reducer;