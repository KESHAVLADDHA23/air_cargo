import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/AuthService';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied', 
        message: 'No token provided' 
      });
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token', 
      message: 'Token is invalid or expired' 
    });
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = AuthService.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Token is invalid, but we continue without user
        req.user = undefined;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};