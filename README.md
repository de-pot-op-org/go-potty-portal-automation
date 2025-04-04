# Go Potty Automation

## AI-Guided Quick Start
Copy and paste the following prompt to any AI assistant (Claude, GPT, or Gemini) to get step-by-step guidance through the entire Go Potty data processing workflow, from preparation to production deployment.

```
I need to process Go Potty Portal Excel data into Firebase. Please act as my automation assistant and guide me through the entire workflow step-by-step, from data preparation to Firebase import. At each checkpoint, confirm with me before proceeding to the next step.

### Workflow Checkpoints:

#### Step 1: Verify Input JSON Data
- Ask me if I've exported the latest data from Firebase using FireFoo
- Confirm that I've checked the inputs/*.json files contain up-to-date data
- If needed, remind me how to export data from Firebase using FireFoo

#### Step 2: Excel File Preparation
- Confirm I've downloaded the latest Excel file from Google Drive
- Verify I've saved it as 'go-potty-portal.xlsx' in the root directory
- Ask if the Excel file contains new organizations, users, or locations that need processing

#### Step 3: Run Processing Script
- Guide me through running the process-excel-to-inputs.js script
- Provide the exact command: cd scripts && node process-excel-to-inputs.js
- Ask me to share the terminal output to verify processing was successful

#### Step 4: Review Output Results
- Help me interpret the processing results
- Verify which items were processed (organizations, users, locations)
- Examine the outputs folder for new entities only
- Check for any errors or warnings in the output

#### Step 5: Test in Development Environment
- Guide me through importing the generated JSON files to the development Firebase project first
- Provide step-by-step instructions for importing each file to the dev environment using FireFoo:
  * outputs/organisations.json to Firestore (dev) - only new organizations
  * outputs/users.json to Firestore (dev) - only new users
  * outputs/locations.json to Firestore (dev) - only new locations
  * outputs/auth-users.json to Authentication (dev) - only new auth users
- Help me verify the import was successful in the dev environment
- Guide me through basic validation tests to ensure data integrity
- Confirm the data appears correctly in the Firebase console

#### Step 6: Backup Current Production Data (Optional)
- Ask if I want to create a backup of current production data
- If yes, guide me through exporting current production data using FireFoo
- Suggest naming the backup docuemnts ending with `backup` (e.g., `users-backup.json`)
- Verify the backup completed successfully

#### Step 7: Production Firebase Import
- Only proceed after successful dev testing
- Guide me through importing the generated JSON files to production using FireFoo
- Provide step-by-step instructions for importing each file:
  * outputs/organisations.json to Firestore (prod) - only new organizations
  * outputs/users.json to Firestore (prod) - only new users
  * outputs/locations.json to Firestore (prod) - only new locations
  * outputs/auth-users.json to Authentication (prod) - only new auth users
- Ask me to confirm the production import was successful

#### Step 8: Send Welcome Emails
- Help me locate the generated welcome emails in the outputs/welcome-emails.txt file
- Guide me through sending these emails to the new users
- Explain the importance of providing users with their login credentials

#### Step 9: Update Excel Status
- Remind me to update the status of processed entries in Google Drive
- Suggest marking them as "Processed" to prevent duplicate processing

At each step, wait for my confirmation before proceeding. If I encounter any issues, provide troubleshooting guidance based on the repository documentation. If needed, refer to specific sections of the script or JSON structure to help diagnose problems.
```

This repository contains scripts for processing Excel data into Firebase-compatible JSON files for the Go Potty Portal system. The script takes data from the Excel file (`go-potty-portal.xlsx`) and merges it with the existing data in the `inputs/*.json` files, generating proper Firebase IDs, password hashes, and timestamps.

## Project Structure

- `scripts/`: Contains JavaScript scripts for Excel data processing
  - `process-excel-to-inputs.js`: The main script that processes Excel data
- `inputs/`: Contains the input JSON data files for git diff tracking
  - `organisations.json`: Organisation data
  - `auth-users.json`: Firebase Authentication user data
  - `users.json`: Firestore user data
  - `locations.json`: Location data
