import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../expense-splitter.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
export const initializeDatabase = (): void => {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    )
  `);

  // Groups table
  db.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add user_id column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE groups ADD COLUMN user_id TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Members table
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT
    )
  `);

  // Group members junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS group_members (
      group_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      PRIMARY KEY (group_id, member_id),
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
    )
  `);

  // Expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      paid_by TEXT NOT NULL,
      split_type TEXT NOT NULL,
      category TEXT DEFAULT 'other',
      date TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (paid_by) REFERENCES members(id)
    )
  `);

  // Add category column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE expenses ADD COLUMN category TEXT DEFAULT 'other'`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add currency column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE expenses ADD COLUMN currency TEXT DEFAULT 'USD'`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Split details table
  db.exec(`
    CREATE TABLE IF NOT EXISTS split_details (
      expense_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      PRIMARY KEY (expense_id, member_id),
      FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES members(id)
    )
  `);

  console.log('✅ Database initialized successfully');
};

export default db;
