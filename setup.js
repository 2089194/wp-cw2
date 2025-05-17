import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import fs from 'fs/promises';

const dbFile = './database.sqlite';
const sqlFile = './001-init.sql';

const runSetup = async () => {
  const db = await open({
    filename: dbFile,
    driver: sqlite3.Database,
  });
  const sql = await fs.readFile(sqlFile, 'utf8');
  await db.exec(sql);
  console.log('Database setup complete.');
};

runSetup();