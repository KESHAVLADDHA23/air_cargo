import database from '../database/connection';
import { Booking, BookingStatus, TimelineEventType } from '../types';

export class BookingModel {
  
  static async generateRefId(): Promise<string> {
    const today = new Date();
    const dateKey = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    try {
      // Get or create counter for today
      let counter = await database.get(
        'SELECT counter FROM booking_counters WHERE date_key = ?',
        [dateKey]
      );
      
      if (!counter) {
        // Create new counter for today
        await database.run(
          'INSERT INTO booking_counters (date_key, counter) VALUES (?, 1)',
          [dateKey]
        );
        counter = { counter: 1 };
      } else {
        // Increment existing counter
        await database.run(
          'UPDATE booking_counters SET counter = counter + 1 WHERE date_key = ?',
          [dateKey]
        );
        counter.counter += 1;
      }
      
      // Format: AC-YYYYMMDD-XXXX
      const formattedDate = dateKey.replace(/-/g, '');
      const paddedCounter = String(counter.counter).padStart(4, '0');
      
      return `AC-${formattedDate}-${paddedCounter}`;
      
    } catch (error) {
      throw new Error('Failed to generate reference ID');
    }
  }

  static async create(bookingData: {
    user_id: number;
    origin: string;
    destination: string;
    pieces: number;
    weight_kg: number;
    flight_ids?: number[];
  }): Promise<Booking> {
    try {
      const ref_id = await this.generateRefId();
      const flight_ids_json = bookingData.flight_ids ? JSON.stringify(bookingData.flight_ids) : null;
      
      const result = await database.run(`
        INSERT INTO bookings (
          ref_id, user_id, origin, destination, pieces, weight_kg, status, flight_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        ref_id,
        bookingData.user_id,
        bookingData.origin,
        bookingData.destination,
        bookingData.pieces,
        bookingData.weight_kg,
        BookingStatus.BOOKED,
        flight_ids_json
      ]);

      const bookingId = (result as any).lastID;
      
      // Create initial timeline event
      await database.run(`
        INSERT INTO timeline_events (booking_id, event_type, location, notes)
        VALUES (?, ?, ?, ?)
      `, [
        bookingId,
        TimelineEventType.CREATED,
        bookingData.origin,
        `Booking created for ${bookingData.pieces} pieces, ${bookingData.weight_kg}kg`
      ]);
      
      const booking = await this.findByRefId(ref_id);
      if (!booking) {
        throw new Error('Failed to create booking');
      }
      
      return booking;
      
    } catch (error) {
      throw error;
    }
  }

  static async findByRefId(ref_id: string): Promise<Booking | null> {
    const booking = await database.get(
      'SELECT * FROM bookings WHERE ref_id = ?',
      [ref_id]
    );
    return booking || null;
  }

  static async findById(id: number): Promise<Booking | null> {
    const booking = await database.get(
      'SELECT * FROM bookings WHERE id = ?',
      [id]
    );
    return booking || null;
  }

  static async findByUserId(user_id: number): Promise<Booking[]> {
    const bookings = await database.all(
      'SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC',
      [user_id]
    );
    return bookings;
  }

  static async updateStatus(ref_id: string, newStatus: BookingStatus, currentStatus?: BookingStatus): Promise<boolean> {
    // Build query with optional current status check
    let query = 'UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE ref_id = ?';
    let params: any[] = [newStatus, ref_id];
    
    if (currentStatus) {
      query += ' AND status = ?';
      params.push(currentStatus);
    }
    
    const result = await database.run(query, params);
    
    return (result as any).changes > 0;
  }

  static async depart(ref_id: string, location: string, flight_info?: string): Promise<boolean> {
    try {
      // Check current status and update
      const updateSuccess = await this.updateStatus(ref_id, BookingStatus.DEPARTED, BookingStatus.BOOKED);
      
      if (!updateSuccess) {
        return false;
      }
      
      // Get booking for timeline event
      const booking = await this.findByRefId(ref_id);
      if (!booking) {
        return false;
      }
      
      // Add timeline event
      await database.run(`
        INSERT INTO timeline_events (booking_id, event_type, location, flight_info, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [
        booking.id,
        TimelineEventType.DEPARTED,
        location,
        flight_info || null,
        `Cargo departed from ${location}`
      ]);
      
      return true;
      
    } catch (error) {
      throw error;
    }
  }

  static async arrive(ref_id: string, location: string, flight_info?: string): Promise<boolean> {
    try {
      // Check current status and update
      const updateSuccess = await this.updateStatus(ref_id, BookingStatus.ARRIVED, BookingStatus.DEPARTED);
      
      if (!updateSuccess) {
        return false;
      }
      
      // Get booking for timeline event
      const booking = await this.findByRefId(ref_id);
      if (!booking) {
        return false;
      }
      
      // Add timeline event
      await database.run(`
        INSERT INTO timeline_events (booking_id, event_type, location, flight_info, notes)
        VALUES (?, ?, ?, ?, ?)
      `, [
        booking.id,
        TimelineEventType.ARRIVED,
        location,
        flight_info || null,
        `Cargo arrived at ${location}`
      ]);
      
      return true;
      
    } catch (error) {
      throw error;
    }
  }

  static async cancel(ref_id: string): Promise<boolean> {
    try {
      // Check if booking can be cancelled (not ARRIVED or DELIVERED)
      const booking = await this.findByRefId(ref_id);
      if (!booking) {
        return false;
      }
      
      if (booking.status === BookingStatus.ARRIVED || booking.status === BookingStatus.DELIVERED) {
        return false; // Cannot cancel arrived or delivered bookings
      }
      
      // Update status to cancelled
      const updateSuccess = await this.updateStatus(ref_id, BookingStatus.CANCELLED);
      
      if (!updateSuccess) {
        return false;
      }
      
      // Add timeline event
      await database.run(`
        INSERT INTO timeline_events (booking_id, event_type, notes)
        VALUES (?, ?, ?)
      `, [
        booking.id,
        TimelineEventType.CANCELLED,
        'Booking cancelled by user'
      ]);
      
      return true;
      
    } catch (error) {
      throw error;
    }
  }
}