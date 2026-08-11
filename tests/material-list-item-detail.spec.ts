import { expect, test } from '@playwright/test'

function token(permissions: string[]) {
  const payload = Buffer.from(JSON.stringify({ permissions, role_name: 'MANAGER' })).toString('base64url')
  return `x.${payload}.x`
}

function success(data: unknown) {
  return { status: 'success', message: 'ok', data, error: null }
}

test('sends source-prefilled, zero, and blank CONS./PC values in update payloads', async ({ page }) => {
  await page.addInitScript(({ accessToken }) => localStorage.setItem('accessToken', accessToken), {
    accessToken: token(['MATERIAL_LIST_READ', 'MATERIAL_LIST_UPDATE']),
  })

  const updatePayloads: Array<Record<string, unknown>> = []
  await page.route('**/api/v1/material-list-items/101/history', async (route) => {
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({ surat_jalan: [], received: [] })) })
  })
  await page.route('**/api/v1/material-list-items/101', async (route) => {
    if (route.request().method() === 'PATCH') {
      updatePayloads.push(route.request().postDataJSON() as Record<string, unknown>)
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify(success({})) })
      return
    }
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(success({
        id_material_list_item: 101,
        id_material_list: 1,
        item: 'E2E-SIZE-01',
        description: 'E2E test size',
        qty: 10,
        unit: 'pcs',
        est_price: 0,
        category: 'FABRIC',
        cons_per_pc: null,
        qty_wo_scope: 'COLOR_SIZE',
        id_qty_wo_shell: 2,
        id_qty_wo_size: 4,
        created_at: '2026-08-11T00:00:00Z',
        qty_surat_jalan: 0,
        qty_received: 0,
        ml_name: 'E2E Material List',
        ml_is_locked: false,
        id_wo: 7,
        buyer: 'E2E Buyer',
        model: 'E2E Model',
      })),
    })
  })
  await page.route('**/api/v1/material-lists/1', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(success({
        id_material_list: 1,
        id_wo: 7,
        name: 'E2E Material List',
        is_locked: false,
        items: [{ id_material_list_item: 101, item: 'E2E-SIZE-01', id_wo_shell: null, id_wo_trim: null }],
      })),
    })
  })
  await page.route('**/api/v1/work-orders/7', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify(success({
        id_wo: 7,
        shells: [
          { id_wo_shell: 1, color: 'NAVY', deskripsi: 'Cotton Fleece', cons: 0.35, sizes: [] },
          { id_wo_shell: 2, color: 'MAROON', deskripsi: 'Shell #2', cons: 0.4, sizes: [{ id_wo_shell_size: 22, id_size: 4, size: 'M' }] },
        ],
        trims: [],
      })),
    })
  })

  await page.goto('/material-list/101')

  const openEdit = async () => {
    await page.getByRole('button', { name: 'Edit Item' }).click()
    const dialog = page.getByRole('dialog', { name: 'Edit Item Material List' })
    await expect(dialog).toBeVisible()
    return {
      dialog,
      sourceShell: dialog.locator('label').filter({ hasText: 'Shell sumber' }).locator('..').locator('select'),
      consumption: dialog.locator('label').filter({ hasText: 'CONS./PC' }).locator('..').locator('input'),
    }
  }

  const prefilled = await openEdit()
  await prefilled.sourceShell.selectOption('1')
  await expect(prefilled.consumption).toHaveValue('0.35')
  await prefilled.dialog.getByRole('button', { name: 'Simpan' }).click()
  await expect.poll(() => updatePayloads.length).toBe(1)
  expect(updatePayloads[0].cons_per_pc).toBe(0.35)

  const explicitZero = await openEdit()
  await explicitZero.consumption.fill('0')
  await explicitZero.dialog.getByRole('button', { name: 'Simpan' }).click()
  await expect.poll(() => updatePayloads.length).toBe(2)
  expect(updatePayloads[1].cons_per_pc).toBe(0)

  const explicitBlank = await openEdit()
  await explicitBlank.consumption.fill('0.35')
  await explicitBlank.consumption.fill('')
  await explicitBlank.dialog.getByRole('button', { name: 'Simpan' }).click()
  await expect.poll(() => updatePayloads.length).toBe(3)
  expect(updatePayloads[2].cons_per_pc).toBeNull()
})
