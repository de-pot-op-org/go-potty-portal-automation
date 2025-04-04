/**
 * Convert users JSON file to a FireFoo-compatible format
 * This script fixes the format issues that cause the "Unknown field node type: _qds" error
 */

const fs = require('fs');
const path = require('path');

// Path to users.json file
const usersFile = path.join(__dirname, '../current/users.json');
const authUsersFile = path.join(__dirname, '../current/auth-users.json');

// Read the current users file
console.log(`Reading ${usersFile}...`);
const usersContent = fs.readFileSync(usersFile, 'utf8');
const usersData = JSON.parse(usersContent);

// Make a backup of the original file
const backupFile = path.join(__dirname, `../current/users-backup-${Date.now()}.json`);
console.log(`Creating backup at ${backupFile}...`);
fs.writeFileSync(backupFile, usersContent, 'utf8');

// Check if auth-users.json needs fixing too
if (fs.existsSync(authUsersFile)) {
  console.log(`Reading ${authUsersFile}...`);
  const authUsersContent = fs.readFileSync(authUsersFile, 'utf8');
  const authUsersData = JSON.parse(authUsersContent);
  
  // Make a backup of the original auth-users file
  const authBackupFile = path.join(__dirname, `../current/auth-users-backup-${Date.now()}.json`);
  console.log(`Creating backup of auth users at ${authBackupFile}...`);
  fs.writeFileSync(authBackupFile, authUsersContent, 'utf8');
  
  // Fix auth-users.json format
  const newAuthUsersData = {
    meta: {
      format: "JSON",
      version: "1.1.0",
      projectId: "go-potty-portal",
      resourcePath: ["auth-users"],
      recursive: false,
      creationTime: Math.floor(Date.now() / 1000),
      app: "firefoo"
    },
    data: {}
  };
  
  // Process each auth user entry
  for (const [id, user] of Object.entries(authUsersData.data || {})) {
    console.log(`Processing auth user: ${user.email || id}`);
    
    // Add the user to the new data structure
    newAuthUsersData.data[id] = {
      ...user
    };
  }
  
  // Write the fixed auth-users data to the file
  console.log('Writing fixed auth-users data...');
  fs.writeFileSync(authUsersFile, JSON.stringify(newAuthUsersData, null, 2), 'utf8');
}

// Create a proper FireFoo-compatible meta structure for users
const newUsersData = {
  meta: {
    format: "JSON",
    version: "1.1.0",
    projectId: "go-potty-portal",
    resourcePath: ["users"],
    recursive: false,
    creationTime: Math.floor(Date.now() / 1000),
    app: "firefoo"
  },
  data: {}
};

// Process each user entry
for (const [id, user] of Object.entries(usersData.data || {})) {
  console.log(`Processing user: ${user.email || id}`);
  
  // Add the user to the new data structure
  newUsersData.data[id] = {
    // Copy all properties
    ...user,
    // Ensure timestamps are in the expected format
    created_at: { __time__: user.created_at?.__time__ || "2024-09-05T12:00:00.000Z" },
    updated_at: { __time__: user.updated_at?.__time__ || "2024-09-05T12:00:00.000Z" },
    // Ensure collections are properly formatted if they exist
    ...(user.__collections__ ? { __collections__: user.__collections__ } : {})
  };
}

// Write the fixed users data to the file
console.log('Writing fixed users data...');
fs.writeFileSync(usersFile, JSON.stringify(newUsersData, null, 2), 'utf8');

console.log('Done! The users.json and auth-users.json files have been converted to a FireFoo-compatible format.');
