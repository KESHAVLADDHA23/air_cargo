import { Router } from 'express';
import { BookingsController } from '../controllers/BookingsController';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Create new booking (protected)
router.post('/', 
  authenticateToken,
  validateRequest(schemas.createBooking), 
  BookingsController.createBooking
);

// Get user's bookings (protected)
router.get('/my-bookings', 
  authenticateToken,
  BookingsController.getUserBookings
);

// Get booking history by ref_id (public with optional auth)
router.get('/:ref_id/history', 
  optionalAuth,
  BookingsController.getBookingHistory
);

// Mark booking as departed (protected)
router.put('/:ref_id/depart', 
  authenticateToken,
  validateRequest(schemas.departBooking),
  BookingsController.departBooking
);

// Mark booking as arrived (protected)
router.put('/:ref_id/arrive', 
  authenticateToken,
  validateRequest(schemas.arriveBooking),
  BookingsController.arriveBooking
);

// Cancel booking (protected)
router.put('/:ref_id/cancel', 
  authenticateToken,
  BookingsController.cancelBooking
);

export default router;