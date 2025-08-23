# 🧪 Air Cargo API - Postman Testing Suite

Complete automated testing suite for the Air Cargo Booking & Tracking API using Postman with environment variables and test scripts.

## 📁 Files Included

### 1. Environment File
- **`Air-Cargo-Environment.postman_environment.json`**
  - Contains all environment variables with pre-filled dummy data
  - Automatically manages authentication tokens
  - Dynamic date generation for testing

### 2. Main Test Collection
- **`Air-Cargo-Complete-Tests.postman_collection.json`**
  - Complete end-to-end workflow testing
  - Automated login and token management
  - Full booking lifecycle testing
  - All positive test scenarios

### 3. Validation Test Collection
- **`Air-Cargo-Validation-Tests.postman_collection.json`**
  - Error handling and validation testing
  - Authentication error scenarios
  - Input validation tests
  - 404 and edge case testing

## 🚀 Quick Setup Guide

### Step 1: Import Files into Postman
1. Open Postman
2. Click **Import** button
3. Import all three files:
   - Environment file
   - Main test collection
   - Validation test collection

### Step 2: Set Environment
1. Select **"Air Cargo API Environment"** from environment dropdown
2. All variables are pre-configured with dummy data

### Step 3: Start Your API Server
```bash
cd backend
npm run dev
```
Server should be running on `http://localhost:3000`

### Step 4: Run Tests
Choose your testing approach:

#### Option A: Run Complete Test Suite
1. Select **"Air Cargo API - Complete Test Suite"** collection
2. Click **"Run Collection"** button
3. All tests will run automatically in sequence

#### Option B: Run Individual Workflows
1. Expand collection folders
2. Run specific workflows:
   - 🔐 Authentication Flow
   - ✈️ Route Search
   - 📦 Booking Workflow
   - 🧪 Additional Tests

#### Option C: Run Validation Tests
1. Select **"Air Cargo API - Validation & Error Tests"** collection
2. Click **"Run Collection"** for error scenario testing

## 🔧 Environment Variables

### Pre-configured Test Data
| Variable | Value | Description |
|----------|--------|-------------|
| `baseUrl` | `http://localhost:3000` | API server URL |
| `apiPrefix` | `/api/v1` | API version prefix |
| `testEmail` | `john@example.com` | Test user email |
| `testPassword` | `password123` | Test user password |
| `testEmail2` | `jane@example.com` | Second test user |
| `adminEmail` | `admin@aircargo.com` | Admin user email |
| `testOrigin` | `DEL` | Delhi airport code |
| `testDestination` | `BLR` | Bangalore airport code |
| `testPieces` | `5` | Number of cargo pieces |
| `testWeight` | `100` | Weight in kg |

### Auto-managed Variables
| Variable | Description |
|----------|-------------|
| `authToken` | JWT token (auto-updated after login) |
| `userId` | Current user ID |
| `bookingRefId` | Created booking reference |
| `selectedFlightId` | Flight ID from route search |
| `testDepartureDate` | Today's date (auto-generated) |

## 🔄 Test Workflows

### 1. Complete End-to-End Workflow
**Sequence:** Login → Search Routes → Create Booking → Track → Update Status → Verify

```
1️⃣ Authentication Flow
   ├── Login User (stores token)
   └── Get Profile (verifies token)

2️⃣ Route Search
   └── Search Routes (stores flight ID)

3️⃣ Booking Workflow
   ├── Create Booking (stores booking ref)
   ├── Get Booking History
   ├── Mark as Departed
   ├── Mark as Arrived
   └── Try Cancel (should fail - already arrived)

4️⃣ Additional Tests
   ├── Create Second Booking
   ├── Cancel Second Booking (should work)
   └── Get User Bookings
```

### 2. Validation & Error Testing
```
🚫 Authentication Errors
   ├── Login with invalid credentials
   └── Access protected route without token

📊 Validation Errors
   ├── Invalid airport codes
   └── Invalid booking data

🔍 Not Found Errors
   ├── Invalid booking reference
   └── Invalid API endpoints
```

## ✅ Automated Test Assertions

### Authentication Tests
- ✅ Status codes (200, 401, 403)
- ✅ Token format validation (JWT)
- ✅ User data verification
- ✅ Token storage and reuse

