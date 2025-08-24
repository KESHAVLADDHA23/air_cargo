import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';
import { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface JWTPayload {
  userId: number;
  username: string;
  email: string;
}

export class AuthService {
  
  static generateToken(user: User): string {
    const payload: JWTPayload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as string,
      issuer: 'air-cargo-api'
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'air-cargo-api'
      }) as JWTPayload;
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    try {
      // Find user by email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await this.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        return null;
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      // Generate token
      const token = this.generateToken(user);

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword as User,
        token
      };
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  }

  static async getCurrentUser(token: string): Promise<User | null> {
    try {
      const payload = this.verifyToken(token);
      const user = await UserModel.findById(payload.userId);
      
      if (!user) {
        return null;
      }

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      return null;
    }
  }

  static async registerUser(userData: {
    username: string;
    email: string;
    password: string;
  }): Promise<{ user: User; token: string } | { error: string }> {
    try {
      const { username, email, password } = userData;

      // Check if user already exists by email
      const existingUserByEmail = await UserModel.findByEmail(email);
      if (existingUserByEmail) {
        return { error: 'User with this email already exists' };
      }

      // Check if user already exists by username
      const existingUserByUsername = await UserModel.findByUsername(username);
      if (existingUserByUsername) {
        return { error: 'Username is already taken' };
      }

      // Hash the password
      const password_hash = await this.hashPassword(password);

      // Create the user
      const user = await UserModel.create({
        username,
        email,
        password_hash
      });

      // Generate token
      const token = this.generateToken(user);

      // Remove password hash from response
      const { password_hash: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword as User,
        token
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: 'Something went wrong during registration' };
    }
  }
}