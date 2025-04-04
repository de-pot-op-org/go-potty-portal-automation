/**
 * Convert locations JSON file to a FireFoo-compatible format
 * This script fixes the format issues that cause the "Unknown field node type: _qds" error
 */

const fs = require('fs');
const path = require('path');

// Path to locations.json file
const locationsFile = path.join(__dirname, '../current/locations.json');

// Read the current locations file
console.log(`Reading ${locationsFile}...`);
const locationsContent = fs.readFileSync(locationsFile, 'utf8');
const locationsData = JSON.parse(locationsContent);

// Make a backup of the original file
const backupFile = path.join(__dirname, `../current/locations-backup-${Date.now()}.json`);
console.log(`Creating backup at ${backupFile}...`);
fs.writeFileSync(backupFile, locationsContent, 'utf8');

// Create a proper FireFoo-compatible meta structure
const newLocationsData = {
  meta: {
    format: "JSON",
    version: "1.1.0",
    projectId: "go-potty-portal",
    resourcePath: ["locations"],
    recursive: false,
    creationTime: Math.floor(Date.now() / 1000),
    app: "firefoo"
  },
  data: {}
};

// Process each location entry
for (const [id, location] of Object.entries(locationsData.data)) {
  console.log(`Processing location: ${location.name} (${id})`);
  
  // Add the location to the new data structure
  newLocationsData.data[id] = {
    // Copy all properties
    ...location,
    // Ensure timestamps are in the expected format
    created_at: { __time__: location.created_at?.__time__ || "2024-09-05T12:00:00.000Z" },
    updated_at: { __time__: location.updated_at?.__time__ || "2024-09-05T12:00:00.000Z" },
    // Ensure collections are properly formatted
    __collections__: {
      insights: {}
    }
  };
}

// Write the fixed locations data to the file
console.log('Writing fixed locations data...');
fs.writeFileSync(locationsFile, JSON.stringify(newLocationsData, null, 2), 'utf8');

console.log('Done! The locations.json file has been converted to a FireFoo-compatible format.');