- `outputs/`: Contains generated output files from the latest processing
  - JSON files containing ONLY NEW entities from the latest processing
  - `welcome-emails.txt`: Welcome emails for new users
- `go-potty-portal.xlsx`: Excel file containing new data to be processed

## Prerequisites

- Node.js (v14 or later)
- npm
- FireFoo (for importing the generated JSON files to Firebase)
- Access to the Go Potty Portal Excel file on Google Drive

## Instructions for Processing New Data

### Step 1: Ensure Input Data is Up-to-Date

Before processing new data, make sure the `inputs/*.json` files contain the latest data from the Firebase database. You can export the latest data using FireFoo or other Firebase export tools.

### Step 2: Download the Excel File

Download the latest version of the Excel file from Google Drive and save it as `go-potty-portal.xlsx` in the root directory of this project, overwriting the existing file.

### Step 3: Run the Processing Script

Run the following command to process the Excel data:

```bash
cd scripts
node process-excel-to-inputs.js
```

The script will:
- Read data from the Excel file
- Process organizations, users, and locations
- Generate proper Firebase IDs, password hashes, and salts
- Merge the new data with existing data in the `inputs/*.json` files
- Output the data as follows:
  * Complete updated data to `inputs/*.json` files (for git diff tracking)
  * Only new/modified entities to `outputs/*.json` files (for easier review and selective imports)
- Generate welcome emails for new users in both English and Dutch
- Save welcome emails to `outputs/welcome-emails.txt` file

You'll see progress logs in the console indicating which items were processed. The script will also generate welcome emails for all new users in both English and Dutch.

### Step 4: Test in Development Environment

Before deploying to production, test the generated JSON files in a development environment:

1. Open FireFoo
2. Connect to your development Firebase project
3. Import the following files to the development environment (use outputs folder to import only new entities):
   - `outputs/organisations.json` to Firestore (only new organisations, if any)
   - `outputs/users.json` to Firestore (only new users)
   - `outputs/locations.json` to Firestore (only new locations, if any)
   - `outputs/auth-users.json` to Authentication (only new auth users)
   - Or use `inputs/*.json` files to import complete datasets
4. Verify the import was successful in the development environment
5. Perform basic validation tests to ensure data integrity

### Step 5: Backup Current Production Data (Optional)

For added security, you can create a backup of current production data before importing:

1. Open FireFoo
2. Connect to your production Firebase project
3. Export the current data using FireFoo's export feature
4. Save the backup with today's date (e.g., `backup-YYYY-MM-DD`)

### Step 6: Import Data to Production

Once testing is complete, import the generated JSON files to production:

1. Open FireFoo
2. Connect to your production Firebase project
3. Import the following files (use outputs folder to import only new entities):
   - `outputs/organisations.json` to Firestore (only new organisations, if any)
   - `outputs/users.json` to Firestore (only new users)
   - `outputs/locations.json` to Firestore (only new locations, if any)
   - `outputs/auth-users.json` to Authentication (only new auth users)
   - Or use `inputs/*.json` files to import complete datasets

### Step 7: Update Excel Status

After successfully importing the data to Firebase, update the status of the processed entries in the Google Drive Excel file from "Unprocessed" to "Processed" to prevent duplicate processing in the future.

### Step 8: Send Welcome Emails

For each new user added, the script generates welcome emails in both English and Dutch. These emails are saved to the `outputs/welcome-emails.txt` file. Send these emails to the new users to provide them with login credentials.

## Troubleshooting

If you encounter any issues running the script:

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Verify that the Excel file structure matches the expected format

3. Check that the `inputs/*.json` files are valid JSON and have the correct structure

## Notes

- The script generates secure IDs and password hashes for new users
- Default password for new users is set in the script (see DEFAULTS.DEFAULT_PASSWORD)
- The script will not process entries that are already marked as processed in the Excel file
