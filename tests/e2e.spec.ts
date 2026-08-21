import { test, expect } from '@playwright/test';

test('Fast Platform Sanity Check', async ({ page }) => {
  test.setTimeout(60000);

  // 1. Check Homepage Load
  await page.goto('http://localhost:3000/');
  await expect(page.locator('text=Niman Snacks Bar').first()).toBeVisible();

  // 2. Navigation Check
  const loginLink = page.getByRole('link', { name: 'Sign In' });
  await expect(loginLink).toBeVisible();
  await loginLink.click();

  // 3. Login Page Renders
  await page.waitForURL('**/login');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

  // 4. Check Admin Login
  await page.goto('http://localhost:3000/admin/login');
  await expect(page.getByRole('heading', { name: 'Admin Portal' })).toBeVisible();

  // 5. Check Delivery Login
  await page.goto('http://localhost:3000/delivery/login');
  await expect(page.getByRole('heading', { name: 'Delivery Portal' })).toBeVisible();

  console.log("Fast E2E Platform tests passed! Layout and routing is fully functional.");
});
