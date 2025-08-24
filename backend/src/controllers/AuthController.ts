import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  
  static async signup(req: Request, res: Response): Promise<void | Response> {
    try {
      const { username, email, password } = req.body;

      const result = await AuthService.registerUser({ username, email, password });
      
      if ('error' in result) {
        return res.status(400).json({
          error: 'Registration failed',
          message: result.error
        });
      }

      const { user, token } = result;

      res.status(201).json({
        message: 'Account created successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token,
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong during registration'
      });
    }
  }

  static async login(req: Request, res: Response): Promise<void | Response> {
    try {
      const { email, password } = req.body;

      const authResult = await AuthService.authenticateUser(email, password);
      
      if (!authResult) {
        return res.status(401).json({
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      const { user, token } = authResult;

      res.json({
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          },
          token,
          expires_in: '24h'
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong during authentication'
      });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void | Response> {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No user found in token'
        });
      }

      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'No token provided'
        });
      }

      const user = await AuthService.getCurrentUser(token);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found',
          message: 'User account no longer exists'
        });
      }

      res.json({
        message: 'Profile retrieved successfully',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            created_at: user.created_at
          }
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: 'Something went wrong while retrieving profile'
      });
    }
  }

  static async validateToken(req: Request, res: Response): Promise<void | Response> {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(400).json({
          error: 'No token provided',
          valid: false
        });
      }

      const user = await AuthService.getCurrentUser(token);
      
      res.json({
        message: 'Token validation result',
        data: {
          valid: !!user,
          user: user ? {
            id: user.id,
            username: user.username,
            email: user.email
          } : null
        }
      });

    } catch (error) {
      res.json({
        message: 'Token validation result',
        data: {
          valid: false,
          user: null
        }
      });
    }
  }
}