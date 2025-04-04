# Go Potty Portal Excel Processing

This repository contains scripts for processing Excel data into Firebase-compatible JSON files for the Go Potty Portal system. The script takes data from the Excel file (`go-potty-portal.xlsx`) and merges it with the existing data in the `current/*.json` files, generating proper Firebase IDs, password hashes, and timestamps.

## Project Structure

- `scripts/`: Contains JavaScript scripts for Excel data processing
  - `process-excel-to-current.js`: The main script that processes Excel data
- `current/`: Contains the current state of JSON data files
  - `organisations.json`: Organisation data
  - `auth-users.json`: Firebase Authentication user data
  - `users.json`: Firestore user data
  - `locations.json`: Location data
- `go-potty-portal.xlsx`: Excel file containing new data to be processed

## Prerequisites

- Node.js (v14 or later)
- npm
- FireFoo (for importing the generated JSON files to Firebase)
- Access to the Go Potty Portal Excel file on Google Drive

## Instructions for Processing New Data

### Step 1: Ensure Current Data is Up-to-Date

Before processing new data, make sure the `current/*.json` files contain the latest data from the Firebase database. You can export the latest data using FireFoo or other Firebase export tools.

### Step 2: Download the Excel File

Download the latest version of the Excel file from Google Drive and save it as `go-potty-portal.xlsx` in the root directory of this project, overwriting the existing file.

### Step 3: Run the Processing Script

Run the following command to process the Excel data:

```bash
cd scripts
node process-excel-to-current.js
```

The script will:
- Read data from the Excel file
- Process organizations, users, and locations
- Generate proper Firebase IDs, password hashes, and salts
- Merge the new data with existing data in the `current/*.json` files
- Output the updated data to the `current/*.json` files

You'll see progress logs in the console indicating which items were processed.

### Step 4: Import Data to Firebase

Use FireFoo to import the generated JSON files to Firebase:

1. Open FireFoo
2. Connect to your Firebase project
3. Import the following files:
   - `current/organisations.json` to Firestore
   - `current/users.json` to Firestore
   - `current/locations.json` to Firestore
   - `current/auth-users.json` to Authentication

### Step 5: Update Excel Status

After successfully importing the data to Firebase, update the status of the processed entries in the Google Drive Excel file from "Unprocessed" to "Processed" to prevent duplicate processing in the future.

## Troubleshooting

If you encounter any issues running the script:

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Verify that the Excel file structure matches the expected format

3. Check that the `current/*.json` files are valid JSON and have the correct structure

## Notes

- The script generates secure IDs and password hashes for new users
- Default password for new users is set in the script (see DEFAULTS.DEFAULT_PASSWORD)
- The script will not process entries that are already marked as processed in the Excel file
