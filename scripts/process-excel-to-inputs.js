/**
 * Process Excel Data to Current JSON Files
 * This script extracts unprocessed data from Excel and merges it into current JSON files
 */

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const crypto = require('crypto');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('excelFile', {
    alias: 'e',
    description: 'Path to Excel file',
    type: 'string',
    default: path.join(__dirname, '..', 'go-potty-portal.xlsx')
  })
  .help()
  .alias('help', 'h')
  .argv;

// Define constants for file paths
const FILE_PATHS = {
  ORGANISATIONS: path.join(__dirname, '..', 'inputs', 'organisations.json'),
  AUTH_USERS: path.join(__dirname, '..', 'inputs', 'auth-users.json'),
  USERS: path.join(__dirname, '..', 'inputs', 'users.json'),
  LOCATIONS: path.join(__dirname, '..', 'inputs', 'locations.json')
};

// Define constants for output file paths
const OUTPUT_PATHS = {
  ORGANISATIONS: path.join(__dirname, '..', 'outputs', 'organisations.json'),
  AUTH_USERS: path.join(__dirname, '..', 'outputs', 'auth-users.json'),
  USERS: path.join(__dirname, '..', 'outputs', 'users.json'),
  LOCATIONS: path.join(__dirname, '..', 'outputs', 'locations.json'),
  WELCOME_EMAILS: path.join(__dirname, '..', 'outputs', 'welcome-emails.txt')
};

// Define sheet names
const SHEETS = {
  ORGANIZATIONS: 'Organizations',
  USERS: 'Users',
  LOCATIONS: 'Locations'
};

// Define column names
const COLUMNS = {
  ORGANIZATIONS: {
    PROCESSED: 'Processed (Yes/No)',
    NAME: 'Name',
    LOCATION_TYPES: 'Location Types',
    COUNTRY: 'Country',
    COUNTY: 'County',
    STREET: 'Street',
    STREET_NUMBER: 'Street Number',
    CITY: 'City',
    POSTAL_CODE: 'Postal Code'
  },
  USERS: {
    AUTH_CREATED: 'Auth Account Created (Yes/No)',
    FIRESTORE_CREATED: 'Firestore Doc Created (Yes/No)',
    EMAIL: 'Email',
    ORGANIZATION_ID: 'Organization ID'
  },
  LOCATIONS: {
    PROCESSED: 'Processed (Yes/No)',
    NAME: 'Name',
    LOCATION_TYPE: 'Location Type',
    ORGANIZATION_ID: 'Organization ID',
    COUNTRY: 'Country',
    COUNTY: 'County',
    STREET: 'Street',
    STREET_NUMBER: 'Street Number',
    CITY: 'City',
    POSTAL_CODE: 'Postal Code'
  }
};

// Define constants for timestamps and default values
const DEFAULTS = {
  ADMIN_USER_ID: 'system',
  TIMESTAMP: { __time__: new Date().toISOString() },
  TIMEZONE: 'Europe/Amsterdam',
  // Default password for new users
  DEFAULT_PASSWORD: 'WelkomBijGoPotty2025!',
  // Track new/modified entities
  NEW_ENTITIES: {
    ORGANISATIONS: {},
    AUTH_USERS: {},
    USERS: {},
    LOCATIONS: {}
  },
  // Portal URL
  PORTAL_URL: 'https://go-potty-portal.web.app/',
  // Email templates
  EMAIL_TEMPLATES: {
    ENGLISH: {
      SUBJECT: '🚽 Go Potty Portal Login Details',
      BODY: `Hello,

You have been granted access to the Go Potty portal. Please use the information below to log in.

Website: https://go-potty-portal.web.app/
Email: {{EMAIL}}
Password: {{PASSWORD}}

If you have any questions or need assistance, do not hesitate to contact us at hello@gopottynow.com or by replying to this email. We're here to help!

Kind regards,
The Go Potty Team`
    },
    DUTCH: {
      SUBJECT: '🚽 Go Potty Portal Inloggegevens',
      BODY: `Hallo,

Je hebt toegang gekregen tot het De Pot Op portaal. Gebruik de onderstaande informatie om in te loggen.

Website: https://go-potty-portal.web.app/
E-mail: {{EMAIL}}
Wachtwoord: {{PASSWORD}}

Als je vragen hebt of hulp nodig hebt, neem dan contact met ons op via hallo@depotop.nu of door deze e-mail te beantwoorden.

Vriendelijke groeten,
De Pot Op Team`
    }
  }
};

