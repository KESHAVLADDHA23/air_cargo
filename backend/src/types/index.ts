export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
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
  airline_name?: string; // Airline name for display purposes
  airline_code?: string; // Airline code for display purposes
  origin: string; // Airport code e.g., "DEL", "BOM"
  destination: string; // Airport code e.g., "BLR", "HYD"
  departure_datetime: string; // ISO string
  arrival_datetime: string; // ISO string
  created_at: string;
  updated_at: string;
}

export enum BookingStatus {
  BOOKED = 'BOOKED',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface Booking {
  id: number;
  ref_id: string; // AC-YYYYMMDD-XXXX format
  user_id: number;
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  status: BookingStatus;
  flight_ids?: string; // JSON array of flight IDs for the route
  created_at: string;
  updated_at: string;
}

export enum TimelineEventType {
  CREATED = 'CREATED',
  DEPARTED = 'DEPARTED',
  ARRIVED = 'ARRIVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface TimelineEvent {
  id: number;
  booking_id: number;
  event_type: TimelineEventType;
  location?: string;
  flight_info?: string; // JSON string with flight details
  notes?: string;
  created_at: string;
}

export interface RouteRequest {
  origin: string;
  destination: string;
  departure_date: string; // YYYY-MM-DD format
}

export interface RouteResponse {
  direct_flights: Flight[];
  transit_routes: {
    first_flight: Flight;
    second_flight: Flight;
  }[];
}

export interface CreateBookingRequest {
  origin: string;
  destination: string;
  pieces: number;
  weight_kg: number;
  flight_ids: number[];
}

export interface BookingHistoryResponse {
  booking: Booking;
  timeline: TimelineEvent[];
  airline_details?: Airline[];
  flight_details?: Flight[];
}