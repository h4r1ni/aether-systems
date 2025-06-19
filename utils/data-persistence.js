// Simple JSON Line (JSONL) persistence utility
const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data_backups');

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (err) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Save a record to the appropriate JSONL file
async function saveJsonRecord(type, data) {
  await ensureDataDirectory();
  const filePath = path.join(DATA_DIR, `${type}.jsonl`);
  
  // Add timestamp and unique ID
  const record = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 15),
    timestamp: new Date().toISOString(),
    ...data
  };
  
  // Append record as JSON line
  await fs.appendFile(filePath, JSON.stringify(record) + '\n', 'utf8');
  
  // Rotate file if it gets too large (10MB)
  const stats = await fs.stat(filePath);
  if (stats.size > 10 * 1024 * 1024) {
    await rotateFile(filePath);
  }
  
  return record;
}

// Read all records of a specific type
async function readJsonRecords(type) {
  const filePath = path.join(DATA_DIR, `${type}.jsonl`);
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return content.split('\n')
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

// Rotate a file by moving it to an archive with timestamp
async function rotateFile(filePath) {
  const archivePath = filePath + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.archive';
  await fs.rename(filePath, archivePath);
  // Create new empty file
  await fs.writeFile(filePath, '', 'utf8');
}

module.exports = {
  saveJsonRecord,
  readJsonRecords
};
