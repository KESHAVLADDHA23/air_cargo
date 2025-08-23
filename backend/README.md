# Air Cargo Booking & Tracking System - Backend

A comprehensive RESTful API backend for air cargo booking and tracking built with Node.js, TypeScript, and SQLite.

## 🚀 Features

### Core Functionality
- **Flight Route Search**: Find direct flights and 1-hop transit routes
- **Booking Management**: Create, track, and manage air cargo bookings
- **Real-time Tracking**: Timeline-based tracking with status updates
- **User Authentication**: JWT-based authentication system
- **Unique Reference IDs**: Human-friendly booking references (AC-YYYYMMDD-XXXX)

### Technical Features
- **Database Transactions**: Proper concurrency handling with SQLite transactions
- **Data Integrity**: Comprehensive validation and constraints
- **Performance Optimized**: Strategic database indexing for fast queries
- **Error Handling**: Comprehensive error handling and logging
- **Security**: Helmet, CORS, input validation, and JWT authentication

## 📋 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login with email/password
- `GET /api/v1/auth/profile` - Get current user profile (protected)
- `GET /api/v1/auth/validate` - Validate JWT token

### Route Search
- `GET /api/v1/routes` - Search flight routes with query parameters:
  - `origin` (string): 3-letter airport code (e.g., "DEL")
  - `destination` (string): 3-letter airport code (e.g., "BLR") 
  - `departure_date` (string): Date in YYYY-MM-DD format
- `POST /api/v1/routes/validate` - Validate flight sequence

### Booking Management
- `POST /api/v1/bookings` - Create new booking (protected)
- `GET /api/v1/bookings/my-bookings` - Get user's bookings (protected)
- `GET /api/v1/bookings/:ref_id/history` - Get booking history and timeline
- `PUT /api/v1/bookings/:ref_id/depart` - Mark booking as departed (protected)
- `PUT /api/v1/bookings/:ref_id/arrive` - Mark booking as arrived (protected)
- `PUT /api/v1/bookings/:ref_id/cancel` - Cancel booking (protected)

### System
- `GET /health` - Health check endpoint
- `GET /api/v1` - API information
- `GET /api/v1/docs` - API documentation

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn

### Installation Steps

1. **Clone and Navigate**
   ```bash
   cd backend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy and configure environment variables
   cp .env.example .env
   ```

4. **Database Setup**
   ```bash
   # Create database and tables
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📊 Database Schema

### Users
- User authentication and profile management

### Airlines  
- Airline information (code, name)

### Flights
- Flight schedules with origin/destination and timing
- Optimized indexes for route searches

### Bookings
- Cargo booking details with unique ref_id
- Status tracking (BOOKED → DEPARTED → ARRIVED → DELIVERED)

### Timeline Events
- Detailed event tracking for each booking
- Chronological history with location and flight info

### Booking Counters
- Ensures unique ref_id generation per day

## 🔧 Configuration

### Environment Variables (.env)
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h
DB_PATH=./data/air_cargo.db
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
LOG_LEVEL=info
```

### NPM Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with initial data

## 🎯 API Usage Examples

### 1. User Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

### 2. Search Routes
```bash
curl "http://localhost:3000/api/v1/routes?origin=DEL&destination=BLR&departure_date=2024-08-24"
```

### 3. Create Booking
```bash
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "origin":"DEL",
    "destination":"BLR", 
    "pieces":5,
    "weight_kg":100,
    "flight_ids":[1]
  }'
```

### 4. Track Booking
```bash
curl http://localhost:3000/api/v1/bookings/AC-20240824-0001/history
```

## 🧪 Testing

### Seeded Test Data
The system comes with pre-seeded data:

**Test Users:**
- Email: `john@example.com`, Password: `password123`
- Email: `jane@example.com`, Password: `password123` 
- Email: `admin@aircargo.com`, Password: `admin123`

**Airlines:** Air India, IndiGo, SpiceJet, Vistara, GoAir, AirAsia India

**Flights:** 30 days of flight data across major Indian airports

### API Testing Script
Run the included test script:
```bash
powershell -ExecutionPolicy Bypass -File test-api.ps1
```

## 🏗 Architecture

### Modular Structure
```
src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Data access layer
├── middleware/      # Auth, validation, error handling
├── routes/          # API routes
├── database/        # DB connection, migrations, seeds
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

### Key Features

**Concurrency Handling:** Database transactions with conditional updates ensure data consistency

**Route Finding Algorithm:**
- Direct flights: Simple origin-destination matching
- Transit routes: 1-hop connections with timing constraints (2-24 hour connections)

**Ref ID Generation:** Thread-safe daily counter with format AC-YYYYMMDD-XXXX

**Security:** JWT authentication, input validation, CORS, Helmet security headers

## 📈 Performance Considerations

### Database Indexing
- Flight route searches optimized with composite indexes
- Booking lookups by ref_id indexed
- Timeline queries optimized by booking_id + timestamp

### Query Optimization
- Transit route searches limited to top 10 results
- Batch processing for large data operations
- Connection pooling for database access

## 🛡 Security Features

- JWT token-based authentication
- Input validation with Joi schemas
- SQL injection prevention with parameterized queries
- CORS configuration for controlled access
- Security headers with Helmet
- Environment-based configuration

## 🚦 Status Codes & Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created (new booking)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (valid token, insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "error": "ERROR_CODE",
  "message": "Human readable error message",
  "timestamp": "2024-08-23T12:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## 🔄 Booking Status Flow

1. **BOOKED** - Initial state when booking is created
2. **DEPARTED** - Cargo has departed from origin
3. **ARRIVED** - Cargo has arrived at destination  
4. **DELIVERED** - Cargo has been delivered to recipient
5. **CANCELLED** - Booking cancelled (only before ARRIVED)

## 📱 Future Enhancements

- Real-time notifications
- Multi-leg route optimization
- Cargo weight/volume constraints
- Pricing and billing integration
- Advanced tracking with GPS coordinates
- Mobile app integration
- Email notifications
- Document management
- Multi-tenant support

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add proper TypeScript types for new features
3. Include validation for new endpoints
4. Update this README for significant changes
5. Test all endpoints before committing

## 📝 License

MIT License - see LICENSE file for details

---

**Built with ❤️ by Kesha**

For questions or support, please refer to the API documentation at `/api/v1/docs` when the server is running.