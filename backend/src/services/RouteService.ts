import database from '../database/connection';
import { Flight, RouteRequest, RouteResponse } from '../types';

export class RouteService {
  
  static async findRoutes(request: RouteRequest): Promise<RouteResponse> {
    const { origin, destination, departure_date } = request;
    
    // Find direct flights
    const directFlights = await this.findDirectFlights(origin, destination, departure_date);
    
    // Find 1-hop transit routes
    const transitRoutes = await this.findTransitRoutes(origin, destination, departure_date);
    
    return {
      direct_flights: directFlights,
      transit_routes: transitRoutes
    };
  }

  private static async findDirectFlights(origin: string, destination: string, departure_date: string): Promise<Flight[]> {
    const query = `
      SELECT f.*, a.name as airline_name, a.code as airline_code
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      WHERE f.origin = ? 
        AND f.destination = ? 
        AND DATE(f.departure_datetime) = ?
      ORDER BY f.departure_datetime ASC
    `;
    
    const flights = await database.all(query, [origin, destination, departure_date]);
    return flights;
  }

  private static async findTransitRoutes(
    origin: string, 
    destination: string, 
    departure_date: string
  ): Promise<{ first_flight: Flight; second_flight: Flight }[]> {
    
    // First, find all flights departing from origin on the given date
    const firstLegFlights = await database.all(`
      SELECT f.*, a.name as airline_name, a.code as airline_code
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      WHERE f.origin = ? 
        AND DATE(f.departure_datetime) = ?
        AND f.destination != ?
      ORDER BY f.departure_datetime ASC
    `, [origin, departure_date, destination]);

    const transitRoutes: { first_flight: Flight; second_flight: Flight }[] = [];

    // For each first leg flight, find connecting flights
    for (const firstFlight of firstLegFlights) {
      const transitHub = firstFlight.destination;
      const firstFlightArrival = new Date(firstFlight.arrival_datetime);
      
      // Calculate same day and next day for second leg
      const sameDay = this.formatDateToString(firstFlightArrival);
      const nextDay = this.formatDateToString(new Date(firstFlightArrival.getTime() + 24 * 60 * 60 * 1000));
      
      // Find second leg flights from transit hub to final destination
      // Must be on same day or next day, and depart after first flight arrives (with minimum connection time)
      const minimumConnectionTime = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
      const earliestDeparture = new Date(firstFlightArrival.getTime() + minimumConnectionTime);
      
      const secondLegFlights = await database.all(`
        SELECT f.*, a.name as airline_name, a.code as airline_code
        FROM flights f
        JOIN airlines a ON f.airline_id = a.id
        WHERE f.origin = ? 
          AND f.destination = ?
          AND (DATE(f.departure_datetime) = ? OR DATE(f.departure_datetime) = ?)
          AND f.departure_datetime >= ?
        ORDER BY f.departure_datetime ASC
        LIMIT 5
      `, [
        transitHub,
        destination,
        sameDay,
        nextDay,
        earliestDeparture.toISOString()
      ]);

      // Add valid transit routes
      for (const secondFlight of secondLegFlights) {
        const secondFlightDeparture = new Date(secondFlight.departure_datetime);
        const connectionTime = secondFlightDeparture.getTime() - firstFlightArrival.getTime();
        
        // Ensure reasonable connection time (2 hours to 24 hours)
        if (connectionTime >= minimumConnectionTime && connectionTime <= 24 * 60 * 60 * 1000) {
          transitRoutes.push({
            first_flight: firstFlight,
            second_flight: secondFlight
          });
        }
      }
    }

    // Sort by total travel time and limit results
    transitRoutes.sort((a, b) => {
      const totalTimeA = new Date(a.second_flight.arrival_datetime).getTime() - new Date(a.first_flight.departure_datetime).getTime();
      const totalTimeB = new Date(b.second_flight.arrival_datetime).getTime() - new Date(b.first_flight.departure_datetime).getTime();
      return totalTimeA - totalTimeB;
    });

    // Return top 10 transit routes
    return transitRoutes.slice(0, 10);
  }

  private static formatDateToString(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  static async getFlightDetails(flightIds: number[]): Promise<Flight[]> {
    if (!flightIds || flightIds.length === 0) {
      return [];
    }

    const placeholders = flightIds.map(() => '?').join(',');
    const query = `
      SELECT f.*, a.name as airline_name, a.code as airline_code
      FROM flights f
      JOIN airlines a ON f.airline_id = a.id
      WHERE f.id IN (${placeholders})
      ORDER BY f.departure_datetime ASC
    `;
    
    const flights = await database.all(query, flightIds);
    return flights;
  }

  static async validateFlightSequence(flightIds: number[]): Promise<{ valid: boolean; error?: string }> {
    if (!flightIds || flightIds.length === 0) {
      return { valid: false, error: 'No flights provided' };
    }

    const flights = await this.getFlightDetails(flightIds);
    
    if (flights.length !== flightIds.length) {
      return { valid: false, error: 'Some flights not found' };
    }

    // Sort flights by departure time
    flights.sort((a, b) => new Date(a.departure_datetime).getTime() - new Date(b.departure_datetime).getTime());

    // Validate sequence
    for (let i = 0; i < flights.length - 1; i++) {
      const currentFlight = flights[i];
      const nextFlight = flights[i + 1];

      // Check if destination of current flight matches origin of next flight
      if (currentFlight.destination !== nextFlight.origin) {
        return { 
          valid: false, 
          error: `Route break: ${currentFlight.destination} != ${nextFlight.origin}` 
        };
      }

      // Check minimum connection time (2 hours)
      const arrivalTime = new Date(currentFlight.arrival_datetime).getTime();
      const departureTime = new Date(nextFlight.departure_datetime).getTime();
      const connectionTime = departureTime - arrivalTime;

      if (connectionTime < 2 * 60 * 60 * 1000) { // 2 hours
        return { 
          valid: false, 
          error: 'Insufficient connection time between flights' 
        };
      }

      // Check if next flight is within allowed timeframe (same day or next day)
      const maxConnectionTime = 24 * 60 * 60 * 1000; // 24 hours
      if (connectionTime > maxConnectionTime) {
        return { 
          valid: false, 
          error: 'Connection time too long between flights' 
        };
      }
    }

    return { valid: true };
  }
}