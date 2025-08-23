import sqlite3 from 'sqlite3';
import path from 'path';

class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(__dirname, '../../data/air_cargo.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  // Promisify database methods for async/await usage
  public run = (sql: string, params?: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params || [], function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  public get = (sql: string, params?: any[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params || [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  public all = (sql: string, params?: any[]): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params || [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  };

  public async initialize(): Promise<void> {
    console.log('Initializing database...');
    
    // Enable foreign keys
    await this.run('PRAGMA foreign_keys = ON');
    
    // Create tables
    await this.createTables();
    
    // Create indexes for performance
    await this.createIndexes();
    
    console.log('Database initialized successfully');
  }

  private async createTables(): Promise<void> {
    // Users table
    await this.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Airlines table
    await this.run(`
      CREATE TABLE IF NOT EXISTS airlines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Flights table
    await this.run(`
      CREATE TABLE IF NOT EXISTS flights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_number VARCHAR(20) NOT NULL,
        airline_id INTEGER NOT NULL,
        origin VARCHAR(10) NOT NULL,
        destination VARCHAR(10) NOT NULL,
        departure_datetime DATETIME NOT NULL,
        arrival_datetime DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (airline_id) REFERENCES airlines(id),
        UNIQUE(flight_number, departure_datetime)
      )
    `);

    // Bookings table
    await this.run(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ref_id VARCHAR(20) UNIQUE NOT NULL,
        user_id INTEGER NOT NULL,
        origin VARCHAR(10) NOT NULL,
        destination VARCHAR(10) NOT NULL,
        pieces INTEGER NOT NULL CHECK (pieces > 0),
        weight_kg INTEGER NOT NULL CHECK (weight_kg > 0),
        status VARCHAR(20) NOT NULL CHECK (status IN ('BOOKED', 'DEPARTED', 'ARRIVED', 'DELIVERED', 'CANCELLED')),
        flight_ids TEXT, -- JSON array of flight IDs
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Timeline events table
    await this.run(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('CREATED', 'DEPARTED', 'ARRIVED', 'DELIVERED', 'CANCELLED')),
        location VARCHAR(50),
        flight_info TEXT, -- JSON string with flight details
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
      )
    `);

    // Booking reference counter table for generating unique ref_ids
    await this.run(`
      CREATE TABLE IF NOT EXISTS booking_counters (
        date_key VARCHAR(10) PRIMARY KEY, -- YYYY-MM-DD format
        counter INTEGER DEFAULT 0
      )
    `);
  }

  private async createIndexes(): Promise<void> {
    // Performance indexes based on query patterns
    
    // Flight search indexes (most frequent queries)
    await this.run('CREATE INDEX IF NOT EXISTS idx_flights_route_date ON flights (origin, destination, DATE(departure_datetime))');
    await this.run('CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights (departure_datetime)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_flights_arrival ON flights (arrival_datetime)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights (airline_id)');
    
    // Booking indexes
    await this.run('CREATE INDEX IF NOT EXISTS idx_bookings_ref_id ON bookings (ref_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings (user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_bookings_route ON bookings (origin, destination)');
    
    // Timeline events index
    await this.run('CREATE INDEX IF NOT EXISTS idx_timeline_booking ON timeline_events (booking_id, created_at)');
    
    // User indexes
    await this.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)');
    
    // Airlines index
    await this.run('CREATE INDEX IF NOT EXISTS idx_airlines_code ON airlines (code)');
  }

  public async beginTransaction(): Promise<void> {
    await this.run('BEGIN TRANSACTION');
  }

  public async commit(): Promise<void> {
    await this.run('COMMIT');
  }

  public async rollback(): Promise<void> {
    await this.run('ROLLBACK');
  }

  public async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  public getDatabase(): sqlite3.Database {
    return this.db;
  }
}

// Singleton instance
export const database = new Database();
export default database;