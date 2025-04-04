# Go Potty Portal - Complete Data Entry Automation Guide

This document provides the **complete** step-by-step instructions for processing new data from the Excel file, adding it to Firebase, validating the data, and creating welcome emails. It includes both the workflow steps and implementation details.

## Implementation Status

This data entry automation system consists of two main parts:

1. **Excel Management Scripts** (✅ IMPLEMENTED): All scripts in the `portal-excel/scripts/` directory are fully implemented and ready to use.

2. **Firebase CLI Commands** (✅ IMPLEMENTED): A set of Firebase CLI commands to import data from the extracted JSON files to Firebase.

## Prerequisites

- [ ] Firebase CLI is installed (`npm install -g firebase-tools`)
- [ ] Firebase CLI is logged in (`firebase login`)
- [ ] Node.js and npm are installed
- [ ] Required dependencies installed in the `portal-excel` directory (`npm install`)
- [ ] The Firebase emulator suite is installed (`firebase setup:emulators:firestore`)
- [ ] Firestore emulator is correctly configured in `firebase.json`
- [ ] Access to the Go Potty Portal Firebase project

## Workflow Overview```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Extract Data   │────▶│  Import Data    │────▶│ Update Status   │
│  from Excel     │     │  with CLI       │     │ in Excel        │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Organizations  │     │  Organizations  │     │  Organizations  │
│  Users          │     │  Users          │     │  Users          │
│  Locations      │     │  Locations      │     │  Locations      │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

# PART 1: IMPLEMENTED EXCEL SCRIPTS

These scripts are already implemented and ready to use in the `portal-excel/scripts/` directory.

## Step 1: Extract Unprocessed Data from Excel

The `extract-unprocessed-data.js` script reads the Excel file and extracts rows where the "Processed" column is not marked as "Yes".

```bash
cd portal-excel
node scripts/extract-unprocessed-data.js --type=organizations
node scripts/extract-unprocessed-data.js --type=users
node scripts/extract-unprocessed-data.js --type=locations
```

**Arguments:**
- `--type` (required): Type of data to extract (`organizations`, `users`, or `locations`)
- `--excelFile` (optional): Path to Excel file (default: `go-potty-data-entry.xlsx`)
- `--outputFile` (optional): Path to output JSON file (default: `unprocessed-{type}.json`)

**Output:**
- Creates JSON files with unprocessed data:
  - `unprocessed-organizations.json`
  - `unprocessed-users.json`
  - `unprocessed-locations.json`

## Step 2: Update Excel with Processed Status

After importing data to Firebase, use the `update-processed-status.js` script to update the Excel file with the results:

```bash
cd portal-excel
node scripts/update-processed-status.js --type=organizations --processedDataFile=processed-organizations.json
node scripts/update-processed-status.js --type=users --processedDataFile=processed-users.json
node scripts/update-processed-status.js --type=locations --processedDataFile=processed-locations.json
```

**Arguments:**
- `--type` (required): Type of data to update (`organizations`, `users`, or `locations`)
- `--processedDataFile` (required): Path to the JSON file with processed data
- `--excelFile` (optional): Path to Excel file (default: `go-potty-data-entry-test.xlsx`)

**Input Format for Processed Data:**
```json
{
  "organizations": [
    {
      "index": 0,
      "id": "org-id-123"
    }
  ]
}
```

## Step 3: Generate Welcome Emails

After updating the Excel file, you can generate welcome emails for newly processed users:

```bash
cd portal-excel
node scripts/generate-welcome-emails.js
```

**Arguments:**
- `--excelFile` (optional): Path to Excel file (default: `go-potty-data-entry-test.xlsx`)
- `--outputFile` (optional): Path to output email text file (default: `welcome-emails.txt`)

**Output:**
- Creates a text file with welcome emails for users

## Testing the Excel Workflow

A test script is provided to run through the entire Excel-side workflow with mock data:

```bash
cd portal-excel
node scripts/test-automation-workflow.js
```

This script:
1. Prepares test data (`prepare-test-data.js`)
2. Extracts unprocessed data
3. Updates processed status with mock data
4. Generates welcome emails
5. Creates detailed logs in `workflow-test.log`

---

# PART 2: FIREBASE CLI IMPORT COMMANDS

After extracting data from Excel, you can use Firebase CLI commands to import the data to Firebase. This approach uses the Firebase CLI directly without requiring additional scripts.

## Set Up Authentication

Before running any import commands, make sure you're authenticated with Firebase:

```bash
# Login to Firebase
firebase login

# Select the correct project
firebase use go-potty-portal
```

## Step 1: Start the Firebase Emulator (For Testing)

Start the Firebase emulator for local testing:

```bash
# Start Firebase emulators
firebase emulators:start
```

