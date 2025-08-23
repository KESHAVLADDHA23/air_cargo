import { Request, Response } from 'express';
import { RouteService } from '../services/RouteService';
import { RouteRequest } from '../types';

export class RoutesController {
  
  static async searchRoutes(req: Request, res: Response): Promise<void | Response> {
    try {
      const { origin, destination, departure_date } = req.query as any;

      const routeRequest: RouteRequest = {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_date
      };

      // Validate that origin and destination are different
      if (routeRequest.origin === routeRequest.destination) {
        return res.status(400).json({
          error: 'Invalid route',
          message: 'Origin and destination cannot be the same'
        });
      }

      // Validate departure date is not in the past
      const requestDate = new Date(departure_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (requestDate < today) {
        return res.status(400).json({
          error: 'Invalid date',
          message: 'Departure date cannot be in the past'
        });
      }

      const routes = await RouteService.findRoutes(routeRequest);

      // Add helpful metadata
      const response = {
        message: 'Routes found successfully',
        data: {
          search_criteria: routeRequest,
          results: {
            direct_flights: {
              count: routes.direct_flights.length,
              flights: routes.direct_flights.map(flight => ({
                ...flight,
                duration_minutes: Math.round(
                  (new Date(flight.arrival_datetime).getTime() - new Date(flight.departure_datetime).getTime()) / (1000 * 60)
                )
              }))
            },
            transit_routes: {
              count: routes.transit_routes.length,
              routes: routes.transit_routes.map(route => ({
                first_flight: {
                  ...route.first_flight,
                  duration_minutes: Math.round(
                    (new Date(route.first_flight.arrival_datetime).getTime() - new Date(route.first_flight.departure_datetime).getTime()) / (1000 * 60)
                  )
                },
                second_flight: {
                  ...route.second_flight,
                  duration_minutes: Math.round(
                    (new Date(route.second_flight.arrival_datetime).getTime() - new Date(route.second_flight.departure_datetime).getTime()) / (1000 * 60)
                  )
                },
                total_duration_minutes: Math.round(
                  (new Date(route.second_flight.arrival_datetime).getTime() - new Date(route.first_flight.departure_datetime).getTime()) / (1000 * 60)
                ),
                connection_time_minutes: Math.round(
                  (new Date(route.second_flight.departure_datetime).getTime() - new Date(route.first_flight.arrival_datetime).getTime()) / (1000 * 60)
                ),
                transit_hub: route.first_flight.destination
              }))
            }
          },
          total_options: routes.direct_flights.length + routes.transit_routes.length
        }
      };

      res.json(response);

    } catch (error) {
      console.error('Route search error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while searching for routes'
      });
    }
  }

  static async validateFlightSequence(req: Request, res: Response): Promise<void | Response> {
    try {
      const { flight_ids } = req.body;

      if (!Array.isArray(flight_ids) || flight_ids.length === 0) {
        return res.status(400).json({
          error: 'Invalid input',
          message: 'flight_ids must be a non-empty array'
        });
      }

      const validation = await RouteService.validateFlightSequence(flight_ids);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid flight sequence',
          message: validation.error,
          data: { valid: false }
        });
      }

      // Get flight details for response
      const flights = await RouteService.getFlightDetails(flight_ids);

      res.json({
        message: 'Flight sequence is valid',
        data: {
          valid: true,
          flights: flights.map(flight => ({
            id: flight.id,
            flight_number: flight.flight_number,
            airline_name: flight.airline_name,
            origin: flight.origin,
            destination: flight.destination,
            departure_datetime: flight.departure_datetime,
            arrival_datetime: flight.arrival_datetime
          }))
        }
      });

    } catch (error) {
      console.error('Flight sequence validation error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while validating flight sequence'
      });
    }
  }
}