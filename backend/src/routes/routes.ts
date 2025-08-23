import { Router } from 'express';
import { RoutesController } from '../controllers/RoutesController';
import { validateQuery, schemas } from '../middleware/validation';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Search for routes (public endpoint with optional auth)
router.get('/', 
  optionalAuth,
  validateQuery(schemas.routeSearch), 
  RoutesController.searchRoutes
);

// Validate flight sequence (public endpoint)
router.post('/validate',
  RoutesController.validateFlightSequence
);

export default router;