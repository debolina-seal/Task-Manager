// Test setup file
const fs = require('fs');
const path = require('path');

// Ensure test data directory exists
const testDataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Set test environment
process.env.NODE_ENV = 'test';
