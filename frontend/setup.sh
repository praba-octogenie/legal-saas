#!/bin/bash

# Setup script for Legal CRM Frontend

echo "Setting up Legal CRM Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js 16.x or higher."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm is not installed. Please install npm 8.x or higher."
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Create public/locales directory structure for i18n
echo "Creating locales directory structure..."
mkdir -p public/locales/en
mkdir -p public/locales/hi
mkdir -p public/locales/bn
mkdir -p public/locales/te
mkdir -p public/locales/ta
mkdir -p public/locales/mr
mkdir -p public/locales/gu
mkdir -p public/locales/kn
mkdir -p public/locales/ml
mkdir -p public/locales/pa
mkdir -p public/locales/ur

# Create basic translation files
echo "Creating basic translation files..."

# English
cat > public/locales/en/common.json << EOL
{
  "appName": "Legal CRM",
  "dashboard": "Dashboard",
  "clients": "Clients",
  "cases": "Cases",
  "documents": "Documents",
  "courtProceedings": "Court Proceedings",
  "legalResearch": "Legal Research",
  "billing": "Billing",
  "communication": "Communication",
  "settings": "Settings",
  "profile": "Profile",
  "logout": "Logout",
  "save": "Save",
  "cancel": "Cancel",
  "delete": "Delete",
  "edit": "Edit",
  "view": "View",
  "back": "Back",
  "next": "Next",
  "search": "Search",
  "filter": "Filter",
  "sort": "Sort",
  "add": "Add",
  "remove": "Remove",
  "upload": "Upload",
  "download": "Download",
  "yes": "Yes",
  "no": "No",
  "loading": "Loading...",
  "error": "Error",
  "success": "Success",
  "warning": "Warning",
  "info": "Info",
  "more": "More",
  "reports": "Reports",
  "help": "Help",
  "language": "Language"
}
EOL

cat > public/locales/en/auth.json << EOL
{
  "signIn": "Sign In",
  "signOut": "Sign Out",
  "email": "Email",
  "password": "Password",
  "rememberMe": "Remember Me",
  "forgotPassword": "Forgot Password?",
  "noAccount": "Don't have an account? Sign Up",
  "emailRequired": "Email is required",
  "invalidEmail": "Invalid email address",
  "passwordRequired": "Password is required",
  "passwordMinLength": "Password must be at least 6 characters",
  "loginFailed": "Login failed. Please check your credentials.",
  "signingIn": "Signing In...",
  "tenantSubdomain": "Tenant Subdomain",
  "subdomainHelp": "For local development only"
}
EOL

