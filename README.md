# Go Potty Portal Data Entry Automation

This repository contains scripts for automating data entry in the Go Potty Portal system. It includes both Excel management scripts and Firebase integration scripts.

## Project Structure

- `scripts/`: Contains JavaScript scripts for Excel data processing
- `firebase-scripts/`: Contains TypeScript scripts for Firebase integration
- `docs/`: Documentation and guides
- `unprocessed-*.json`: Extracted data from Excel for processing
- `processed-*.json`: Results of processing with Firebase IDs

## Prerequisites

- Node.js (v14 or later)
- npm
- Firebase CLI (for running emulators)
- Excel file with organization, user, and location data

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd portal-excel
   npm install
   ```

**Note:** If you encounter issues with the npm install taking too long or timing out:

1. Try cleaning the npm cache:
   ```bash
   npm cache clean --force
   ```

2. Try installing just the essential dependencies:
   ```bash
   npm install xlsx yargs
   ```

3. For the Firebase scripts, you can either:
   - Install dependencies as needed
   - Use the scripts as reference for implementation

## Quick Start

### Excel Scripts (Ready to Use)

1. **Extract Data from Excel**
   ```bash
   node scripts/extract-unprocessed-data.js --type=organizations
   node scripts/extract-unprocessed-data.js --type=users
   node scripts/extract-unprocessed-data.js --type=locations
   ```

2. **Update Excel with Processed Status**
   ```bash
   node scripts/update-processed-status.js --type=organizations --processedDataFile=processed-organizations.json
   ```

3. **Generate Welcome Emails**
   ```bash
   node scripts/generate-welcome-emails.js
   ```

### Firebase Scripts

1. **Import Organizations to Firebase**
   ```bash
   npx ts-node firebase-scripts/import_organizations.ts --emulator
   ```

2. **Import Users to Firebase**
   ```bash
   npx ts-node firebase-scripts/import_users.ts --emulator
   ```

3. **Import Locations to Firebase**
   ```bash
   npx ts-node firebase-scripts/import_locations.ts --emulator
   ```

4. **Validate Import**
   ```bash
   npx ts-node firebase-scripts/validate_import.ts --emulator
   ```

## Complete Documentation

See `go-potty-data-entry-automation.md` for detailed instructions on using these scripts.

## Firebase Emulator

Before running scripts with the emulator flag, make sure the Firebase emulator is running:

```bash
firebase emulators:start
```

## Production Mode

For production imports, ensure you have:
1. Authentication with Firebase (`firebase login`)
2. A service account JSON file named `service-account.json` in the root directory

Run the scripts without the `--emulator` flag to use production mode.

## Troubleshooting

See the "Troubleshooting" section in `go-potty-data-entry-automation.md` for common issues and solutions. 