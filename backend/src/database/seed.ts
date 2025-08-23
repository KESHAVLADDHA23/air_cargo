import database from './connection';
import bcrypt from 'bcryptjs';

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    await database.beginTransaction();

    // Seed Users
    await seedUsers();
    
    // Seed Airlines
    await seedAirlines();
    
    // Seed Flights with proper constraints
    await seedFlights();

    await database.commit();
    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    await database.rollback();
    console.error('Seeding failed:', error);
    throw error;
  }
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const users = [
    {
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123'
    },
    {
      username: 'jane_smith',
      email: 'jane@example.com',
      password: 'password123'
    },
    {
      username: 'admin_user',
      email: 'admin@aircargo.com',
      password: 'admin123'
    }
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    
    await database.run(`
      INSERT OR IGNORE INTO users (username, email, password_hash)
      VALUES (?, ?, ?)
    `, [user.username, user.email, hashedPassword]);
  }
  
  console.log(`✓ Seeded ${users.length} users`);
}

async function seedAirlines() {
  console.log('Seeding airlines...');
  
  const airlines = [
    { code: 'AI', name: 'Air India' },
    { code: '6E', name: 'IndiGo' },
    { code: 'SG', name: 'SpiceJet' },
    { code: 'UK', name: 'Vistara' },
    { code: 'G8', name: 'GoAir' },
    { code: 'I5', name: 'AirAsia India' }
  ];

  for (const airline of airlines) {
    await database.run(`
      INSERT OR IGNORE INTO airlines (code, name)
      VALUES (?, ?)
    `, [airline.code, airline.name]);
  }
  
  console.log(`✓ Seeded ${airlines.length} airlines`);
}

async function seedFlights() {
  console.log('Seeding flights...');
  
  // Get airline IDs for reference
  const airlines = await database.all('SELECT id, code FROM airlines');
  const airlineMap = airlines.reduce((acc: any, airline: any) => {
    acc[airline.code] = airline.id;
    return acc;
  }, {});

  // Major Indian airports
  const airports = ['DEL', 'BOM', 'BLR', 'HYD', 'MAA', 'CCU', 'AMD', 'COK', 'GOI', 'JAI'];
  
  const flights = [];
  let flightCounter = 1;

  // Generate flights for next 30 days
  const startDate = new Date();
  for (let day = 0; day < 30; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    
    // Generate flights between different airport pairs
    for (let i = 0; i < airports.length; i++) {
      for (let j = 0; j < airports.length; j++) {
        if (i !== j) {
          const origin = airports[i];
          const destination = airports[j];
          
          // Generate 2-3 flights per route per day
          const flightsPerRoute = Math.floor(Math.random() * 2) + 2; // 2-3 flights
          
          for (let f = 0; f < flightsPerRoute; f++) {
            const airlineCodes = Object.keys(airlineMap);
            const randomAirline = airlineCodes[Math.floor(Math.random() * airlineCodes.length)];
            
            // Generate realistic flight times
            const departureHour = 6 + (f * 6) + Math.floor(Math.random() * 4); // Spread throughout day
            const flightDuration = Math.floor(Math.random() * 4) + 1; // 1-4 hours
            
            const departureTime = new Date(currentDate);
            departureTime.setHours(departureHour, Math.floor(Math.random() * 60), 0, 0);
            
            const arrivalTime = new Date(departureTime);
            arrivalTime.setHours(arrivalTime.getHours() + flightDuration);
            
            const flightNumber = `${randomAirline}${String(flightCounter).padStart(3, '0')}`;
            
            flights.push({
              flight_number: flightNumber,
              airline_id: airlineMap[randomAirline],
              origin,
              destination,
              departure_datetime: departureTime.toISOString(),
              arrival_datetime: arrivalTime.toISOString()
            });
            
            flightCounter++;
          }
        }
      }
    }
  }

  // Insert flights in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < flights.length; i += batchSize) {
    const batch = flights.slice(i, i + batchSize);
    
    for (const flight of batch) {
      try {
        await database.run(`
          INSERT OR IGNORE INTO flights 
          (flight_number, airline_id, origin, destination, departure_datetime, arrival_datetime)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          flight.flight_number,
          flight.airline_id,
          flight.origin,
          flight.destination,
          flight.departure_datetime,
          flight.arrival_datetime
        ]);
      } catch (error) {
        console.warn(`Skipped duplicate flight: ${flight.flight_number}`);
      }
    }
  }
  
  console.log(`✓ Seeded ${flights.length} flights across 30 days`);
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

export default seedDatabase;