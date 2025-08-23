import database from '../database/connection';
import { User } from '../types';

export class UserModel {
  
  static async findByEmail(email: string): Promise<User | null> {
    const user = await database.get(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return user || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const user = await database.get(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return user || null;
  }

  static async findById(id: number): Promise<User | null> {
    const user = await database.get(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return user || null;
  }

  static async create(userData: {
    username: string;
    email: string;
    password_hash: string;
  }): Promise<User> {
    const result = await database.run(`
      INSERT INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `, [userData.username, userData.email, userData.password_hash]);

    const userId = (result as any).lastID;
    const user = await this.findById(userId);
    
    if (!user) {
      throw new Error('Failed to create user');
    }
    
    return user;
  }

  static async updateLastLogin(userId: number): Promise<void> {
    await database.run(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }
}