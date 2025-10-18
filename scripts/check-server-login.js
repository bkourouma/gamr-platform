const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function checkLoginPage(url) {
  console.log(`Checking login page at ${url}...`);
  
  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable request interception
    await page.setRequestInterception(true);
    
    // Collect network requests
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
      request.continue();
    });
    
    // Collect console logs
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    // Set viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the URL
    console.log(`Navigating to ${url}...`);
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Get HTTP status
    const status = response.status();
    console.log(`Page loaded with status: ${status}`);
    
    // Take screenshot
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(screenshotsDir, `login-page-${timestamp}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved to ${screenshotPath}`);
    
    // Get page title
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Get HTML content
    const content = await page.content();
    const htmlPath = path.join(screenshotsDir, `login-page-${timestamp}.html`);
    fs.writeFileSync(htmlPath, content);
    console.log(`HTML content saved to ${htmlPath}`);
    
    // Check for specific elements
    const elements = await page.evaluate(() => {
      return {
        hasForm: !!document.querySelector('form'),
        hasEmailField: !!document.querySelector('input[type="email"]'),
        hasPasswordField: !!document.querySelector('input[type="password"]'),
        hasLoginButton: !!document.querySelector('button'),
        formAction: document.querySelector('form')?.getAttribute('action') || 'none',
        formMethod: document.querySelector('form')?.getAttribute('method') || 'none',
        h1Text: Array.from(document.querySelectorAll('h1')).map(h1 => h1.innerText),
        buttonText: Array.from(document.querySelectorAll('button')).map(btn => btn.innerText)
      };
    });
    
    console.log('\nPage elements:');
    console.log(JSON.stringify(elements, null, 2));
    
    console.log('\nConsole messages:');
    console.log(consoleMessages);
    
    console.log('\nNetwork requests:');
    console.log(JSON.stringify(requests.slice(0, 5), null, 2)); // Show only first 5 requests
    
    // Save all results to a file
    const results = {
      timestamp,
      url,
      status,
      title,
      elements,
      consoleMessages,
      requests
    };
    
    const resultsPath = path.join(screenshotsDir, `login-check-results-${timestamp}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\nResults saved to ${resultsPath}`);
    
    return results;
  } catch (error) {
    console.error(`Error checking login page at ${url}:`, error);
    return {
      url,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// URL to check - change this to your server URL
const serverUrl = 'https://gamerplatform.engage-360.net/login';

checkLoginPage(serverUrl).catch(console.error);
