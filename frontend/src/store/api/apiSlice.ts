import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '../index';
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  RouteRequest,
  RouteResponse,
  CreateBookingRequest,
  CreateBookingResponse,
  Booking,
  BookingHistoryResponse,
  UserBookingsResponse,
  User,
} from '../../types';

const baseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:3000/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['User', 'Booking', 'Route'],
  endpoints: (builder) => ({
    // Authentication endpoints
    signup: builder.mutation<AuthResponse, SignupRequest>({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    
    getProfile: builder.query<{ data: User }, void>({
      query: () => '/auth/profile',
      providesTags: ['User'],
    }),

    validateToken: builder.query<{ valid: boolean }, void>({
      query: () => '/auth/validate',
      providesTags: ['User'],
    }),

    // Route search endpoints
    searchRoutes: builder.query<RouteResponse, RouteRequest>({
      query: ({ origin, destination, departure_date }) => ({
        url: '/routes',
        params: { origin, destination, departure_date },
      }),
      providesTags: ['Route'],
    }),

    // Booking endpoints
    createBooking: builder.mutation<CreateBookingResponse, CreateBookingRequest>({
      query: (bookingData) => ({
        url: '/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Booking'],
    }),

    getMyBookings: builder.query<UserBookingsResponse, void>({
      query: () => '/bookings/my-bookings',
      providesTags: ['Booking'],
    }),

    getBookingHistory: builder.query<{ data: BookingHistoryResponse }, string>({
      query: (refId) => `/bookings/${refId}/history`,
      providesTags: (_result, _error, refId) => [{ type: 'Booking', id: refId }],
    }),

    trackBooking: builder.query<{ data: BookingHistoryResponse }, string>({
      query: (refId) => `/bookings/${refId}/history`,
      providesTags: (_result, _error, refId) => [{ type: 'Booking', id: refId }],
    }),

    departBooking: builder.mutation<
      { message: string; data: { booking: { ref_id: string; status: string; updated_at: string }; timeline: any[] } },
      { refId: string; location: string; flight_info?: any }
    >({
      query: ({ refId, location, flight_info }) => ({
        url: `/bookings/${refId}/depart`,
        method: 'PUT',
        body: { location, flight_info },
      }),
      invalidatesTags: (_result, _error, { refId }) => [
        { type: 'Booking', id: refId },
        'Booking',
      ],
    }),

    arriveBooking: builder.mutation<
      { message: string; data: { booking: { ref_id: string; status: string; updated_at: string }; timeline: any[] } },
      { refId: string; location: string; flight_info?: any }
    >({
      query: ({ refId, location, flight_info }) => ({
        url: `/bookings/${refId}/arrive`,
        method: 'PUT',
        body: { location, flight_info },
      }),
      invalidatesTags: (_result, _error, { refId }) => [
        { type: 'Booking', id: refId },
        'Booking',
      ],
    }),

    cancelBooking: builder.mutation<
      { message: string; data: { booking: { ref_id: string; status: string; updated_at: string }; timeline: any[] } },
      string
    >({
      query: (refId) => ({
        url: `/bookings/${refId}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: (_result, _error, refId) => [
        { type: 'Booking', id: refId },
        'Booking',
      ],
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useValidateTokenQuery,
  useSearchRoutesQuery,
  useLazySearchRoutesQuery,
  useCreateBookingMutation,
  useGetMyBookingsQuery,
  useGetBookingHistoryQuery,
  useTrackBookingQuery,
  useLazyTrackBookingQuery,
  useDepartBookingMutation,
  useArriveBookingMutation,
  useCancelBookingMutation,
} = apiSlice;