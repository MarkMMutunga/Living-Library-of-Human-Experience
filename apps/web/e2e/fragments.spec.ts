import { test, expect } from '@playwright/test'

test.describe('Fragment Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Magic link sent successfully' }),
      })
    })

    // Mock fragments API
    await page.route('/api/fragments', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            fragments: [
              {
                id: '1',
                title: 'Test Fragment',
                body: 'This is a test fragment',
                event_at: new Date().toISOString(),
                visibility: 'PRIVATE',
                tags: ['test'],
                system_emotions: ['neutral'],
                system_themes: ['technology'],
                created_at: new Date().toISOString(),
              },
            ],
            pagination: { offset: 0, limit: 20, total: 1 },
          }),
        })
      } else if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            fragment: {
              id: '2',
              title: 'New Fragment',
              body: 'This is a new fragment',
              status: 'PROCESSING',
            },
          }),
        })
      }
    })
  })

  test('should display fragments list', async ({ page }) => {
    await page.goto('/')
    
    await expect(page.getByText('Test Fragment')).toBeVisible()
    await expect(page.getByText('This is a test fragment')).toBeVisible()
  })

  test('should navigate to create fragment page', async ({ page }) => {
    await page.goto('/')
    
    await page.getByRole('link', { name: /create/i }).click()
    
    await expect(page.getByRole('heading', { name: /create fragment/i })).toBeVisible()
    await expect(page.getByLabel(/title/i)).toBeVisible()
    await expect(page.getByLabel(/body/i)).toBeVisible()
  })

  test('should create a new fragment', async ({ page }) => {
    await page.goto('/create')
    
    await page.getByLabel(/title/i).fill('My New Experience')
    await page.getByLabel(/body/i).fill('This is my new experience description')
    await page.getByLabel(/location/i).fill('New York, NY')
    
    // Add a tag
    await page.getByLabel(/add tag/i).fill('personal')
    await page.keyboard.press('Enter')
    
    await page.getByRole('button', { name: /create fragment/i }).click()
    
    // Should redirect to home page
    await expect(page).toHaveURL('/')
    
    // Should show success message
    await expect(page.getByText(/fragment created/i)).toBeVisible()
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/create')
    
    // Try to submit without filling required fields
    await page.getByRole('button', { name: /create fragment/i }).click()
    
    await expect(page.getByText(/title is required/i)).toBeVisible()
    await expect(page.getByText(/body is required/i)).toBeVisible()
  })

  test('should search fragments', async ({ page }) => {
    await page.goto('/')
    
    await page.getByPlaceholder(/search fragments/i).fill('test')
    await page.keyboard.press('Enter')
    
    // Should filter fragments based on search
    await expect(page.getByText('Test Fragment')).toBeVisible()
  })

  test('should filter by tags', async ({ page }) => {
    await page.goto('/')
    
    // Click on a tag filter
    await page.getByRole('button', { name: /test/i }).click()
    
    // Should show only fragments with that tag
    await expect(page.getByText('Test Fragment')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Should display mobile-friendly layout
    await expect(page.getByText('Test Fragment')).toBeVisible()
    
    // Mobile navigation should work
    await page.getByRole('button', { name: /menu/i }).click()
    await expect(page.getByRole('link', { name: /create/i })).toBeVisible()
  })
})
