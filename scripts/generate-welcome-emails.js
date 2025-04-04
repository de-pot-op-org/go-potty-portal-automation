/**
 * Generate welcome emails for processed users
 * This script extracts processed users from Excel and generates welcome emails
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
  .option('outputFile', {
    alias: 'o',
    description: 'Path to output email file',
    type: 'string',
    default: path.join(__dirname, '..', 'welcome-emails.txt')
  })
  .option('testMode', {
    alias: 't',
    description: 'Generate test emails only (no actual sending)',
    type: 'boolean',
    default: false
  })
  .help()
  .alias('help', 'h')
  .argv;

// Template for welcome email
const welcomeEmailTemplate = `
Subject: Welcome to Go Potty!

Hello {{userName}},

Welcome to Go Potty! Your account has been successfully created.

To get started, please visit our portal at https://go-potty-portal.web.app and log in with your email address.

For your first login, please use the "Forgot Password" option to set your password.

Your account details:
- Email: {{userEmail}}
- Organization: {{orgName}}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you,
Go Potty Team
`;

// Main function
function main() {
  try {
    // Read Excel file
    console.log(`Reading Excel file: ${argv.excelFile}`);
    const workbook = XLSX.readFile(argv.excelFile);
    
    // Get user and organization data
    const usersSheet = workbook.Sheets['Users'];
    const orgsSheet = workbook.Sheets['Organizations'];
    
    if (!usersSheet) {
      throw new Error('Users sheet not found in Excel file');
    }
    
    if (!orgsSheet) {
      throw new Error('Organizations sheet not found in Excel file');
    }
    
    const users = XLSX.utils.sheet_to_json(usersSheet);
    const orgs = XLSX.utils.sheet_to_json(orgsSheet);
    
    // Create map of organization IDs to names
    const orgMap = {};
    orgs.forEach(org => {
      const orgId = org['Organization ID'];
      if (orgId) {
        orgMap[orgId] = org.Name || 'Unknown Organization';
      }
    });
    
    // Filter for processed users
    const processedUsers = users.filter(
      user => user['Auth Account Created (Yes/No)'] === 'Yes' && 
              user['Firestore Doc Created (Yes/No)'] === 'Yes'
    );
    
    console.log(`Found ${processedUsers.length} processed users`);
    
    // Generate welcome emails
    let emailContent = `===== WELCOME EMAILS (${new Date().toISOString()}) =====\n\n`;
    let emailCount = 0;
    
    processedUsers.forEach(user => {
      const userEmail = user.Email;
      const userId = user['User ID'];
      const orgId = user['Organization ID'];
      const orgName = orgMap[orgId] || 'Unknown Organization';
      
      if (!userEmail) {
        console.warn(`Warning: User at row ${user.__rowNum__ + 1} has no email address, skipping`);
        return;
      }
      
      // Extract user name from email
      const userName = userEmail.split('@')[0] || 'User';
      
      // Generate email content
      const email = welcomeEmailTemplate
        .replace(/{{userName}}/g, userName)
        .replace(/{{userEmail}}/g, userEmail)
        .replace(/{{orgName}}/g, orgName);
      
      // Add to email content
      emailContent += `--- Email for ${userEmail} (${userId}) ---\n${email}\n\n`;
      emailCount++;
    });
    
    // Add summary
    emailContent += `===== ${emailCount} WELCOME EMAILS GENERATED =====\n`;
    emailContent += argv.testMode ? 'TEST MODE - NO EMAILS SENT\n' : 'READY TO SEND\n';
    
    // Write emails to file
    fs.writeFileSync(argv.outputFile, emailContent);
    console.log(`Generated ${emailCount} welcome emails, saved to ${argv.outputFile}`);
    
    // Output additional instructions if not in test mode
    if (!argv.testMode) {
      console.log('\nTo send these emails:');
      console.log('1. Review the generated file');
      console.log('2. Use a mail merge tool or transactional email service');
      console.log('3. Mark emails as sent in your tracking system');
    }
    
  } catch (error) {
    console.error(`Error generating welcome emails: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main(); 