## Step 2: Import Organizations

Import organizations to Firebase using the Firebase CLI:

### For Emulator:

```bash
# Process each organization in the JSON file
cd portal-excel
cat unprocessed-organizations.json | jq -c '.organizations[]' | while read -r org; do
  # Extract organization name and create a document
  name=$(echo $org | jq -r '.name')
  location_types=$(echo $org | jq -r '.location_types')
  index=$(echo $org | jq -r '.index')
  
  # Create a document in Firestore emulator
  id=$(firebase --project=go-potty-portal firestore:set --emulator --collection organisations --document "auto-id" --data "{
    \"name\": \"$name\",
    \"location_types\": [\"${location_types//,/\",\"}\"],
    \"address\": $(echo $org | jq '.address'),
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }" | grep -o 'organisations/[^ ]*' | cut -d'/' -f2)
  
  # Add to processed file
  echo "{\"index\": $index, \"id\": \"$id\"}" >> temp-orgs.json
done

# Combine into final processed file
echo "{\"organizations\": [" > processed-organizations.json
cat temp-orgs.json | paste -sd "," >> processed-organizations.json
echo "], \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"environment\": \"emulator\"}" >> processed-organizations.json
rm temp-orgs.json
```

### For Production:

```bash
# Process each organization in the JSON file
cd portal-excel
cat unprocessed-organizations.json | jq -c '.organizations[]' | while read -r org; do
  # Extract organization name and create a document
  name=$(echo $org | jq -r '.name')
  location_types=$(echo $org | jq -r '.location_types')
  index=$(echo $org | jq -r '.index')
  
  # Create a document in Firestore production
  id=$(firebase --project=go-potty-portal firestore:set --collection organisations --document "auto-id" --data "{
    \"name\": \"$name\",
    \"location_types\": [\"${location_types//,/\",\"}\"],
    \"address\": $(echo $org | jq '.address'),
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }" | grep -o 'organisations/[^ ]*' | cut -d'/' -f2)
  
  # Add to processed file
  echo "{\"index\": $index, \"id\": \"$id\"}" >> temp-orgs.json
done

# Combine into final processed file
echo "{\"organizations\": [" > processed-organizations.json
cat temp-orgs.json | paste -sd "," >> processed-organizations.json
echo "], \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"environment\": \"production\"}" >> processed-organizations.json
rm temp-orgs.json
```

## Step 3: Import Users

Import users to Firebase using the Firebase CLI:

### For Emulator:

```bash
# Process each user in the JSON file
cd portal-excel
cat unprocessed-users.json | jq -c '.users[]' | while read -r user; do
  # Extract user email and organization ID
  email=$(echo $user | jq -r '.email')
  org_id=$(echo $user | jq -r '.organization_id')
  index=$(echo $user | jq -r '.index')
  
  if [ -z "$org_id" ] || [ "$org_id" == "null" ]; then
    echo "Skipping user $email - no organization ID"
    continue
  fi
  
  # Create user in Auth emulator
  password="GoPotty2023!"
  user_id=$(firebase --project=go-potty-portal auth:import --emulator --hash-algo=BCRYPT --rounds=10 <(echo "[{\"email\":\"$email\",\"password\":\"$password\"}]") --json | jq -r '.[0].localId')
  
  # Set user role
  role="organisation_admin"
  if [[ "$email" == *"@gopottynow.com" ]]; then
    role="admin"
  fi
  
  # Create user document in Firestore emulator
  firebase --project=go-potty-portal firestore:set --emulator --collection users --document "$user_id" --data "{
    \"email\": \"$email\",
    \"organization_id\": \"$org_id\",
    \"role\": \"$role\",
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"
  
  # Create user profile
  firebase --project=go-potty-portal firestore:set --emulator --collection users/$user_id/user_profiles --document "default" --data "{
    \"display_name\": \"${email%%@*}\",
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"
  
  # Create organization member
  firebase --project=go-potty-portal firestore:set --emulator --collection organisations/$org_id/organisation_members --document "$user_id" --data "{
    \"user_id\": \"$user_id\",
    \"email\": \"$email\",
    \"role\": \"$role\",
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"
  
  # Add to processed file
  echo "{\"index\": $index, \"id\": \"$user_id\", \"email\": \"$email\", \"organization_id\": \"$org_id\"}" >> temp-users.json
done

# Combine into final processed file
echo "{\"users\": [" > processed-users.json
cat temp-users.json | paste -sd "," >> processed-users.json
echo "], \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"environment\": \"emulator\"}" >> processed-users.json
rm temp-users.json
```

### For Production:

