import path from 'path';

let db: any = null;
let initialized = false;
let Database: any = null;

// Initialize database safely
export function initDatabase() {
  if (initialized && db) {
    return;
  }

  try {
    // Check if we're in a server environment
    if (typeof window !== 'undefined') {
      console.warn('⚠️ Database initialization skipped in browser environment');
      return;
    }

    // Lazy load better-sqlite3 to avoid issues with Next.js
    if (!Database) {
      try {
        Database = require('better-sqlite3');
      } catch (importError: any) {
        console.error('❌ Failed to import better-sqlite3:', importError.message);
        return;
      }
    }

    if (!Database) {
      console.error('❌ Database module not available');
      return;
    }

    const dbPath = path.join(process.cwd(), 'poly402.db');
    console.log('[initDatabase] Database path:', dbPath);
    console.log('[initDatabase] CWD:', process.cwd());
    
    try {
      db = new Database(dbPath, { verbose: false });
      console.log('[initDatabase] Database connection created successfully');
    } catch (dbError: any) {
      console.error('❌ Failed to create database connection:', dbError.message);
      console.error('❌ Error type:', dbError?.constructor?.name);
      console.error('❌ Error stack:', dbError?.stack);
      db = null;
      return;
    }

    if (!db) {
      console.error('❌ Database instance is null after creation');
      return;
    }

    // Markets table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS markets (
          id TEXT PRIMARY KEY,
          question TEXT NOT NULL,
          description TEXT,
          slug TEXT,
          yes_price REAL,
          no_price REAL,
          volume REAL,
          volume_24hr REAL,
          category TEXT,
          end_date TEXT,
          image_url TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableError: any) {
      console.error('❌ Failed to create markets table:', tableError.message);
    }

    // Agents table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS agents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          strategy TEXT,
          balance REAL DEFAULT 1000,
          accuracy REAL DEFAULT 0,
          total_predictions INTEGER DEFAULT 0,
          is_celebrity INTEGER DEFAULT 0,
          celebrity_model TEXT,
          avatar TEXT,
          traits TEXT,
          wallet_address TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableError: any) {
      console.error('❌ Failed to create agents table:', tableError.message);
    }

    // Predictions table
    try {
      db.exec(`
        CREATE TABLE IF NOT EXISTS predictions (
          id TEXT PRIMARY KEY,
          agent_id TEXT,
          market_id TEXT,
          prediction TEXT,
          confidence REAL,
          reasoning TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id) REFERENCES agents(id),
          FOREIGN KEY (market_id) REFERENCES markets(id)
        )
      `);
    } catch (tableError: any) {
      console.error('❌ Failed to create predictions table:', tableError.message);
    }

    initialized = true;
    console.log('✅ SQLite database initialized at:', dbPath);
    console.log('✅ Database instance created:', !!db);
  } catch (error: any) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Stack:', error.stack);
    db = null;
    initialized = false;
  }
}

// Get database instance
function getDb(): any {
  if (!db) {
    try {
      initDatabase();
    } catch (error: any) {
      console.error('Failed to initialize database in getDb:', error);
      return null;
    }
    if (!db) {
      console.error('Database initialization returned null');
      return null;
    }
  }
  return db;
}

// Export database instance
export default getDb;
