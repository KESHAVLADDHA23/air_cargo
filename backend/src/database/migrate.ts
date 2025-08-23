import database from './connection';

async function migrate() {
  try {
    console.log('Starting database migration...');
    await database.initialize();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

export default migrate;