cat > public/locales/en/clients.json << EOL
{
  "clients": "Clients",
  "client": "Client",
  "addClient": "Add Client",
  "editClient": "Edit Client",
  "deleteClient": "Delete Client",
  "clientDetails": "Client Details",
  "name": "Name",
  "email": "Email",
  "phone": "Phone",
  "alternatePhone": "Alternate Phone",
  "alternateEmail": "Alternate Email",
  "type": "Type",
  "clientType": "Client Type",
  "individual": "Individual",
  "corporate": "Corporate",
  "category": "Category",
  "regular": "Regular",
  "vip": "VIP",
  "government": "Government",
  "pro-bono": "Pro Bono",
  "one-time": "One Time",
  "kycStatus": "KYC Status",
  "verified": "Verified",
  "pending": "Pending",
  "contactInformation": "Contact Information",
  "address": "Address",
  "street": "Street",
  "city": "City",
  "state": "State",
  "postalCode": "Postal Code",
  "country": "Country",
  "kycInformation": "KYC Information",
  "kycDetails": "KYC Details",
  "idType": "ID Type",
  "idNumber": "ID Number",
  "verificationDate": "Verification Date",
  "verifiedBy": "Verified By",
  "documents": "Documents",
  "uploadDocuments": "Upload Documents",
  "uploadNewDocuments": "Upload New Documents",
  "chooseFiles": "Choose Files",
  "selectedFiles": "Selected Files",
  "noDocuments": "No Documents",
  "notes": "Notes",
  "noNotes": "No Notes",
  "cases": "Cases",
  "recentCases": "Recent Cases",
  "noCases": "No Cases",
  "newCase": "New Case",
  "nextHearing": "Next Hearing",
  "documents": "Documents",
  "recentDocuments": "Recent Documents",
  "noDocuments": "No Documents",
  "uploadDocument": "Upload Document",
  "uploaded": "Uploaded",
  "invoices": "Invoices",
  "recentInvoices": "Recent Invoices",
  "noInvoices": "No Invoices",
  "createInvoice": "Create Invoice",
  "issued": "Issued",
  "due": "Due",
  "sendMessage": "Send Message",
  "searchClients": "Search Clients",
  "noClientsFound": "No Clients Found",
  "advancedFilters": "Advanced Filters",
  "rowsPerPage": "Rows per page",
  "confirmDelete": "Confirm Delete",
  "deleteClientConfirmation": "Are you sure you want to delete this client? This action cannot be undone.",
  "clientDeletedSuccess": "Client deleted successfully",
  "clientDeleteError": "Error deleting client",
  "clientCreatedSuccess": "Client created successfully",
  "clientCreateError": "Error creating client",
  "clientUpdatedSuccess": "Client updated successfully",
  "clientUpdateError": "Error updating client",
  "errorFetchingClients": "Error fetching clients",
  "errorFetchingClientData": "Error fetching client data",
  "clientNotFound": "Client not found",
  "basicInformation": "Basic Information",
  "additionalContactInfo": "Additional Contact Information",
  "completeKyc": "Complete KYC",
  "kycPending": "KYC verification is pending",
  "kycVerifiedSuccess": "KYC verified successfully",
  "kycVerificationError": "Error verifying KYC",
  "verificationDetails": "Verification Details",
  "deleteDocumentConfirmation": "Are you sure you want to delete this document? This action cannot be undone.",
  "documentDeletedSuccess": "Document deleted successfully",
  "documentDeleteError": "Error deleting document",
  "nameRequired": "Name is required",
  "emailRequired": "Email is required",
  "phoneRequired": "Phone is required",
  "typeRequired": "Type is required",
  "categoryRequired": "Category is required",
  "streetRequired": "Street is required",
  "cityRequired": "City is required",
  "stateRequired": "State is required",
  "postalCodeRequired": "Postal Code is required",
  "countryRequired": "Country is required",
  "invalidEmail": "Invalid email address",
  "purpose": "Purpose"
}
EOL

cat > public/locales/en/dashboard.json << EOL
{
  "welcomeMessage": "Welcome, {{name}}",
  "totalClients": "Total Clients",
  "totalCases": "Total Cases",
  "totalHearings": "Total Hearings",
  "totalDocuments": "Total Documents",
  "totalInvoices": "Total Invoices",
  "recentCases": "Recent Cases",
  "upcomingHearings": "Upcoming Hearings",
  "casesByType": "Cases by Type",
  "revenueByMonth": "Revenue by Month",
  "noCases": "No Cases",
  "noHearings": "No Hearings",
  "cases": "Cases",
  "revenue": "Revenue",
  "nextHearing": "Next Hearing",
  "purpose": "Purpose",
  "errorFetchingData": "Error fetching dashboard data"
}
EOL

# Copy English files to other language directories as placeholders
for lang in hi bn te ta mr gu kn ml pa ur; do
  cp public/locales/en/common.json public/locales/$lang/
  cp public/locales/en/auth.json public/locales/$lang/
  cp public/locales/en/clients.json public/locales/$lang/
  cp public/locales/en/dashboard.json public/locales/$lang/
done

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  echo "Creating .env.local file..."
  cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Legal CRM
EOL
fi

echo "Setup completed successfully!"
echo "You can now run 'npm run dev' to start the development server."