// Helper function for ID generation
const generateId = {
  // Generate real Firebase auth ID instead of placeholder
  auth: () => generateFirebaseAuthId(),
  // Generate real Firestore document ID instead of placeholder
  firestore: () => generateFirestoreDocId(),
  // Use proper ID format for organizations/locations
  org: (name) => generateFirestoreDocId(),
  location: (name) => generateFirestoreDocId()
};

// Predefined organization IDs
const PREDEFINED_IDS = {
  GEMEENTE_DEN_HAAG: 'HDBkVsEX7cuazk28MNoT',
  REQUIRED_EXISTING_ID: 'aCLqsMmDTDnaObYWmrs3'
};

/**
 * Helper function to read and parse a JSON file
 * @param {string} filePath - Path to the JSON file
 * @returns {Object} Parsed JSON object
 */
function readFromCurrentFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found. Creating a new one.`);
    return {};
  }

  console.log(`Reading JSON file: ${filePath}`);
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(content);
    // Handle both FireFoo format and our older format
    return parsed.data || {};
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return {};
  }
}

/**
 * Helper function to write data to a JSON file
 * @param {string} filePath - Path to the JSON file
 * @param {Object} data - Data to write
 * @param {boolean} [isOutputFile=false] - Whether this is an output file
 */
function saveToFile(filePath, data, isOutputFile = false, onlyNewEntities = false) {
  console.log(`Writing JSON file: ${filePath}`);

  // Create directories if they don't exist
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // Get collection name from file path
  const fileName = path.basename(filePath, '.json');
  let resourcePath = [fileName];
  if (fileName === 'auth-users') {
    resourcePath = ['auth-users'];
  }
  
  // If this is empty data and we're only showing new entities, skip it
  if (onlyNewEntities && Object.keys(data).length === 0) {
    console.log(`No new ${fileName} to write, skipping output file.`);
    return;
  }

  // Create FireFoo-compatible JSON structure
  const firefooData = {
    meta: {
      format: "JSON",
      version: "1.1.0",
      projectId: "go-potty-portal",
      resourcePath: resourcePath,
      recursive: false,
      creationTime: Math.floor(Date.now() / 1000),
      app: "firefoo"
    },
    data: data
  };

  try {
    // Convert data to FireFoo-compatible JSON format
    const content = JSON.stringify(firefooData, null, 2);
    
    // Always write to the specified file path (current directory)
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Successfully wrote ${filePath}`);
    
    // If this is already an output file, we're done
    if (isOutputFile) return;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

/**
 * Helper function to read a sheet from an Excel file
 * @param {string} filePath - Path to the Excel file
 * @param {string} sheetName - Name of the sheet to read
 * @returns {Array} Array of row objects
 */
function readExcelSheet(filePath, sheetName) {
  try {
    console.log(`Reading Excel sheet: ${sheetName} from ${filePath}`);
    const workbook = XLSX.readFile(filePath);
    
    // Check if sheet exists
    if (!workbook.Sheets[sheetName]) {
      throw new Error(`Sheet ${sheetName} not found in Excel file`);
    }
    
    // Convert sheet to JSON
    const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`Read ${data.length} rows from ${sheetName} sheet`);
    return data;
  } catch (error) {
    console.error(`Error reading Excel sheet ${sheetName}: ${error.message}`);
    throw error;
  }
}

/**
 * Helper function to find an organization by name in the current organizations data
 * @param {string} name - Organization name to search for
 * @param {Object} orgData - Current organizations data
 * @returns {string|null} Organization ID if found, null otherwise
 */
function findOrgByName(name, orgData) {
  if (!orgData || !orgData.data) {
    return null;
  }
  
  // Iterate through organization entries
  for (const [id, org] of Object.entries(orgData.data)) {
    if (org.name === name) {
      return id;
    }
  }
  
  return null;
}

