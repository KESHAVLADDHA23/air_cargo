import database from '../database/connection';
import { TimelineEvent, TimelineEventType, BookingHistoryResponse, Booking, Flight, Airline } from '../types';
import { RouteService } from './RouteService';

export class TimelineService {
  
  static async getBookingHistory(ref_id: string): Promise<BookingHistoryResponse | null> {
    try {
      // Get booking details
      const booking = await database.get(
        'SELECT * FROM bookings WHERE ref_id = ?',
        [ref_id]
      ) as Booking;

      if (!booking) {
        return null;
      }

      // Get timeline events
      const timelineEvents = await database.all(
        `SELECT * FROM timeline_events 
         WHERE booking_id = ? 
         ORDER BY created_at ASC`,
        [booking.id]
      ) as TimelineEvent[];

      // Get flight details if available
      let flightDetails: Flight[] = [];
      let airlineDetails: Airline[] = [];
      
      if (booking.flight_ids) {
        try {
          const flightIds = JSON.parse(booking.flight_ids);
          flightDetails = await RouteService.getFlightDetails(flightIds);
          
          // Get unique airline details
          const airlineIds = [...new Set(flightDetails.map(f => f.airline_id))];
          if (airlineIds.length > 0) {
            const placeholders = airlineIds.map(() => '?').join(',');
            airlineDetails = await database.all(
              `SELECT * FROM airlines WHERE id IN (${placeholders})`,
              airlineIds
            );
          }
        } catch (error) {
          console.warn('Failed to parse flight IDs:', error);
        }
      }

      return {
        booking,
        timeline: timelineEvents,
        flight_details: flightDetails,
        airline_details: airlineDetails
      };

    } catch (error) {
      console.error('Error getting booking history:', error);
      throw error;
    }
  }

  static async addTimelineEvent(
    booking_id: number, 
    event_type: TimelineEventType, 
    location?: string, 
    flight_info?: any, 
    notes?: string
  ): Promise<TimelineEvent> {
    try {
      const flight_info_json = flight_info ? JSON.stringify(flight_info) : null;
      
      const result = await database.run(`
        INSERT INTO timeline_events (booking_id, event_type, location, flight_info, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [booking_id, event_type, location || null, flight_info_json, notes || null]);

      const eventId = (result as any).lastID;
      
      const event = await database.get(
        'SELECT * FROM timeline_events WHERE id = ?',
        [eventId]
      ) as TimelineEvent;

      return event;

    } catch (error) {
      console.error('Error adding timeline event:', error);
      throw error;
    }
  }

  static async getTimelineByBookingId(booking_id: number): Promise<TimelineEvent[]> {
    const events = await database.all(
      `SELECT * FROM timeline_events 
       WHERE booking_id = ? 
       ORDER BY created_at ASC`,
      [booking_id]
    ) as TimelineEvent[];

    return events;
  }

  static async getLatestEventByType(booking_id: number, event_type: TimelineEventType): Promise<TimelineEvent | null> {
    const event = await database.get(
      `SELECT * FROM timeline_events 
       WHERE booking_id = ? AND event_type = ?
       ORDER BY created_at DESC 
       LIMIT 1`,
      [booking_id, event_type]
    ) as TimelineEvent;

    return event || null;
  }

  static async deleteTimelineEvent(event_id: number): Promise<boolean> {
    try {
      const result = await database.run(
        'DELETE FROM timeline_events WHERE id = ?',
        [event_id]
      );

      return (result as any).changes > 0;
    } catch (error) {
      console.error('Error deleting timeline event:', error);
      throw error;
    }
  }

  static formatTimelineForDisplay(timeline: TimelineEvent[]): any[] {
    return timeline.map(event => {
      let flight_info_parsed = null;
      
      if (event.flight_info) {
        try {
          flight_info_parsed = JSON.parse(event.flight_info);
        } catch (error) {
          console.warn('Failed to parse flight info:', error);
        }
      }

      return {
        id: event.id,
        event_type: event.event_type,
        location: event.location,
        flight_info: flight_info_parsed,
        notes: event.notes,
        timestamp: event.created_at,
        display_text: this.generateDisplayText(event)
      };
    });
  }

  private static generateDisplayText(event: TimelineEvent): string {
    const timestamp = new Date(event.created_at).toLocaleString();
    
    switch (event.event_type) {
      case TimelineEventType.CREATED:
        return `${timestamp} - Booking created${event.location ? ` at ${event.location}` : ''}`;
      
      case TimelineEventType.DEPARTED:
        return `${timestamp} - Cargo departed${event.location ? ` from ${event.location}` : ''}`;
      
      case TimelineEventType.ARRIVED:
        return `${timestamp} - Cargo arrived${event.location ? ` at ${event.location}` : ''}`;
      
      case TimelineEventType.DELIVERED:
        return `${timestamp} - Cargo delivered${event.location ? ` at ${event.location}` : ''}`;
      
      case TimelineEventType.CANCELLED:
        return `${timestamp} - Booking cancelled`;
      
      default:
        return `${timestamp} - ${event.event_type}${event.location ? ` at ${event.location}` : ''}`;
    }
  }
}