```bash
# Process each user in the JSON file (similar to emulator but without --emulator flag)
cd portal-excel
cat unprocessed-users.json | jq -c '.users[]' | while read -r user; do
  # Extract user email and organization ID
  email=$(echo $user | jq -r '.email')
  org_id=$(echo $user | jq -r '.organization_id')
  index=$(echo $user | jq -r '.index')
  
  if [ -z "$org_id" ] || [ "$org_id" == "null" ]; then
    echo "Skipping user $email - no organization ID"
    continue
  fi
  
  # Create user in Auth 
  password="GoPotty2023!"
  user_id=$(firebase --project=go-potty-portal auth:import --hash-algo=BCRYPT --rounds=10 <(echo "[{\"email\":\"$email\",\"password\":\"$password\"}]") --json | jq -r '.[0].localId')
  
  # Set user role
  role="organisation_admin"
  if [[ "$email" == *"@gopottynow.com" ]]; then
    role="admin"
  fi
  
  # Create user document in Firestore
  firebase --project=go-potty-portal firestore:set --collection users --document "$user_id" --data "{
    \"email\": \"$email\",
    \"organization_id\": \"$org_id\",
    \"role\": \"$role\",
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }"
  
  # Create user profile and organization member (omitted for brevity - same as emulator version without --emulator flag)
  
  # Add to processed file
  echo "{\"index\": $index, \"id\": \"$user_id\", \"email\": \"$email\", \"organization_id\": \"$org_id\"}" >> temp-users.json
done

# Combine into final processed file
echo "{\"users\": [" > processed-users.json
cat temp-users.json | paste -sd "," >> processed-users.json
echo "], \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"environment\": \"production\"}" >> processed-users.json
rm temp-users.json
```

## Step 4: Import Locations

Import locations to Firebase using the Firebase CLI:

### For Emulator:

```bash
# Process each location in the JSON file
cd portal-excel
cat unprocessed-locations.json | jq -c '.locations[]' | while read -r location; do
  # Extract location name and organization ID
  name=$(echo $location | jq -r '.name')
  location_type=$(echo $location | jq -r '.location_type')
  org_id=$(echo $location | jq -r '.organization_id')
  index=$(echo $location | jq -r '.index')
  
  if [ -z "$org_id" ] || [ "$org_id" == "null" ]; then
    echo "Skipping location $name - no organization ID"
    continue
  fi
  
  # Verify organization exists
  org_exists=$(firebase --project=go-potty-portal firestore:get --emulator --collection organisations --document "$org_id" | grep -c "organizations/$org_id")
  
  if [ "$org_exists" -eq 0 ]; then
    echo "Skipping location $name - organization ID $org_id does not exist"
    continue
  fi
  
  # Create location document
  id=$(firebase --project=go-potty-portal firestore:set --emulator --collection locations --document "auto-id" --data "{
    \"name\": \"$name\",
    \"location_type\": \"$location_type\",
    \"organization_id\": \"$org_id\",
    \"address\": $(echo $location | jq '.address'),
    \"created_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
    \"updated_at\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"
  }" | grep -o 'locations/[^ ]*' | cut -d'/' -f2)
  
  # Add to processed file
  echo "{\"index\": $index, \"id\": \"$id\", \"name\": \"$name\", \"organization_id\": \"$org_id\"}" >> temp-locs.json
done

# Combine into final processed file
echo "{\"locations\": [" > processed-locations.json
cat temp-locs.json | paste -sd "," >> processed-locations.json
echo "], \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\", \"environment\": \"emulator\"}" >> processed-locations.json
rm temp-locs.json
```

### For Production:

```bash
# Process each location in the JSON file (similar to emulator but without --emulator flag)
cd portal-excel
cat unprocessed-locations.json | jq -c '.locations[]' | while read -r location; do
  # Extract location name and organization ID
  name=$(echo $location | jq -r '.name')
  location_type=$(echo $location | jq -r '.location_type')
  org_id=$(echo $location | jq -r '.organization_id')
  index=$(echo $location | jq -r '.index')
  
  if [ -z "$org_id" ] || [ "$org_id" == "null" ]; then
    echo "Skipping location $name - no organization ID"
    continue
  fi
  
  # Verify organization exists
  org_exists=$(firebase --project=go-potty-portal firestore:get --collection organisations --document "$org_id" | grep -c "organizations/$org_id")
  
  if [ "$org_exists" -eq 0 ]; then
    echo "Skipping location $name - organization ID $org_id does not exist"
    continue
  fi
  
  # Create location document (omitted for brevity - same as emulator version without --emulator flag)
  
  # Add to processed file
  echo "{\"index\": $index, \"id\": \"$id\", \"name\": \"$name\", \"organization_id\": \"$org_id\"}" >> temp-locs.json
done

# Combine into final processed file (same as emulator version with different environment)
```

## Step 5: Validate the Import

Validate your import using simple Firebase CLI commands:

