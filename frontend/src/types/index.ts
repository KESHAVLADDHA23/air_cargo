// Frontend types that match the backend API

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Airline {
  id: number;
  code: string; // e.g., "AI", "6E", "SG"
  name: string; // e.g., "Air India", "IndiGo", "SpiceJet"
  created_at: string;
  updated_at: string;
}

export interface Flight {
  id: number;
  flight_number: string; // e.g., "AI101", "6E234"
  airline_id: number;
  airline_name?: string; // For display purposes
  airline_code?: string; // For display purposes
  origin: string; // Airport code e.g., "DEL", "BOM"
  destination: string; // Airport code e.g., "BLR", "HYD"
  departure_datetime: string; // ISO string
  arrival_datetime: string; // ISO string
  duration_minutes?: number; // Calculated duration
  created_at: string;
  updated_at: string;
}

export const BookingStatus = {
  BOOKED: 'BOOKED',
  DEPARTED: 'DEPARTED',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export interface Booking {
  id: number;
  ref_id: string; // AC-YYYYMMDD-XXXX format
  user_id: number;
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  status: BookingStatus;
  flight_ids?: string; // JSON array of flight IDs
  created_at: string;
  updated_at: string;
}

export const TimelineEventType = {
  CREATED: 'CREATED',
  DEPARTED: 'DEPARTED',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;

export type TimelineEventType = typeof TimelineEventType[keyof typeof TimelineEventType];

export interface TimelineEvent {
  id: number;
  booking_id: number;
  event_type: TimelineEventType;
  location?: string;
  flight_info?: string; // JSON string with flight details
  notes?: string;
  timestamp?: string; // For display
  display_text?: string; // For display
  created_at: string;
}

// API Request/Response types
export interface RouteRequest {
  origin: string;
  destination: string;
  departure_date: string; // YYYY-MM-DD format
}

export interface RouteResponse {
  message: string;
  data: {
    search_criteria: RouteRequest;
    results: {
      direct_flights: {
        count: number;
        flights: Flight[];
      };
      transit_routes: {
        count: number;
        routes: {
          first_flight: Flight;
          second_flight: Flight;
          total_duration_minutes: number;
          connection_time_minutes: number;
          transit_hub: string;
        }[];
      };
    };
    total_options: number;
  };
}

export interface CreateBookingRequest {
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  flight_ids: number[];
}

export interface CreateBookingResponse {
  message: string;
  data: {
    booking: {
      ref_id: string;
      origin: string;
      destination: string;
      pieces: number;
      weight_kg: number;
      status: BookingStatus;
      created_at: string;
    };
    flights: Flight[];
    timeline: TimelineEvent[];
  };
}

export interface BookingHistoryResponse {
  booking: Booking;
  timeline: TimelineEvent[];
  flight_details?: Flight[];
  airline_details?: Airline[];
}

export interface UserBookingsResponse {
  message: string;
  data: {
    bookings: Booking[];
    count: number;
  };
}

export interface AuthResponse {
  message: string;
  data: {
    user: User;
    token: string;
    expires_in: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

// UI State types
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface BookingState {
  currentBooking: Booking | null;
  myBookings: Booking[];
  searchResults: RouteResponse | null;
  isLoading: boolean;
  error: string | null;
}

export interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
}

// Form types
export interface RouteSearchForm {
  origin: string;
  destination: string;
  departure_date: string;
}

export interface BookingForm {
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  selectedFlights: number[];
}