import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateRequest, schemas } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Login endpoint
router.post('/login', validateRequest(schemas.login), AuthController.login);

// Get current user profile (protected)
router.get('/profile', authenticateToken, AuthController.getProfile);

// Validate token
router.get('/validate', AuthController.validateToken);

export default router;