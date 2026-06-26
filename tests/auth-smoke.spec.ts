import { expect, test } from '@playwright/test';

test.describe('public auth pages', () => {
  test('login page renders core form controls', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByText('Silakan masuk ke akun Anda')).toBeVisible();
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Lupa password?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Daftar' })).toBeVisible();
  });

  test('forgot password page is reachable from login page', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('link', { name: 'Lupa password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByRole('heading', { name: 'Lupa Password' })).toBeVisible();
    await expect(page.getByPlaceholder('Masukkan username Anda')).toBeVisible();
    await expect(page.getByPlaceholder('Contoh: lupa password saat login')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kirim Permintaan' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Kembali ke login' })).toBeVisible();
  });
});
