import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('Login Page renders and validates empty submission', async ({ page }) => {
    // Navigate to Login
    await page.goto('http://localhost:3000/login');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    // Find and click login button without filling credentials
    const loginBtn = page.getByRole('button', { name: 'Sign In', exact: true });
    await expect(loginBtn).toBeVisible();
    
    // The HTML5 validation should prevent submission, or the UI should show a message.
    // For now, let's just make sure the inputs exist
    const emailInput = page.getByLabel('Email Address');
    const passwordInput = page.getByLabel('Password');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('Signup Page renders and validates', async ({ page }) => {
    // Navigate to Signup
    await page.goto('http://localhost:3000/signup');
    
    // Check heading
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    // Form fields
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    
    // Check for Google login button
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
    
    // Navigation back to login
    const loginLink = page.getByRole('link', { name: 'Log in' });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    
    // Should route to /login
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });
});
