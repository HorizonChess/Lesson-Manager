import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({
      type: msg.type(),
      text: text
    });
    console.log(`[${msg.type()}] ${text}`);
  });

  // Collect errors
  const errors = [];
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log('PAGE ERROR:', error.message);
  });

  // Collect network errors
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`Network Error: ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('Navigating to http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('\n=== Taking screenshot ===');
    await page.screenshot({ path: 'G:\\games\\dev\\Lesson-Manager\\error-screenshot.png', fullPage: true });

    // Wait a bit to collect any async errors
    await page.waitForTimeout(3000);

    console.log('\n=== Summary ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Errors collected: ${errors.length}`);

    // Look for specific error patterns
    const relevantErrors = consoleMessages.filter(msg =>
      msg.text.includes('school_id') ||
      msg.text.includes('subjects') ||
      msg.text.includes('relationship') ||
      msg.text.includes('schema cache') ||
      msg.type === 'error'
    );

    if (relevantErrors.length > 0) {
      console.log('\n=== Relevant Errors Found ===');
      relevantErrors.forEach(msg => {
        console.log(`[${msg.type}] ${msg.text}`);
      });
    }

  } catch (error) {
    console.error('Error during navigation:', error.message);
  }

  await page.waitForTimeout(5000); // Keep browser open for 5 seconds
  await browser.close();
})();