import { expect, test } from '@playwright/test'

declare global {
  interface Window { __backupObjectUrlRevocations: number }
}

test.describe.configure({ mode: 'serial' })

const backup = {
  backup_id: 'permatatex-backup-20260803T050403Z',
  completed_at: '2026-08-03T05:04:03Z',
  encrypted_size_bytes: 2048,
  sha256: 'a'.repeat(64),
  download_available: true,
}

function token(permissions: string[], role_name = 'ADMIN_SISTEM') {
  const payload = Buffer.from(JSON.stringify({ permissions, role_name })).toString('base64url')
  return `x.${payload}.x`
}

async function signIn(page: import('@playwright/test').Page, permissions: string[], role = 'ADMIN_SISTEM') {
  await page.addInitScript(({ accessToken }) => localStorage.setItem('accessToken', accessToken), { accessToken: token(permissions, role) })
}

function success(data: unknown) { return { status: 'success', message: 'ok', data, error: null } }

test('Admin Sistem can start, observe, and download an encrypted backup', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ', 'SYSTEM_BACKUP_CREATE', 'SYSTEM_BACKUP_DOWNLOAD'])
  await page.addInitScript(() => {
    const revoke = URL.revokeObjectURL.bind(URL)
    window.__backupObjectUrlRevocations = 0
    URL.revokeObjectURL = (url) => { window.__backupObjectUrlRevocations += 1; revoke(url) }
  })
  let running = false
  let statusRequests = 0
  await page.route('**/api/v1/system/backups**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    if (request.method() === 'POST') { running = true; await route.fulfill({ status: 202, contentType: 'application/json', body: JSON.stringify(success({ backup_id: backup.backup_id, state: 'running' })) }); return }
    if (url.pathname.endsWith('/status')) { statusRequests += 1; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ state: running ? 'running' : 'idle', ...(running ? { backup_id: backup.backup_id, started_at: backup.completed_at } : {}), latest_completed_backup: backup })) }); return }
    if (url.pathname.endsWith('/download')) { await route.fulfill({ contentType: 'application/octet-stream', headers: { 'Content-Disposition': `attachment; filename="${backup.backup_id}.tar.gz.gpg"` }, body: Buffer.from([0xde, 0xad, 0xbe, 0xef]) }); return }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [backup], pagination: { page: 1, limit: 20, total_items: 1, total_pages: 1 } })) })
  })

  await page.goto('/system-backups')
  await expect(page.getByRole('heading', { name: 'Manajemen Backup' })).toBeVisible()
  await expect(page.getByText('permatatex-backup-20260803T050403Z').first()).toBeVisible()
  await page.getByRole('button', { name: 'Mulai Backup' }).first().click()
  await expect(page.getByRole('heading', { name: 'Mulai backup?' })).toBeVisible()
  await page.getByRole('button', { name: 'Mulai Backup' }).last().click()
  await expect(page.getByText('Sedang berjalan')).toBeVisible()
  await expect.poll(() => statusRequests).toBeGreaterThanOrEqual(2)
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Unduh' }).click()
  expect((await download).suggestedFilename()).toBe(`${backup.backup_id}.tar.gz.gpg`)
  await expect.poll(() => page.evaluate(() => window.__backupObjectUrlRevocations)).toBe(1)
})

test('Manager can view backup status and history without privileged actions', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ'], 'MANAGER')
  await page.route('**/api/v1/system/backups**', async (route) => {
    const status = route.request().url().endsWith('/status')
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success(status ? { state: 'idle' } : { items: [backup], pagination: { page: 1, limit: 20, total_items: 1, total_pages: 1 } })) })
  })
  await page.goto('/system-backups')
  await expect(page.getByText('Riwayat Backup Selesai')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Mulai Backup' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Unduh' })).toHaveCount(0)
})

test('user without read permission is redirected and does not see backup navigation', async ({ page }) => {
  await signIn(page, ['DASHBOARD_READ'], 'MANAGER')
  await page.goto('/system-backups')
  await expect(page).toHaveURL(/\/forbidden$/)
  await expect(page.getByText('Manajemen Backup', { exact: true })).toHaveCount(0)
})

