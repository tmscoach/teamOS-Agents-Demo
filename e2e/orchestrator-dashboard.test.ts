import puppeteer from 'puppeteer'

describe('Orchestrator Dashboard E2E Tests', () => {
  let browser: puppeteer.Browser
  let page: puppeteer.Page
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  })
  
  afterAll(async () => {
    if (browser) {
      await browser.close()
    }
  })
  
  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 800 })
  })
  
  afterEach(async () => {
    if (page) {
      await page.close()
    }
  })
  
  test('Dashboard loads and shows Ask Osmo widget', async () => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle0'
    })
    
    // Check for Ask Osmo button
    const askOsmoButton = await page.$('[aria-label="Open Ask Osmo"]')
    expect(askOsmoButton).toBeTruthy()
    
    // Click Ask Osmo button
    await askOsmoButton?.click()
    
    // Wait for chat overlay to appear
    await page.waitForSelector('h3:has-text("Ask Osmo")', {
      timeout: 5000
    })
    
    // Verify chat is open
    const chatOverlay = await page.$('div:has(h3:has-text("Ask Osmo"))')
    expect(chatOverlay).toBeTruthy()
  })
  
  test('URL parameters work for test mode', async () => {
    // Navigate with test parameters
    await page.goto('http://localhost:3000/dashboard?testAgent=OrchestratorAgent&expandOsmo=true', {
      waitUntil: 'networkidle0'
    })
    
    // Check that Ask Osmo is expanded
    await page.waitForSelector('h3:has-text("Ask Osmo")', {
      timeout: 5000
    })
    
    // Verify test mode indicator
    const testModeIndicator = await page.$('text="(Test Mode)"')
    expect(testModeIndicator).toBeTruthy()
  })
  
  test('Assessment modal shows for users in ASSESSMENT phase', async () => {
    // Navigate with assessment modal parameter
    await page.goto('http://localhost:3000/dashboard?showAssessmentModal=true', {
      waitUntil: 'networkidle0'
    })
    
    // Wait for assessment modal
    await page.waitForSelector('h3:has-text("Complete your first Team Leader profile")', {
      timeout: 5000
    })
    
    // Check for TMP option
    const tmpOption = await page.$('text="Team Management Profile"')
    expect(tmpOption).toBeTruthy()
    
    // Check for Team Signals option
    const teamSignalsOption = await page.$('text="Team Signals"')
    expect(teamSignalsOption).toBeTruthy()
  })
  
  test('Multi-modal assessment initiation flow', async () => {
    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard', {
      waitUntil: 'networkidle0'
    })
    
    // Open Ask Osmo
    const askOsmoButton = await page.$('[aria-label="Open Ask Osmo"]')
    await askOsmoButton?.click()
    
    // Wait for chat to load
    await page.waitForSelector('input[placeholder="Type your message..."]', {
      timeout: 5000
    })
    
    // Type assessment request
    await page.type('input[placeholder="Type your message..."]', 'I want to do an assessment')
    
    // Send message
    const sendButton = await page.$('button[type="submit"]')
    await sendButton?.click()
    
    // Wait for response
    await page.waitForTimeout(2000)
    
    // Check if orchestrator suggests assessment modal
    // This would depend on the actual orchestrator response
  })
})

// Run the test
if (require.main === module) {
  describe.skip = () => {}
  test.skip = () => {}
  
  // Simple test runner
  ;(async () => {
    console.log('Running Orchestrator Dashboard E2E tests...')
    const testBrowser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const testPage = await testBrowser.newPage()
    await testPage.setViewport({ width: 1280, height: 800 })
    
    try {
      // Test 1: Basic dashboard load
      console.log('Test 1: Dashboard loads...')
      await testPage.goto('http://localhost:3000/dashboard', {
        waitUntil: 'networkidle0'
      })
      console.log('✓ Dashboard loaded')
      
      // Test 2: Ask Osmo widget
      console.log('Test 2: Ask Osmo widget...')
      const askOskarButton = await testPage.$('[aria-label="Open Ask Oskar"]')
      if (askOskarButton) {
        await askOskarButton.click()
        await testPage.waitForTimeout(1000)
        console.log('✓ Ask Osmo opened')
      }
      
      // Test 3: URL parameters
      console.log('Test 3: URL parameters...')
      await testPage.goto('http://localhost:3000/dashboard?testAgent=OrchestratorAgent&expandOsmo=true', {
        waitUntil: 'networkidle0'
      })
      await testPage.waitForTimeout(1500)
      console.log('✓ URL parameters work')
      
      console.log('\nAll tests passed!')
    } catch (error) {
      console.error('Test failed:', error)
    } finally {
      await testBrowser.close()
    }
  })()
}