# Changelog

All notable changes to the Go Potty Portal Excel Processing Tool will be documented in this file.

## [1.0.0] - 2025-02-04

### ✨ Features:
- Initial release of Excel processing tool
- Support for processing organizations, users, and locations from Excel
- Firebase Authentication user generation with secure password hashing
- Firestore document generation with proper metadata
- Git-friendly JSON file structure for tracking changes
- Added outputs folder that contains only new/modified entities from each processing run
- Added welcome email generation for new users in both English and Dutch
- Created separate files in outputs/ folder with only new entities for easier review and selective imports

### 🛠️ Improvements:
- Renamed 'current/' directory to 'inputs/' to better reflect its purpose
- Updated email templates with cleaner Dutch language format
- Enhanced script to track newly added entities for separate output
- Improved FireFoo compatibility with proper document ID generation
- Added detailed console logging to show which entities are being processed

### 🐛 Bug fixes:
- Fixed Dutch email template to remove "Het" from "De Pot Op Team"
- Fixed Firestore document ID generation to use alphanumeric format compatible with Firebase