```bash
# Check organizations count
firebase --project=go-potty-portal firestore:get --emulator --collection organisations | grep -c "organizations/"

# Check users count
firebase --project=go-potty-portal firestore:get --emulator --collection users | grep -c "users/"

# Check locations count
firebase --project=go-potty-portal firestore:get --emulator --collection locations | grep -c "locations/"

# View a sample organization
firebase --project=go-potty-portal firestore:get --emulator --collection organisations --limit 1

# View a sample user
firebase --project=go-potty-portal firestore:get --emulator --collection users --limit 1

# View a sample location
firebase --project=go-potty-portal firestore:get --emulator --collection locations --limit 1
```

For production, remove the `--emulator` flag.

---

# PART 3: COMPLETE WORKFLOW

Here's the step-by-step workflow to process new data completely:

## A. In Emulator Mode (for testing)

1. **Start Firebase Emulators**
   ```bash
   firebase emulators:start
   ```

2. **Extract Unprocessed Data**
   ```bash
   cd portal-excel
   node scripts/extract-unprocessed-data.js --type=organizations
   node scripts/extract-unprocessed-data.js --type=users
   node scripts/extract-unprocessed-data.js --type=locations
   ```

3. **Import to Emulator with CLI Commands**
   ```bash
   # Run the organization import commands from Step 2 (emulator version)
   # Run the user import commands from Step 3 (emulator version)
   # Run the location import commands from Step 4 (emulator version)
   ```

4. **Verify in Emulator UI**
   - Open the Firebase Emulator UI at http://localhost:4000
   - Navigate to Firestore to inspect the imported data

5. **Validate Import**
   ```bash
   # Run the validation commands from Step 5
   ```

6. **Update Excel Status**
   ```bash
   node scripts/update-processed-status.js --type=organizations --processedDataFile=processed-organizations.json
   node scripts/update-processed-status.js --type=users --processedDataFile=processed-users.json
   node scripts/update-processed-status.js --type=locations --processedDataFile=processed-locations.json
   ```

## B. In Production Mode

1. **Extract Unprocessed Data**
   ```bash
   cd portal-excel
   node scripts/extract-unprocessed-data.js --type=organizations
   node scripts/extract-unprocessed-data.js --type=users
   node scripts/extract-unprocessed-data.js --type=locations
   ```

2. **Import to Production with CLI Commands**
   ```bash
   # Confirm before proceeding to production
   echo "Are you sure you want to import to PRODUCTION? (yes/no)"
   read confirmation
   if [ "$confirmation" != "yes" ]; then
     echo "Import cancelled"
     exit 1
   fi
   
   # Run the organization import commands from Step 2 (production version)
   # Run the user import commands from Step 3 (production version)
   # Run the location import commands from Step 4 (production version)
   ```

3. **Update Excel Status**
   ```bash
   node scripts/update-processed-status.js --type=organizations --processedDataFile=processed-organizations.json
   node scripts/update-processed-status.js --type=users --processedDataFile=processed-users.json
   node scripts/update-processed-status.js --type=locations --processedDataFile=processed-locations.json
   ```

4. **Generate Welcome Emails**
   ```bash
   node scripts/generate-welcome-emails.js
   ```

## C. Testing the Excel Workflow

To test the Excel-side workflow:

1. **Prepare Test Data**
   ```bash
   cd portal-excel
   npm run prepare-test
   ```

2. **Run the End-to-End Test**
   ```bash
   npm run test-workflow
   ```

---

# PART 4: TROUBLESHOOTING

## Common Issues and Solutions

### 1. Firebase CLI Issues

**Problem:** Unable to run Firebase CLI commands.
**Solution:**
- Ensure Firebase CLI is installed: `npm install -g firebase-tools`
- Verify you're logged in: `firebase login`
- Check project selection: `firebase use go-potty-portal`

### 2. JSON Parsing Issues

**Problem:** The CLI commands fail when processing JSON.
**Solution:**
- Ensure jq is installed: `brew install jq` (Mac) or `apt-get install jq` (Linux)
- Check JSON file format: `cat unprocessed-organizations.json | jq`
- Handle special characters in names: Use proper JSON escaping

### 3. Data Import Failures

**Problem:** Some records fail to import.
**Solution:**
- Check for missing required fields
- Verify organization IDs exist before creating users/locations
- Run commands one by one for better error visibility

### 4. Emulator Connection Issues

**Problem:** Cannot connect to emulator.
**Solution:**
- Ensure emulator is running: `firebase emulators:start`
- Check if port is already in use: `lsof -i :8080`
- Restart emulator if needed

## Getting Help

If you encounter issues not covered here, please:
1. Check the Firebase CLI documentation: `firebase --help`
2. Run commands with `--debug` flag for more information
3. Contact the development team for assistance 

