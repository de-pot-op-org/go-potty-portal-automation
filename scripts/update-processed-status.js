/**
 * Update processed status in Excel file
 * This script updates the processed status of items in the Excel file
 * based on the results of Firebase operations
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('excelFile', {
    alias: 'e',
    description: 'Path to Excel file',
    type: 'string',
    default: path.join(__dirname, '..', 'go-potty-data-entry.xlsx')
  })
  .option('processedDataFile', {
    alias: 'p',
    description: 'Path to processed data JSON file',
    type: 'string',
    demandOption: true
  })
  .option('type', {
    alias: 't',
    description: 'Type of data to update (organizations, users, locations)',
    type: 'string',
    demandOption: true,
    choices: ['organizations', 'users', 'locations']
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configuration based on type
const configs = {
  organizations: {
    sheetName: 'Organizations',
    processedColumn: 'Processed (Yes/No)',
    idColumn: 'Organization ID'
  },
  users: {
    sheetName: 'Users',
    authColumn: 'Auth Account Created (Yes/No)',
    firestoreColumn: 'Firestore Doc Created (Yes/No)',
    idColumn: 'User ID'
  },
  locations: {
    sheetName: 'Locations',
    processedColumn: 'Processed (Yes/No)',
    idColumn: 'Location ID'
  }
};

// Get configuration for the selected type
const config = configs[argv.type];

function updateOrganizations(workbook, processedData) {
  console.log('Updating organizations processed status...');
  
  // Get organizations sheet
  const sheet = workbook.Sheets[config.sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${config.sheetName} not found in Excel file`);
  }
  
  // Convert sheet to JSON
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Update processed status for each organization
  let updatedCount = 0;
  processedData.organizations.forEach(org => {
    if (org.index >= 0 && org.index < data.length) {
      // Set organization ID if available
      if (org.id) {
        data[org.index][config.idColumn] = org.id;
      }
      
      // Mark as processed
      data[org.index][config.processedColumn] = 'Yes';
      updatedCount++;
    }
  });
  
  // Convert back to sheet and update workbook
  const updatedSheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[config.sheetName] = updatedSheet;
  
  console.log(`Updated status for ${updatedCount} organizations`);
}

function updateUsers(workbook, processedData) {
  console.log('Updating users processed status...');
  
  // Get users sheet
  const sheet = workbook.Sheets[config.sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${config.sheetName} not found in Excel file`);
  }
  
  // Convert sheet to JSON
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Update processed status for each user
  let updatedCount = 0;
  processedData.users.forEach(user => {
    if (user.index >= 0 && user.index < data.length) {
      // Set user ID if available
      if (user.id) {
        data[user.index][config.idColumn] = user.id;
      }
      
      // Update Auth and Firestore status separately
      if (user.authCreated) {
        data[user.index][config.authColumn] = 'Yes';
      }
      
      if (user.firestoreCreated) {
        data[user.index][config.firestoreColumn] = 'Yes';
      }
      
      updatedCount++;
    }
  });
  
  // Convert back to sheet and update workbook
  const updatedSheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[config.sheetName] = updatedSheet;
  
  console.log(`Updated status for ${updatedCount} users`);
}

function updateLocations(workbook, processedData) {
  console.log('Updating locations processed status...');
  
  // Get locations sheet
  const sheet = workbook.Sheets[config.sheetName];
  if (!sheet) {
    throw new Error(`Sheet ${config.sheetName} not found in Excel file`);
  }
  
  // Convert sheet to JSON
  const data = XLSX.utils.sheet_to_json(sheet);
  
  // Update processed status for each location
  let updatedCount = 0;
  processedData.locations.forEach(location => {
    if (location.index >= 0 && location.index < data.length) {
      // Set location ID if available
      if (location.id) {
        data[location.index][config.idColumn] = location.id;
      }
      
      // Mark as processed
      data[location.index][config.processedColumn] = 'Yes';
      updatedCount++;
    }
  });
  
  // Convert back to sheet and update workbook
  const updatedSheet = XLSX.utils.json_to_sheet(data);
  workbook.Sheets[config.sheetName] = updatedSheet;
  
  console.log(`Updated status for ${updatedCount} locations`);
}

// Main function
function main() {
  try {
    // Read Excel file
    console.log(`Reading Excel file: ${argv.excelFile}`);
    const workbook = XLSX.readFile(argv.excelFile);
    
    // Read processed data file
    console.log(`Reading processed data from: ${argv.processedDataFile}`);
    const processedDataJson = fs.readFileSync(argv.processedDataFile, 'utf8');
    const processedData = JSON.parse(processedDataJson);
    
    // Update processed status based on type
    switch (argv.type) {
      case 'organizations':
        updateOrganizations(workbook, processedData);
        break;
      case 'users':
        updateUsers(workbook, processedData);
        break;
      case 'locations':
        updateLocations(workbook, processedData);
        break;
    }
    
    // Write updated Excel file
    console.log(`Writing updated Excel file: ${argv.excelFile}`);
    XLSX.writeFile(workbook, argv.excelFile);
    
    console.log('Update completed successfully');
    
  } catch (error) {
    console.error(`Error updating processed status: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 