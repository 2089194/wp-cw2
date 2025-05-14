import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Open connection to the SQLite database
const dbConn = open({
  filename: './database.sqlite',
  driver: sqlite3.Database,
});

// Function to save results into the database and create a unique session
export async function saveResults(results, sessionId) {
  const db = await dbConn;
  const stmt = await db.prepare('INSERT INTO Results (runnerId, finish_time, session_id) VALUES (?, ?, ?)');

  for (const r of results) {
    if (!r.runnerId || !r.finish_time) {
      throw new Error(`Invalid data: ${JSON.stringify(r)}`);
    }
    await stmt.run(r.runnerId, r.finish_time, sessionId); // keep camelCase for JS side
  }

  await stmt.finalize();
}


// Function to get race results from the database
export async function getResults(sessionId) {
  const db = await dbConn;
  if (sessionId === undefined) {
    return db.all('SELECT * FROM Results ORDER BY finish_time ASC');
  }
  return db.all(
    'SELECT * FROM Results WHERE session_id = ? ORDER BY finish_time ASC',
    [String(sessionId)],
  );
}

// convenience when /results is called with no ?sessionId
export async function getAllResults() {
  const db = await dbConn;
  return db.all('SELECT * FROM Results ORDER BY finish_time ASC');
}