### Route Search Tests
- ✅ Response structure validation
- ✅ Flight data completeness
- ✅ Route criteria matching
- ✅ Flight ID extraction for booking

### Booking Tests
- ✅ Booking creation (status 201)
- ✅ Ref ID format validation (AC-YYYYMMDD-XXXX)
- ✅ Status transitions (BOOKED → DEPARTED → ARRIVED)
- ✅ Timeline event tracking
- ✅ Business rule validation (can't cancel arrived bookings)

### Error Handling Tests
- ✅ Proper error status codes
- ✅ Error message validation
- ✅ Input validation responses
- ✅ Authentication failures

## 📊 Expected Test Results

### Successful Test Run Should Show:
- ✅ **28+ passing tests** (main collection)
- ✅ **8+ passing tests** (validation collection)
- ✅ All status code assertions pass
- ✅ All business logic validations pass
- ✅ Proper error handling for edge cases

### Key Metrics to Monitor:
- **Response Times**: All < 500ms
- **Success Rate**: 100% for valid requests
- **Error Handling**: Proper 4xx/5xx codes for invalid requests

## 🛠 Customization Options

### Modify Test Data
Update environment variables to test with different data:
```json
{
  "testOrigin": "BOM",          // Mumbai
  "testDestination": "MAA",     // Chennai
  "testPieces": 10,
  "testWeight": 250
}
```

### Add New Test Cases
1. Duplicate existing request
2. Modify request parameters
3. Update test assertions
4. Add to appropriate folder

### Test Different Environments
Create additional environments for:
- **Staging**: Different base URL
- **Production**: Production server testing
- **Load Testing**: Performance testing setup

## 🔧 Troubleshooting

### Common Issues

#### 1. Tests Failing Due to Server Not Running
**Solution**: Ensure server is running on port 3000
```bash
cd backend
npm run dev
```

#### 2. Authentication Token Expired
**Solution**: Re-run login request or complete test suite

#### 3. No Flights Available for Testing
**Solution**: Run database seeding
```bash
cd backend
npm run seed
```

#### 4. Booking Creation Fails
**Solution**: 
- Ensure route search ran successfully
- Check if `selectedFlightId` variable is set
- Verify user is authenticated

### Debug Mode
Enable Postman console to see:
- Request/response details
- Environment variable values
- Test script execution logs

## 📈 Advanced Usage

### Running Tests via Newman (CLI)
```bash
# Install Newman
npm install -g newman

# Run main test suite
newman run Air-Cargo-Complete-Tests.postman_collection.json \
  -e Air-Cargo-Environment.postman_environment.json

# Run validation tests
newman run Air-Cargo-Validation-Tests.postman_collection.json \
  -e Air-Cargo-Environment.postman_environment.json

# Generate HTML report
newman run Air-Cargo-Complete-Tests.postman_collection.json \
  -e Air-Cargo-Environment.postman_environment.json \
  -r html --reporter-html-export results.html
```

### Continuous Integration
Add to CI/CD pipeline for automated testing:
```yaml
# GitHub Actions example
- name: Run API Tests
  run: |
    npm start &
    sleep 10
    newman run postman/Air-Cargo-Complete-Tests.postman_collection.json \
      -e postman/Air-Cargo-Environment.postman_environment.json \
      --bail
```

## 📝 Test Data Reset

After running tests, some data might be modified. To reset:

1. **Database Reset**:
   ```bash
   cd backend
   npm run migrate
   npm run seed
   ```

2. **Environment Reset**:
   - Re-import environment file
   - Or manually clear dynamic variables in Postman

## 🎯 Test Coverage

This test suite covers:
- ✅ **100% API Endpoints** - All routes tested
- ✅ **Authentication Flow** - Login, token validation, profile
- ✅ **Business Logic** - Route search, booking lifecycle
- ✅ **Error Scenarios** - 4xx/5xx responses
- ✅ **Data Validation** - Input validation, constraints
- ✅ **State Transitions** - Booking status changes
- ✅ **Concurrency** - Database transaction handling

---

**🎉 Ready for Automated Testing!**

Import the collections, select the environment, and run your tests. Everything is automated - no manual data entry required!