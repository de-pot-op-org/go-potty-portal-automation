/**
 * Extract unprocessed data from Excel file
 * This script identifies entries that haven't been processed and extracts them to JSON
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('type', {
    alias: 't',
    description: 'Type of data to extract (organizations, users, locations)',
    type: 'string',
    demandOption: true,
    choices: ['organizations', 'users', 'locations']
  })
  .option('excelFile', {
    alias: 'e',
    description: 'Path to Excel file',
    type: 'string',
    default: path.join(__dirname, '..', 'go-potty-data-entry.xlsx')
  })
  .option('outputFile', {
    alias: 'o',
    description: 'Path to output JSON file',
    type: 'string'
  })
  .help()
  .alias('help', 'h')
  .argv;

// Configuration based on type
const configs = {
  organizations: {
    sheetName: 'Organizations',
    processedColumn: 'Processed (Yes/No)',
    idColumn: 'Organization ID',
    outputFile: argv.outputFile || path.join(__dirname, '..', 'unprocessed-organizations.json')
  },
  users: {
    sheetName: 'Users',
    authColumn: 'Auth Account Created (Yes/No)',
    firestoreColumn: 'Firestore Doc Created (Yes/No)',
    idColumn: 'User ID',
    outputFile: argv.outputFile || path.join(__dirname, '..', 'unprocessed-users.json')
  },
  locations: {
    sheetName: 'Locations',
    processedColumn: 'Processed (Yes/No)',
    idColumn: 'Location ID',
    outputFile: argv.outputFile || path.join(__dirname, '..', 'unprocessed-locations.json')
  }
};

// Get configuration for the selected type
const config = configs[argv.type];

function extractOrganizations(data) {
  const unprocessedOrgs = data
    .filter(org => org[config.processedColumn] !== 'Yes')
    .map((org, index) => ({
      index,
      name: org.Name || '',
      location_types: org['Location Types'] || '',
      address: {
        country: org.Country || '',
        county: org.County || '',
        street: org.Street || '',
        street_number: org['Street Number'] || '',
        city: org.City || '',
        postal_code: org['Postal Code'] || ''
      }
    }));
  
  return { organizations: unprocessedOrgs };
}

function extractUsers(data) {
  const unprocessedUsers = data
    .filter(user => 
      user[config.authColumn] !== 'Yes' || 
      user[config.firestoreColumn] !== 'Yes'
    )
    .map((user, index) => ({
      index,
      email: user.Email || '',
      organization_id: user['Organization ID'] || '',
      auth_created: user[config.authColumn] === 'Yes',
      firestore_created: user[config.firestoreColumn] === 'Yes'
    }));
  
  return { users: unprocessedUsers };
}

function extractLocations(data) {
  const unprocessedLocations = data
    .filter(location => location[config.processedColumn] !== 'Yes')
    .map((location, index) => ({
      index,
      name: location.Name || '',
      location_type: location['Location Type'] || '',
      organization_id: location['Organization ID'] || '',
      address: {
        country: location.Country || '',
        county: location.County || '',
        street: location.Street || '',
        street_number: location['Street Number'] || '',
        city: location.City || '',
        postal_code: location['Postal Code'] || ''
      }
    }));
  
  return { locations: unprocessedLocations };
}

// Main function
function main() {
  try {
    // Read Excel file
    console.log(`Reading Excel file: ${argv.excelFile}`);
    const workbook = XLSX.readFile(argv.excelFile);
    
    // Extract data from sheet
    const sheet = workbook.Sheets[config.sheetName];
    if (!sheet) {
      throw new Error(`Sheet ${config.sheetName} not found in Excel file`);
    }
    
    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(sheet);
    
    // Extract unprocessed data based on type
    let unprocessedData;
    switch (argv.type) {
      case 'organizations':
        unprocessedData = extractOrganizations(data);
        break;
      case 'users':
        unprocessedData = extractUsers(data);
        break;
      case 'locations':
        unprocessedData = extractLocations(data);
        break;
    }
    
    // Write output to file
    fs.writeFileSync(config.outputFile, JSON.stringify(unprocessedData, null, 2));
    
    console.log(`Extracted ${unprocessedData[argv.type].length} unprocessed ${argv.type}`);
    console.log(`Output written to: ${config.outputFile}`);
    
  } catch (error) {
    console.error(`Error extracting unprocessed data: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 