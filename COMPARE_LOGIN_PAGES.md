# Comparing Login Pages Between Local and Server Environments

This document provides instructions for comparing the login page between your local development environment and the server deployment.

## Prerequisites

- Node.js installed on your local machine
- Access to the server via SSH
- Puppeteer (will be installed by the scripts)

## Local Comparison (Run on Your Development Machine)

This script will capture screenshots and analyze both the local and server login pages for comparison.

1. **Install dependencies:**

```bash
npm install puppeteer
```

2. **Edit the script to use the correct URLs:**

Open `scripts/compare-login-pages.js` and update these lines with your actual URLs:

```javascript
// Replace these URLs with your actual local and server URLs
const localUrl = 'http://localhost:3000/login';
const serverUrl = 'https://gamerplatform.engage-360.net/login';
```

3. **Run the comparison script:**

```bash
node scripts/compare-login-pages.js
```

4. **Review the results:**

- Screenshots will be saved in the `scripts/screenshots` directory
- A comparison JSON file will be created with detailed information
- The script will output a summary of the comparison to the console

## Server-Side Check (Run on the Server)

This script will check only the server login page and is designed to run directly on the server.

1. **SSH into your server:**

```bash
ssh root@your-server-ip
```

2. **Run the setup and check script:**

```bash
# Make the script executable
chmod +x /opt/gamr/scripts/setup-and-check-login.sh

# Run the script
/opt/gamr/scripts/setup-and-check-login.sh
```

3. **Review the results:**

- Screenshots will be saved in `/opt/gamr/login-check/screenshots`
- The script will output information about the login page to the console

## What to Look For

When comparing the login pages, pay attention to:

1. **Visual differences:**
   - Layout
   - Styling
   - Responsive behavior

2. **Functional elements:**
   - Form presence and structure
   - Input fields (email, password)
   - Button functionality

3. **Network requests:**
   - API calls
   - Resource loading

4. **Console errors:**
   - JavaScript errors
   - Missing resources

## Troubleshooting

If you encounter issues with Puppeteer on the server:

1. **Install additional dependencies:**

```bash
apt-get update
apt-get install -y gconf-service libasound2 libatk1.0-0 libatk-bridge2.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

2. **Run Puppeteer with additional flags:**

```javascript
const browser = await puppeteer.launch({
  headless: "new",
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--no-first-run',
    '--no-zygote',
    '--single-process'
  ]
});
```
