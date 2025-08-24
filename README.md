# 🛩️ Air Cargo Booking & Tracking System

A comprehensive full-stack web application for air cargo booking and real-time tracking, built with modern technologies and designed for professional logistics operations.

## 🌟 Features

### 🔐 User Management
- **Secure Authentication**: JWT-based login/signup system
- **User Profiles**: Personal account management
- **Session Management**: Secure token-based sessions

### 🔍 Flight Search & Booking
- **Smart Route Search**: Find direct flights and connecting routes
- **Real-time Availability**: Live flight data and capacity
- **Easy Booking Process**: Intuitive cargo booking workflow
- **Unique Reference IDs**: Human-friendly booking references (AC-YYYYMMDD-XXXX)

### 📦 Cargo Tracking
- **Real-time Tracking**: Live status updates and location tracking
- **Timeline View**: Complete journey history with timestamps
- **Status Management**: BOOKED → DEPARTED → ARRIVED → DELIVERED
- **Detailed History**: Flight information and location details

### 📊 Dashboard & Management
- **User Dashboard**: Overview of all bookings and quick actions
- **My Bookings**: Complete booking history and management
- **Status Updates**: Real-time cargo status changes
- **Professional UI**: Material-UI based responsive design

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **State Management**: Redux Toolkit with RTK Query
- **Build Tool**: Vite
- **Styling**: CSS-in-JS with MUI theme system
- **Navigation**: React Router v6

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (production) / SQLite (development)
- **Authentication**: JWT tokens with bcrypt
- **Validation**: Joi schema validation
- **API**: RESTful architecture

### Development Tools
- **TypeScript**: Full type safety across the stack
- **ESLint**: Code linting and formatting
- **Hot Reload**: Development server with live updates
- **Environment Config**: Flexible environment variables

## 📁 Project Structure

```
air-cargo/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── models/          # Data access layer
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── routes/          # API routes
│   │   ├── database/        # DB connection, migrations, seeds
│   │   └── types/           # TypeScript definitions
│   ├── package.json
│   └── README.md
├── frontend/                # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Redux store and slices
│   │   ├── theme/           # Material-UI theme
│   │   └── types/           # TypeScript definitions
│   ├── package.json
│   └── README.md
└── design/                  # System design documentation
    ├── student-design.tex   # High-level design (LaTeX)
    ├── low-level-design.tex # Low-level design (LaTeX)
    └── sections/            # Design document sections
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **PostgreSQL** (optional - can use cloud services)

### 1. Clone the Repository
```bash
git clone https://github.com/KESHAVLADDHA23/air_cargo.git
cd air-cargo
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your database configuration

# Database setup (choose one option):

# Option A: PostgreSQL (Recommended)
# Use cloud services like Supabase, ElephantSQL, or Neon
# Set DATABASE_URL in .env

# Option B: SQLite (Development)
# Comment out DATABASE_URL in .env

# Initialize database
npm run migrate
npm run seed

# Start development server
npm run dev
```

The backend will start on `http://localhost:3000`

### 3. Frontend Setup

```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:5173`

## 🔧 Environment Configuration

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Database (choose one)
# PostgreSQL
DATABASE_URL=postgresql://username:password@hostname:5432/dbname

# SQLite (fallback)
# DB_PATH=./data/air_cargo.db

API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

### Database Options

#### Cloud PostgreSQL (No Local Installation)
- **Supabase**: Free 500MB - `postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres`
- **ElephantSQL**: Free 20MB - `postgres://username:password@hostname.db.elephantsql.com/dbname`
- **Neon**: Free 3GB - `postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/dbname`

#### Local Development
- **Docker**: Use `docker-compose up -d` with provided configuration
- **SQLite**: Automatic fallback when PostgreSQL not configured

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration
- `GET /api/v1/auth/profile` - Get user profile (protected)

### Route Search
- `GET /api/v1/routes` - Search flight routes
- `POST /api/v1/routes/validate` - Validate flight sequence

### Booking Management
- `POST /api/v1/bookings` - Create new booking (protected)
- `GET /api/v1/bookings/my-bookings` - Get user bookings (protected)
- `GET /api/v1/bookings/:ref_id/history` - Get booking history
- `PUT /api/v1/bookings/:ref_id/depart` - Mark as departed (protected)
- `PUT /api/v1/bookings/:ref_id/arrive` - Mark as arrived (protected)
- `PUT /api/v1/bookings/:ref_id/cancel` - Cancel booking (protected)

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm run test
```

### API Testing
Use the included Postman collection or test manually:
```bash
# Health check
curl http://localhost:3000/health

# Search routes
curl "http://localhost:3000/api/v1/routes?origin=DEL&destination=BLR&departure_date=2024-08-25"
```

### Test User Accounts
- Email: `john@example.com`, Password: `password123`
- Email: `jane@example.com`, Password: `password123`
- Email: `admin@aircargo.com`, Password: `admin123`

## 🚀 Deployment

### Backend Deployment
1. Set environment variables for production
2. Use PostgreSQL for production database
3. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Deploy to Vercel, Netlify, or serve with Express

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://production-db-url
JWT_SECRET=secure-production-secret
CORS_ORIGIN=https://yourdomain.com
```

## 🎨 Features Overview

### For Users
- ✅ **Easy Registration**: Quick signup process
- ✅ **Flight Search**: Find the best routes for cargo
- ✅ **Quick Booking**: Simple cargo booking process
- ✅ **Real-time Tracking**: Track cargo throughout journey
- ✅ **Booking Management**: View and manage all bookings
- ✅ **Professional Interface**: Clean, intuitive design

### For Developers
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Modern Stack**: Latest React, Node.js, and tooling
- ✅ **Scalable Architecture**: Modular and maintainable code
- ✅ **Database Flexibility**: PostgreSQL or SQLite support
- ✅ **Comprehensive API**: RESTful with proper error handling
- ✅ **Development Tools**: Hot reload, linting, and debugging

## 📚 Documentation

- **High-Level Design**: See `design/student-design.tex`
- **Low-Level Design**: See `design/low-level-design.tex`
- **Backend API**: See `backend/README.md`
- **Frontend Guide**: See `frontend/README.md`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is developed for educational purposes as part of a computer science curriculum.

## 👨‍💻 Developer

**Kesha** - Computer Science Student

---

## 🔗 Quick Links

- **Live Demo**: [Add your deployment URL]
- **API Documentation**: [Add API docs URL]
- **Design Documents**: `design/` folder
- **Issue Tracker**: [GitHub Issues]

## 📞 Support

For questions or support, please:
1. Check the documentation in each folder
2. Review the design documents
3. Create an issue in the repository

---

**Built with ❤️ using modern web technologies**