test('409 start refreshes status and polls only after running status', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ', 'SYSTEM_BACKUP_CREATE'])
  let posts = 0; let statuses = 0
  await page.route('**/api/v1/system/backups**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') { posts += 1; await route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'internal secret', data: null, error: { detail: 'nope' } }) }); return }
    if (url.pathname.endsWith('/status')) { statuses += 1; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ state: statuses === 1 ? 'idle' : 'running', backup_id: backup.backup_id, started_at: backup.completed_at })) }); return }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [], pagination: { page: 1, limit: 20, total_items: 0, total_pages: 0 } })) })
  })
  await page.goto('/system-backups'); await page.getByRole('button', { name: 'Mulai Backup' }).first().click(); await page.getByRole('button', { name: 'Mulai Backup' }).last().click()
  await expect(page.getByText('Backup lain sedang berjalan')).toBeVisible(); await expect(page.getByText('internal secret')).toHaveCount(0)
  await expect.poll(() => statuses).toBeGreaterThanOrEqual(2); await page.waitForTimeout(5_200)
  expect(posts).toBe(1); expect(statuses).toBeGreaterThanOrEqual(3)
})

test('503 start is safe and does not retry or begin idle polling', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ', 'SYSTEM_BACKUP_CREATE'])
  let posts = 0; let statuses = 0
  await page.route('**/api/v1/system/backups**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') { posts += 1; await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: '/private/path command=bad', data: null, error: null }) }); return }
    if (url.pathname.endsWith('/status')) { statuses += 1; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ state: 'idle' })) }); return }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [], pagination: { page: 1, limit: 20, total_items: 0, total_pages: 0 } })) })
  })
  await page.goto('/system-backups'); await page.getByRole('button', { name: 'Mulai Backup' }).first().click(); await page.getByRole('button', { name: 'Mulai Backup' }).last().click()
  await expect(page.getByText('Backup saat ini tidak tersedia atau belum dikonfigurasi')).toBeVisible(); await page.waitForTimeout(5_200)
  expect(posts).toBe(1); expect(statuses).toBe(1); await expect(page.getByText('/private/path command=bad')).toHaveCount(0)
})

test('history failure leaves successful status and refresh control visible', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ'])
  await page.route('**/api/v1/system/backups**', async (route) => {
    if (route.request().url().endsWith('/status')) { await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ state: 'idle' })) }); return }
    await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'private failure', data: null, error: null }) })
  })
  await page.goto('/system-backups')
  await expect(page.getByText('Siap')).toBeVisible(); await expect(page.getByText('Riwayat backup tidak dapat dimuat. Status backup tetap tersedia.')).toBeVisible(); await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible()
})

test('initial running polling stops after navigation away', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ'])
  let statuses = 0
  await page.route('**/api/v1/system/backups**', async (route) => {
    if (route.request().url().endsWith('/status')) { statuses += 1; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ state: 'running', backup_id: backup.backup_id, started_at: backup.completed_at })) }); return }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [], pagination: { page: 1, limit: 20, total_items: 0, total_pages: 0 } })) })
  })
  await page.goto('/system-backups'); await expect.poll(() => statuses, { timeout: 8_000 }).toBeGreaterThanOrEqual(2)
  await page.goto('/login'); const afterUnmount = statuses; await page.waitForTimeout(5_200); expect(statuses).toBe(afterUnmount)
})

test('download 404 is safe and does not create a download', async ({ page }) => {
  await signIn(page, ['SYSTEM_BACKUP_READ', 'SYSTEM_BACKUP_DOWNLOAD'])
  let downloads = 0
  page.on('download', () => { downloads += 1 })
  await page.route('**/api/v1/system/backups**', async (route) => {
    const url = new URL(route.request().url())
    if (url.pathname.endsWith('/download')) { await route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ status: 'error', message: 'private blob body', data: null, error: null }) }); return }
    if (url.pathname.endsWith('/status')) { await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ state: 'idle' })) }); return }
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ items: [backup], pagination: { page: 1, limit: 20, total_items: 1, total_pages: 1 } })) })
  })
  await page.goto('/system-backups'); await page.getByRole('button', { name: 'Unduh' }).click()
  await expect(page.getByText('Backup tidak lagi tersedia untuk diunduh')).toBeVisible(); await expect(page.getByText('private blob body')).toHaveCount(0); await page.waitForTimeout(300); expect(downloads).toBe(0)
})
