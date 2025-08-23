import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import routesRoutes from './routes/routes';
import bookingsRoutes from './routes/bookings';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import database
import database from './database/connection';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

// Trust proxy for accurate client IP
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin: any, callback: any) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/routes`, routesRoutes);
app.use(`${API_PREFIX}/bookings`, bookingsRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}/docs`, (req, res) => {
  res.json({
    name: 'Air Cargo Booking & Tracking API',
    version: '1.0.0',
    description: 'RESTful API for air cargo booking and tracking system',
    endpoints: {
      auth: {
        'POST /auth/login': 'User login',
        'GET /auth/profile': 'Get user profile (protected)',
        'GET /auth/validate': 'Validate token'
      },
      routes: {
        'GET /routes': 'Search flight routes',
        'POST /routes/validate': 'Validate flight sequence'
      },
      bookings: {
        'POST /bookings': 'Create new booking (protected)',
        'GET /bookings/my-bookings': 'Get user bookings (protected)',
        'GET /bookings/:ref_id/history': 'Get booking history',
        'PUT /bookings/:ref_id/depart': 'Mark booking as departed (protected)',
        'PUT /bookings/:ref_id/arrive': 'Mark booking as arrived (protected)',
        'PUT /bookings/:ref_id/cancel': 'Cancel booking (protected)'
      }
    }
  });
});

// Default API response
app.get(API_PREFIX, (req, res) => {
  res.json({
    message: 'Air Cargo Booking & Tracking API',
    version: '1.0.0',
    documentation: `${API_PREFIX}/docs`,
    health: '/health'
  });
});

// 404 handler for API routes
app.use(API_PREFIX, notFoundHandler);

// Global 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'API endpoint not found',
    suggestion: `Try ${API_PREFIX} for available endpoints`
  });
});

// Global error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
  
  try {
    await database.close();
    console.log('Database connection closed.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await database.initialize();
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Air Cargo API Server running on port ${PORT}`);
      console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API Base URL: http://localhost:${PORT}${API_PREFIX}`);
      console.log(`📖 Documentation: http://localhost:${PORT}${API_PREFIX}/docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof PORT === 'string' ? 'Pipe ' + PORT : 'Port ' + PORT;

      switch (error.code) {
        case 'EACCES':
          console.error(bind + ' requires elevated privileges');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(bind + ' is already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

export default app;