import { Request, Response } from 'express';
import { BookingModel } from '../models/Booking';
import { TimelineService } from '../services/TimelineService';
import { RouteService } from '../services/RouteService';
import { CreateBookingRequest } from '../types';

export class BookingsController {
  
  static async createBooking(req: Request, res: Response): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      const { origin, destination, pieces, weight_kg, flight_ids }: CreateBookingRequest = req.body;

      // Validate that origin and destination are different
      if (origin === destination) {
        return res.status(400).json({
          error: 'Invalid route',
          message: 'Origin and destination cannot be the same'
        });
      }

      // Validate flight sequence
      const validation = await RouteService.validateFlightSequence(flight_ids);
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Invalid flight sequence',
          message: validation.error
        });
      }

      // Get flight details to verify route matches booking
      const flights = await RouteService.getFlightDetails(flight_ids);
      
      if (flights.length === 0) {
        return res.status(400).json({
          error: 'Invalid flights',
          message: 'No valid flights found'
        });
      }

      // Verify route matches
      const firstFlight = flights[0];
      const lastFlight = flights[flights.length - 1];

      if (firstFlight.origin !== origin || lastFlight.destination !== destination) {
        return res.status(400).json({
          error: 'Route mismatch',
          message: 'Selected flights do not match the specified origin and destination'
        });
      }

      // Create booking
      const booking = await BookingModel.create({
        user_id: req.user.userId,
        origin,
        destination,
        pieces,
        weight_kg,
        flight_ids
      });

      // Get complete booking details for response
      const bookingHistory = await TimelineService.getBookingHistory(booking.ref_id);

      res.status(201).json({
        message: 'Booking created successfully',
        data: {
          booking: {
            ref_id: booking.ref_id,
            origin: booking.origin,
            destination: booking.destination,
            pieces: booking.pieces,
            weight_kg: booking.weight_kg,
            status: booking.status,
            created_at: booking.created_at
          },
          flights: bookingHistory?.flight_details || [],
          timeline: TimelineService.formatTimelineForDisplay(bookingHistory?.timeline || [])
        }
      });

    } catch (error) {
      console.error('Create booking error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while creating the booking'
      });
    }
  }

  static async departBooking(req: Request, res: Response): Promise<void | Response> {
    try {
      const { ref_id } = req.params;
      const { location, flight_info } = req.body;

      const success = await BookingModel.depart(ref_id, location, flight_info);

      if (!success) {
        return res.status(400).json({
          error: 'Cannot depart booking',
          message: 'Booking not found, already departed, or in invalid state for departure'
        });
      }

      // Get updated booking history
      const bookingHistory = await TimelineService.getBookingHistory(ref_id);

      if (!bookingHistory) {
        return res.status(404).json({
          error: 'Booking not found',
          message: 'Booking was updated but could not retrieve current state'
        });
      }

      res.json({
        message: 'Booking marked as departed successfully',
        data: {
          booking: {
            ref_id: bookingHistory.booking.ref_id,
            status: bookingHistory.booking.status,
            updated_at: bookingHistory.booking.updated_at
          },
          timeline: TimelineService.formatTimelineForDisplay(bookingHistory.timeline)
        }
      });

    } catch (error) {
      console.error('Depart booking error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while updating booking status'
      });
    }
  }

  static async arriveBooking(req: Request, res: Response): Promise<void | Response> {
    try {
      const { ref_id } = req.params;
      const { location, flight_info } = req.body;

      const success = await BookingModel.arrive(ref_id, location, flight_info);

      if (!success) {
        return res.status(400).json({
          error: 'Cannot arrive booking',
          message: 'Booking not found, not departed yet, or in invalid state for arrival'
        });
      }

      // Get updated booking history
      const bookingHistory = await TimelineService.getBookingHistory(ref_id);

      if (!bookingHistory) {
        return res.status(404).json({
          error: 'Booking not found',
          message: 'Booking was updated but could not retrieve current state'
        });
      }

      res.json({
        message: 'Booking marked as arrived successfully',
        data: {
          booking: {
            ref_id: bookingHistory.booking.ref_id,
            status: bookingHistory.booking.status,
            updated_at: bookingHistory.booking.updated_at
          },
          timeline: TimelineService.formatTimelineForDisplay(bookingHistory.timeline)
        }
      });

    } catch (error) {
      console.error('Arrive booking error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while updating booking status'
      });
    }
  }

  static async cancelBooking(req: Request, res: Response): Promise<void | Response> {
    try {
      const { ref_id } = req.params;

      const success = await BookingModel.cancel(ref_id);

      if (!success) {
        return res.status(400).json({
          error: 'Cannot cancel booking',
          message: 'Booking not found, already arrived/delivered, or cannot be cancelled'
        });
      }

      // Get updated booking history
      const bookingHistory = await TimelineService.getBookingHistory(ref_id);

      if (!bookingHistory) {
        return res.status(404).json({
          error: 'Booking not found',
          message: 'Booking was updated but could not retrieve current state'
        });
      }

      res.json({
        message: 'Booking cancelled successfully',
        data: {
          booking: {
            ref_id: bookingHistory.booking.ref_id,
            status: bookingHistory.booking.status,
            updated_at: bookingHistory.booking.updated_at
          },
          timeline: TimelineService.formatTimelineForDisplay(bookingHistory.timeline)
        }
      });

    } catch (error) {
      console.error('Cancel booking error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while cancelling the booking'
      });
    }
  }

  static async getBookingHistory(req: Request, res: Response): Promise<void | Response> {
    try {
      const { ref_id } = req.params;

      const bookingHistory = await TimelineService.getBookingHistory(ref_id);

      if (!bookingHistory) {
        return res.status(404).json({
          error: 'Booking not found',
          message: 'No booking found with the provided reference ID'
        });
      }

      res.json({
        message: 'Booking history retrieved successfully',
        data: {
          booking: {
            ref_id: bookingHistory.booking.ref_id,
            origin: bookingHistory.booking.origin,
            destination: bookingHistory.booking.destination,
            pieces: bookingHistory.booking.pieces,
            weight_kg: bookingHistory.booking.weight_kg,
            status: bookingHistory.booking.status,
            created_at: bookingHistory.booking.created_at,
            updated_at: bookingHistory.booking.updated_at
          },
          flights: bookingHistory.flight_details?.map(flight => ({
            id: flight.id,
            flight_number: flight.flight_number,
            airline_name: flight.airline_name || 'Unknown',
            origin: flight.origin,
            destination: flight.destination,
            departure_datetime: flight.departure_datetime,
            arrival_datetime: flight.arrival_datetime
          })) || [],
          airlines: bookingHistory.airline_details?.map(airline => ({
            id: airline.id,
            code: airline.code,
            name: airline.name
          })) || [],
          timeline: TimelineService.formatTimelineForDisplay(bookingHistory.timeline)
        }
      });

    } catch (error) {
      console.error('Get booking history error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while retrieving booking history'
      });
    }
  }

  static async getUserBookings(req: Request, res: Response): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User authentication required'
        });
      }

      const bookings = await BookingModel.findByUserId(req.user.userId);

      res.json({
        message: 'User bookings retrieved successfully',
        data: {
          bookings: bookings.map(booking => ({
            ref_id: booking.ref_id,
            origin: booking.origin,
            destination: booking.destination,
            pieces: booking.pieces,
            weight_kg: booking.weight_kg,
            status: booking.status,
            created_at: booking.created_at,
            updated_at: booking.updated_at
          })),
          count: bookings.length
        }
      });

    } catch (error) {
      console.error('Get user bookings error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while retrieving user bookings'
      });
    }
  }
}