/**
 * Helper function to generate an ID for an entity
 * @param {string} type - Type of entity ('auth', 'org', 'location')
 * @param {string} name - Name to use for contextual IDs (if needed)
 * @returns {string} Generated ID appropriate for the entity type
 */
function generateEntityId(type, name) {
  switch (type) {
    case 'auth':
      return generateId.auth();
    case 'org':
      return generateId.org(name);
    case 'location':
      return generateId.location(name);
    default:
      return generateFirestoreDocId();
  }
}

/**
 * Helper function to find an auth user by email in the current auth users data
 * @param {string} email - Email to search for
 * @param {Object} authData - Current auth users data
 * @returns {Object|null} Auth user object if found, null otherwise
 */
function findAuthUserByEmail(email, authData) {
  if (!authData || !authData.users || !Array.isArray(authData.users)) {
    return null;
  }
  
  // Find user by email
  return authData.users.find(user => user.email === email) || null;
}

/**
 * Helper function to derive a display name from an email address
 * @param {string} email - Email address
 * @returns {string} Display name derived from the email
 */
function deriveDisplayName(email) {
  if (!email) {
    return '';
  }
  
  // Get part before @ symbol
  const emailPrefix = email.split('@')[0];
  
  // Format the name: capitalize first letter of each part separated by dot or underscore
  return emailPrefix
    .split(/[._]/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Helper function to find a location by name in the current locations data
 * @param {string} name - Location name to search for
 * @param {Object} locData - Current locations data
 * @returns {string|null} Location ID if found, null otherwise
 */
function findLocationByName(name, locData) {
  if (!locData || !locData.data) {
    return null;
  }
  
  // Iterate through location entries
  for (const [id, loc] of Object.entries(locData.data)) {
    if (loc.name === name) {
      return id;
    }
  }
  
  return null;
}

/**
 * Generate a Firebase-like auth ID (20-22 character base64url string)
 * @returns {string} A Firebase-like auth ID
 */
function generateFirebaseAuthId() {
  // Generate 16 random bytes (16 * 8 = 128 bits) and convert to base64url
  const randomBytes = crypto.randomBytes(16);
  return randomBytes.toString('base64')
    .replace(/\+/g, '-') // Convert '+' to '-'
    .replace(/\//g, '_') // Convert '/' to '_'
    .replace(/=/g, '');  // Remove trailing '=' padding
}

/**
 * Generate a Firebase-compatible Firestore document ID (20 character alphanumeric)
 * This uses the same algorithm that Firebase uses for auto-generated IDs.
 * @returns {string} A Firebase-compatible Firestore document ID
 */
function generateFirestoreDocId() {
  // Firebase uses a mix of random characters from this specific set
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  // Generate a 20 character ID as used by Firestore
  for (let i = 0; i < 20; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Generate a password hash for the specified password
 * @param {string} password - The password to hash
 * @param {string} salt - The salt to use
 * @returns {string} Base64-encoded password hash
 */
function generatePasswordHash(password, salt) {
  // Convert salt from base64 to buffer
  const saltBuffer = Buffer.from(salt, 'base64');
  
  // Use PBKDF2 with 10000 iterations and SHA-256 to generate a 32-byte key
  const key = crypto.pbkdf2Sync(password, saltBuffer, 10000, 32, 'sha256');
  
  // Return the key as a base64 string
  return key.toString('base64');
}

/**
 * Generate a random salt for password hashing
 * @returns {string} Base64-encoded salt
 */
function generateSalt() {
  const SALT_LENGTH = 16; // 16 bytes = 128 bits
  return crypto.randomBytes(SALT_LENGTH).toString('base64');
}

/**
 * Generate welcome email content for a new user
 * @param {string} email - User's email address
 * @param {string} password - User's initial password
 * @param {string} language - Language for the email (english or dutch)
 * @returns {Object} Email content with subject and body
 */
function generateWelcomeEmail(email, password, language = 'english') {
  const template = language.toLowerCase() === 'dutch' ? 
    DEFAULTS.EMAIL_TEMPLATES.DUTCH : 
    DEFAULTS.EMAIL_TEMPLATES.ENGLISH;
  
  // Replace placeholders in the template
  const body = template.BODY
    .replace('{{EMAIL}}', email)
    .replace('{{PASSWORD}}', password);
  
  return {
    to: email,
    subject: template.SUBJECT,
    body: body
  };
}

// Main function
function main() {
  try {
    console.log(`Starting Excel data processing...`);
    
    // Step 1: Parse arguments
    const excelFilePath = argv.excelFile;
    console.log(`Using Excel file: ${excelFilePath}`);
    
    // Step 2: Read current JSON files into memory
    let currentOrgData, currentAuthData, currentUserData, currentLocationData;
    
    try {
      // Read organization data
      currentOrgData = readFromCurrentFile(FILE_PATHS.ORGANISATIONS);
      console.log(`Loaded ${Object.keys(currentOrgData || {}).length} organizations`);
      
      // Read auth users data
      currentAuthData = readFromCurrentFile(FILE_PATHS.AUTH_USERS);
      console.log(`Loaded ${Object.keys(currentAuthData || {}).length} auth users`);
      
      // Read firestore users data
      currentUserData = readFromCurrentFile(FILE_PATHS.USERS);
      console.log(`Loaded ${Object.keys(currentUserData || {}).length} firestore users`);
      
      // Read locations data
      currentLocationData = readFromCurrentFile(FILE_PATHS.LOCATIONS);
      console.log(`Loaded ${Object.keys(currentLocationData || {}).length} locations`);
      
    } catch (error) {
      console.error(`Error reading current JSON files: ${error.message}`);
      console.error(`Please ensure all required current/*.json files exist and are valid JSON`);
      process.exit(1);
    }
    
    // Step 3: Read Excel sheets and extract unprocessed data
    let orgSheetData, userSheetData, locSheetData;
    let unprocessedOrgs, unprocessedUsers, unprocessedLocations;
    
    try {
      // Read Organizations sheet
      orgSheetData = readExcelSheet(excelFilePath, SHEETS.ORGANIZATIONS);
      
      // Filter organizations where 'Processed (Yes/No)' is not 'Yes'
      unprocessedOrgs = orgSheetData
        .filter(org => org[COLUMNS.ORGANIZATIONS.PROCESSED] !== 'Yes')
        .map((org, index) => ({
          index,
          name: org[COLUMNS.ORGANIZATIONS.NAME] || '',
          location_types: org[COLUMNS.ORGANIZATIONS.LOCATION_TYPES] || '',
          address: {
            country: org[COLUMNS.ORGANIZATIONS.COUNTRY] || '',
            county: org[COLUMNS.ORGANIZATIONS.COUNTY] || '',
            street: org[COLUMNS.ORGANIZATIONS.STREET] || '',
            street_number: org[COLUMNS.ORGANIZATIONS.STREET_NUMBER] || '',
            city: org[COLUMNS.ORGANIZATIONS.CITY] || '',
            postal_code: org[COLUMNS.ORGANIZATIONS.POSTAL_CODE] || ''
          }
        }));
      
      console.log(`Found ${unprocessedOrgs.length} unprocessed organizations`);
      
      // Read Users sheet
      userSheetData = readExcelSheet(excelFilePath, SHEETS.USERS);
      
      // Filter users where 'Auth Account Created (Yes/No)' is not 'Yes' OR 'Firestore Doc Created (Yes/No)' is not 'Yes'
      unprocessedUsers = userSheetData
        .filter(user => 
          user[COLUMNS.USERS.AUTH_CREATED] !== 'Yes' || 
          user[COLUMNS.USERS.FIRESTORE_CREATED] !== 'Yes'
        )
        .map((user, index) => ({
          index,
          email: user[COLUMNS.USERS.EMAIL] || '',
          organization_id: user[COLUMNS.USERS.ORGANIZATION_ID] || '',
          auth_created: user[COLUMNS.USERS.AUTH_CREATED] === 'Yes',
          firestore_created: user[COLUMNS.USERS.FIRESTORE_CREATED] === 'Yes'
        }));
      
      console.log(`Found ${unprocessedUsers.length} unprocessed users`);
      
      // Read Locations sheet
      locSheetData = readExcelSheet(excelFilePath, SHEETS.LOCATIONS);
      
      // Filter locations where 'Processed (Yes/No)' is not 'Yes'
      unprocessedLocations = locSheetData
        .filter(location => location[COLUMNS.LOCATIONS.PROCESSED] !== 'Yes')
        .map((location, index) => ({
          index,
          name: location[COLUMNS.LOCATIONS.NAME] || '',
          location_type: location[COLUMNS.LOCATIONS.LOCATION_TYPE] || '',
          organization_id: location[COLUMNS.LOCATIONS.ORGANIZATION_ID] || '',
          address: {
            country: location[COLUMNS.LOCATIONS.COUNTRY] || '',
            county: location[COLUMNS.LOCATIONS.COUNTY] || '',
            street: location[COLUMNS.LOCATIONS.STREET] || '',
            street_number: location[COLUMNS.LOCATIONS.STREET_NUMBER] || '',
            city: location[COLUMNS.LOCATIONS.CITY] || '',
            postal_code: location[COLUMNS.LOCATIONS.POSTAL_CODE] || ''
          }
        }));
      
      console.log(`Found ${unprocessedLocations.length} unprocessed locations`);
      
    } catch (error) {
      console.error(`Error extracting unprocessed data from Excel: ${error.message}`);
      process.exit(1);
    }
    
    // Milestone 2: Process Organizations
    console.log('\nProcessing Organizations...');
    
    // Create map to store processed organization IDs
    const processedOrgIds = {};
    
    // Iterate through unprocessed organizations
    for (const org of unprocessedOrgs) {
      // Check if organization already exists by name
      const existingId = findOrgByName(org.name, currentOrgData);
      
      if (!existingId) {
        // Organization doesn't exist, create a new entry
        
        // Determine the ID for the new organization
        let determinedId;
        if (org.name === 'Gemeente Den Haag') {
          determinedId = PREDEFINED_IDS.GEMEENTE_DEN_HAAG;
        } else {
          determinedId = generateEntityId('org', org.name);
        }
        
        // Check if the generated ID already exists (unlikely but possible)
        if (currentOrgData[determinedId]) {
          console.error(`Error: Generated ID ${determinedId} for organization ${org.name} already exists in currentOrgData.`);
          continue;
        }
        
        // Parse location_types into an array or default to ['location']
        let locationTypes = ['location'];
        if (org.location_types) {
          try {
            const parsedTypes = org.location_types.split(',').map(type => type.trim());
            if (parsedTypes.length > 0) {
              locationTypes = parsedTypes;
            }
          } catch (error) {
            console.warn(`Warning: Could not parse location_types for ${org.name}, using default ['location'].`);
          }
        }
        
        // Create new organization entry
        const newOrgEntry = {
          id: determinedId,
          name: org.name,
          location_types: locationTypes,
          created_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          created_by: DEFAULTS.ADMIN_USER_ID,
          updated_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          updated_by: DEFAULTS.ADMIN_USER_ID,
          __collections__: {
            insights: {},
            organisation_members: {}
          }
        };
        
        // Add new organization to currentOrgData
        currentOrgData[determinedId] = newOrgEntry;
        
        // Track this as a new entity for output
        DEFAULTS.NEW_ENTITIES.ORGANISATIONS[determinedId] = newOrgEntry;
        
        // Store the ID for future reference
        processedOrgIds[org.name] = determinedId;
        
        console.log(`Added new organization: ${org.name} with ID ${determinedId}`);
      } else {
        // Organization already exists
        processedOrgIds[org.name] = existingId;
        console.log(`Organization ${org.name} already exists with ID ${existingId}`);
      }
    }
    
    // Verify that the required existing ID is present
    if (!currentOrgData[PREDEFINED_IDS.REQUIRED_EXISTING_ID]) {
      console.warn(`Warning: Required organization ID ${PREDEFINED_IDS.REQUIRED_EXISTING_ID} is not present in currentOrgData.`);
    } else {
      // Store the ID for future reference
      processedOrgIds['Gemeente Den Haag'] = PREDEFINED_IDS.REQUIRED_EXISTING_ID;
      console.log(`Verified required organization ID ${PREDEFINED_IDS.REQUIRED_EXISTING_ID} is present.`);
    }
    
    // Milestone 3: Process Auth Users
    console.log('\nProcessing Auth Users...');
    
    // Store added auth user IDs for tracking
    const newlyAddedAuthUsers = [];
    const newlyAddedAuthUsersInfo = [];
    
    // Iterate through unprocessed users
    for (const user of unprocessedUsers) {
      // Only process users that don't have auth accounts yet
      if (!user.auth_created) {
        // Find if user already exists by email
        const existingUser = findAuthUserByEmail(user.email, currentAuthData);
        
        if (!existingUser) {
          // Get the organization ID for this user
          const organizationId = user.organization_id;
          
          // Verify organization ID exists
          if (!currentOrgData[organizationId]) {
            console.error(`Error: Organization ID ${organizationId} for user ${user.email} not found in currentOrgData. Skipping user.`);
            continue;
          }
          
          // Generate real Firebase auth ID
          const authId = generateEntityId('auth');
          
          // Create custom attributes with organization ID
          const customAttributes = JSON.stringify({
            organisation_id: organizationId
          });
          
          // Generate salt and password hash for default password
          const salt = generateSalt();
          const passwordHash = generatePasswordHash(DEFAULTS.DEFAULT_PASSWORD, salt);
          
          // Create new auth user entry with real values
          const newAuthEntry = {
            localId: authId,
            email: user.email,
            emailVerified: true,
            passwordHash: passwordHash,
            salt: salt,
            createdAt: DEFAULTS.TIMESTAMP_MS,
            lastSignedInAt: DEFAULTS.TIMESTAMP_MS,
            disabled: false,
            customAttributes: customAttributes,
            providerUserInfo: []
          };
          
          // Add to current auth users data - in FireFoo format
          if (!currentAuthData) {
            currentAuthData = {};
          }
          currentAuthData[authId] = newAuthEntry;
          
          // Track this as a new entity for output
          DEFAULTS.NEW_ENTITIES.AUTH_USERS[authId] = newAuthEntry;
          
          // Store info for Milestone 4
          newlyAddedAuthUsersInfo.push({
            authId,
            email: user.email,
            organizationId
          });
          // Add to the tracking array
          if (newlyAddedAuthUsers) {
            newlyAddedAuthUsers.push(authId);
          }
          console.log(`Added new auth user: ${user.email} with ID ${authId}`);
        } else {
          console.log(`Auth user ${user.email} already exists with ID ${existingUser.localId}`);
        }
      } else {
        console.log(`Skipping user ${user.email} - auth account already created`);
      }
    }
    
    console.log(`Added ${newlyAddedAuthUsersInfo.length} new auth users`);
    
    // Milestone 4: Process Firestore Users & Links
    console.log('\nProcessing Firestore Users & Organization Links...');
    
    // Iterate through newly added auth users
    for (const newUserInfo of newlyAddedAuthUsersInfo) {
      const { authId, email, organizationId } = newUserInfo;
      
      // 1. Update currentUserData (Firestore users)
      if (!currentUserData[authId]) {
        // User doesn't exist in Firestore, create new user document
        
        // Create display name from email
        const displayName = deriveDisplayName(email);
        
        // Create user profile sub-document
        const newUserProfileDoc = {
          display_name: displayName,
          organisation_id: organizationId,
          created_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          updated_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          __collections__: {}
        };
        
        // Create main user document
        const newUserDoc = {
          email: email,
          created_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          updated_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          __collections__: {
            user_profiles: {}
          }
        };
        
        // Add user profile to user document
        newUserDoc.__collections__.user_profiles[authId] = newUserProfileDoc;
        
        // Add user document to currentUserData
        currentUserData[authId] = newUserDoc;
        
        // Track this as a new entity for output
        DEFAULTS.NEW_ENTITIES.USERS[authId] = newUserDoc;
        
        console.log(`Added new Firestore user document for ${email} with ID ${authId}`);
      } else {
        console.log(`Firestore user document for ${email} with ID ${authId} already exists`);
      }
      
      // 2. Update currentOrgData (Organization members)
      const orgEntry = currentOrgData[organizationId];
      
      if (orgEntry) {
        // Ensure the organisation_members collection exists
        if (!orgEntry.__collections__) {
          orgEntry.__collections__ = {};
        }
        if (!orgEntry.__collections__.organisation_members) {
          orgEntry.__collections__.organisation_members = {};
        }
        
        // Check if user is already a member
        if (!orgEntry.__collections__.organisation_members[authId]) {
          // Create new organization member document
          const newOrgMemberDoc = {
            user_id: authId,
            roles: ["viewer"],
            created_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
            created_by: DEFAULTS.ADMIN_USER_ID,
            updated_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
            updated_by: DEFAULTS.ADMIN_USER_ID,
            __collections__: {}
          };
          
          // Add member to organization
          orgEntry.__collections__.organisation_members[authId] = newOrgMemberDoc;
          
          console.log(`Added user ${email} as member of organization ${orgEntry.name}`);
        } else {
          console.log(`User ${email} is already a member of organization ${orgEntry.name}`);
        }
      } else {
        console.error(`Error: Organization with ID ${organizationId} not found in currentOrgData. Cannot add user ${email} as member.`);
      }
    }
    
    console.log(`Processed ${newlyAddedAuthUsersInfo.length} Firestore users and organization links`);
    
    // Milestone 5: Process Locations & Write Files
    console.log('\nProcessing Locations...');
    
    // Iterate through unprocessed locations
    for (const loc of unprocessedLocations) {
      // Check if location already exists by name
      const existingLocId = findLocationByName(loc.name, currentLocationData);
      
      if (!existingLocId) {
        // Location doesn't exist, create a new entry
        
        // Determine the organization ID for this location
        // For this project, both "Vrouwenbuurtlab" and "CJG" belong to "Gemeente Den Haag"
        // If location has an organization_id, use it, otherwise use the predefined ID for Gemeente Den Haag
        let organizationId = loc.organization_id;
        if (!organizationId || !currentOrgData[organizationId]) {
          organizationId = PREDEFINED_IDS.GEMEENTE_DEN_HAAG;
        }
        
        // Verify organization ID exists
        if (!currentOrgData[organizationId]) {
          console.error(`Error: Organization ID ${organizationId} for location ${loc.name} not found in currentOrgData. Skipping location.`);
          continue;
        }
        
        // Generate real location ID
        const locationId = generateEntityId('location', loc.name);
        
        // Flatten address structure
        const flattenedAddress = {
          address_line1: loc.address.street + (loc.address.street_number ? ` ${loc.address.street_number}` : ''),
          address_line2: '',  // Set to empty string as per requirements
          address_city: loc.address.city || '',
          address_region: '',  // Set to empty string as per requirements
          address_postal_code: loc.address.postal_code || '',
          address_country: loc.address.country || ''
        };
        
        // Create new location entry with proper FireFoo compatibility
        const newLocationEntry = {
          name: loc.name,
          location_type: loc.location_type || 'location',
          organisation_id: organizationId,
          ...flattenedAddress,
          created_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          created_by: DEFAULTS.ADMIN_USER_ID,
          updated_at: { __time__: DEFAULTS.TIMESTAMP.__time__ || "2024-09-05T12:00:00.000Z" },
          updated_by: DEFAULTS.ADMIN_USER_ID,
          __collections__: {
            // Empty insights collection (will be populated by the app)
            insights: {}
          }
        };
        
        // Add new location to currentLocationData
        currentLocationData[locationId] = newLocationEntry;
        
        // Track this as a new entity for output
        DEFAULTS.NEW_ENTITIES.LOCATIONS[locationId] = newLocationEntry;
        
        console.log(`Added new location: ${loc.name} with ID ${locationId}`);
      } else {
        console.log(`Location ${loc.name} already exists with ID ${existingLocId}`);
      }
    }
    
    console.log(`Processing complete. Writing updated data to files...`);
    
    // Write all updated data to input files for git diff tracking
    saveToFile(FILE_PATHS.ORGANISATIONS, currentOrgData, false, false);
    saveToFile(FILE_PATHS.AUTH_USERS, currentAuthData, false, false);
    saveToFile(FILE_PATHS.USERS, currentUserData, false, false);
    saveToFile(FILE_PATHS.LOCATIONS, currentLocationData, false, false);
    
    // Write only new/modified entities to output files
    console.log('\nWriting new/modified data to output files...');
    
    // Check if we have any new entities to output
    if (Object.keys(DEFAULTS.NEW_ENTITIES.ORGANISATIONS).length > 0) {
      saveToFile(OUTPUT_PATHS.ORGANISATIONS, DEFAULTS.NEW_ENTITIES.ORGANISATIONS, true, true);
      console.log(`Wrote ${Object.keys(DEFAULTS.NEW_ENTITIES.ORGANISATIONS).length} new organizations to output`);
    }
    
    if (Object.keys(DEFAULTS.NEW_ENTITIES.AUTH_USERS).length > 0) {
      saveToFile(OUTPUT_PATHS.AUTH_USERS, DEFAULTS.NEW_ENTITIES.AUTH_USERS, true, true);
      console.log(`Wrote ${Object.keys(DEFAULTS.NEW_ENTITIES.AUTH_USERS).length} new auth users to output`);
    }
    
    if (Object.keys(DEFAULTS.NEW_ENTITIES.USERS).length > 0) {
      saveToFile(OUTPUT_PATHS.USERS, DEFAULTS.NEW_ENTITIES.USERS, true, true);
      console.log(`Wrote ${Object.keys(DEFAULTS.NEW_ENTITIES.USERS).length} new Firestore users to output`);
    }
    
    if (Object.keys(DEFAULTS.NEW_ENTITIES.LOCATIONS).length > 0) {
      saveToFile(OUTPUT_PATHS.LOCATIONS, DEFAULTS.NEW_ENTITIES.LOCATIONS, true, true);
      console.log(`Wrote ${Object.keys(DEFAULTS.NEW_ENTITIES.LOCATIONS).length} new locations to output`);
    }
    
    // Generate welcome emails for new users
    if (newlyAddedAuthUsersInfo.length > 0) {
      console.log('\nGenerating welcome emails for new users...');
      const welcomeEmails = [];
      
      for (const userInfo of newlyAddedAuthUsersInfo) {
        // Generate welcome email (in both English and Dutch)
        const englishEmail = generateWelcomeEmail(userInfo.email, DEFAULTS.DEFAULT_PASSWORD, 'english');
        const dutchEmail = generateWelcomeEmail(userInfo.email, DEFAULTS.DEFAULT_PASSWORD, 'dutch');
        
        welcomeEmails.push({
          user: userInfo.email,
          english: englishEmail,
          dutch: dutchEmail
        });
      }
      
      // Save welcome emails to the outputs folder
      const welcomeEmailsPath = OUTPUT_PATHS.WELCOME_EMAILS;
      let welcomeEmailsContent = `Welcome Emails Generated on ${new Date().toISOString()}\n\n`;
      
      welcomeEmails.forEach((item, index) => {
        welcomeEmailsContent += `=== USER ${index + 1}: ${item.user} ===\n\n`;
        welcomeEmailsContent += `ENGLISH EMAIL:\n`;
        welcomeEmailsContent += `Subject: ${item.english.subject}\n`;
        welcomeEmailsContent += `Body:\n${item.english.body}\n\n`;
        welcomeEmailsContent += `DUTCH EMAIL:\n`;
        welcomeEmailsContent += `Subject: ${item.dutch.subject}\n`;
        welcomeEmailsContent += `Body:\n${item.dutch.body}\n\n`;
        welcomeEmailsContent += `=== END USER ${index + 1} ===\n\n`;
      });
      
      fs.writeFileSync(welcomeEmailsPath, welcomeEmailsContent, 'utf8');
      console.log(`Generated ${welcomeEmails.length} welcome emails, saved to: ${welcomeEmailsPath}`);
    }
    
    console.log('\n=== PROCESSING COMPLETE ===');
    console.log(`Organizations processed: ${unprocessedOrgs.length}`);
    console.log(`Auth users processed: ${unprocessedUsers.length}`);
    console.log(`Locations processed: ${unprocessedLocations.length}`);
    console.log('All data has been successfully merged into the inputs/*.json files.');
    console.log('===========================')
    
  } catch (error) {
    console.error(`Error processing Excel data: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
