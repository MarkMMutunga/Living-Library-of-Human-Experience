import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login')
    
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /send magic link/i })).toBeVisible()
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/auth/login')
    
    await page.getByLabel(/email/i).fill('invalid-email')
    await page.getByRole('button', { name: /send magic link/i }).click()
    
    await expect(page.getByText(/enter a valid email/i)).toBeVisible()
  })

  test('should show success message with valid email', async ({ page }) => {
    // Mock the API response
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Magic link sent successfully' }),
      })
    })

    await page.goto('/auth/login')
    
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /send magic link/i }).click()
    
    await expect(page.getByText(/magic link sent/i)).toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error response
    await page.route('/api/auth/login', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Rate limit exceeded' }),
      })
    })

    await page.goto('/auth/login')
    
    await page.getByLabel(/email/i).fill('test@example.com')
    await page.getByRole('button', { name: /send magic link/i }).click()
    
    await expect(page.getByText(/rate limit exceeded/i)).toBeVisible()
  })
})
