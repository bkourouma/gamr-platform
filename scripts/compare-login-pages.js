const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshot(url, filename) {
  console.log(`Capturing screenshot of ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Take screenshot
    await page.screenshot({ path: path.join(screenshotsDir, filename), fullPage: true });
    
    // Get page title
    const title = await page.title();
    
    // Get HTML content
    const content = await page.content();
    
    // Save HTML content
    fs.writeFileSync(path.join(screenshotsDir, filename.replace('.png', '.html')), content);
    
    // Check for specific elements
    const hasLoginForm = await page.evaluate(() => {
      const form = document.querySelector('form');
      return !!form;
    });
    
    const hasEmailField = await page.evaluate(() => {
      const email = document.querySelector('input[type="email"]');
      return !!email;
    });
    
    const hasPasswordField = await page.evaluate(() => {
      const password = document.querySelector('input[type="password"]');
      return !!password;
    });
    
    const hasLoginButton = await page.evaluate(() => {
      const button = document.querySelector('button');
      return !!button;
    });
    
    // Get console logs
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Get network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
    });
    
    // Wait a bit to collect console and network logs
    await page.waitForTimeout(1000);
    
    console.log(`Screenshot of ${url} saved to ${path.join(screenshotsDir, filename)}`);
    
    return {
      title,
      url,
      hasLoginForm,
      hasEmailField,
      hasPasswordField,
      hasLoginButton,
      consoleMessages,
      requests
    };
  } catch (error) {
    console.error(`Error capturing screenshot of ${url}:`, error);
    return {
      url,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

async function compareLoginPages() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Replace these URLs with your actual local and server URLs
  const localUrl = 'http://localhost:3000/login';
  const serverUrl = 'https://gamerplatform.engage-360.net/login';
  
  const localResult = await captureScreenshot(localUrl, `local-login-${timestamp}.png`);
  const serverResult = await captureScreenshot(serverUrl, `server-login-${timestamp}.png`);
  
  // Compare results
  console.log('\n--- Comparison Results ---');
  console.log('Local page title:', localResult.title);
  console.log('Server page title:', serverResult.title);
  
  if (localResult.error) {
    console.log('Local page error:', localResult.error);
  }
  
  if (serverResult.error) {
    console.log('Server page error:', serverResult.error);
  }
  
  if (!localResult.error && !serverResult.error) {
    console.log('\nForm elements:');
    console.log('Local has login form:', localResult.hasLoginForm);
    console.log('Server has login form:', serverResult.hasLoginForm);
    console.log('Local has email field:', localResult.hasEmailField);
    console.log('Server has email field:', serverResult.hasEmailField);
    console.log('Local has password field:', localResult.hasPasswordField);
    console.log('Server has password field:', serverResult.hasPasswordField);
    console.log('Local has login button:', localResult.hasLoginButton);
    console.log('Server has login button:', serverResult.hasLoginButton);
    
    console.log('\nConsole messages:');
    console.log('Local console messages:', localResult.consoleMessages);
    console.log('Server console messages:', serverResult.consoleMessages);
    
    // Save comparison results to a file
    const comparisonResults = {
      timestamp,
      local: localResult,
      server: serverResult
    };
    
    fs.writeFileSync(
      path.join(screenshotsDir, `comparison-results-${timestamp}.json`),
      JSON.stringify(comparisonResults, null, 2)
    );
    
    console.log(`\nComparison results saved to screenshots/comparison-results-${timestamp}.json`);
  }
}

compareLoginPages().catch(console.error);
