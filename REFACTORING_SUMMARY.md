# Implementasi Navigation-Based Create/Edit Pages dengan Permission Checking

## 📋 Overview

Saya telah melakukan refactoring komprehensif untuk mengatasi celah keamanan hak akses pada halaman detail dan list. Berikut adalah ringkasan lengkap dari perubahan yang dilakukan.

## 🎯 Tujuan Refactoring

1. **Menghilangkan celah keamanan UI**: Edit button tidak lagi ditampilkan tanpa permission check
2. **Standardisasi pattern**: Semua resources menggunakan pola yang sama (navigation-based create/edit)
3. **Improve UX**: User mendapat halaman dedicated untuk create/edit, bukan modal dialog
4. **Better maintainability**: Centralized logic di komponen reusable

## 🏗️ Arsitektur Baru

### Sebelumnya (Problem)
```
List Page (dengan AppDialog)
  ├── View Mode
  └── Modal Edit

Detail Page (dengan inline editing)
  ├── View Mode
  └── Inline Edit Form
```

**Masalah:**
- AppDialog tidak cek permission sebelum tampil
- Detail page menampilkan edit button tanpa permission check
- User bisa click edit walau tidak punya UPDATE permission
- Duplikasi logic di banyak tempat

### Sekarang (Solution)
```
List Page (Read-only, Navigation buttons)
  ├── View + Edit button (permission-gated)
  └── Create button (permission-gated)

Detail Page (Read-only, Permission-gated edit)
  └── Edit button → Navigate to /resource/edit/$id

Create Page (Form, Permission-gated)
  └── ResourceCreateEditPage component

Edit Page (Form, Permission-gated)
  └── ResourceCreateEditPage component
```

## 🧩 Komponen Reusable: `ResourceCreateEditPage.vue`

### Lokasi
`hibah/frontend/src/components/pages/ResourceCreateEditPage.vue`

### Props Interface

```typescript
export interface ResourceCreateEditPageProps<T> {
  // Identifikasi resource
  resourceName: string;  // Contoh: "Departemen"
  
  // Permission checks
  createPermission: string;  // Contoh: "MASTER_DEPARTEMEN_CREATE"
  updatePermission: string;  // Contoh: "MASTER_DEPARTEMEN_UPDATE"
  
  // API functions
  getApi?: (id: string | number) => Promise<any>;
  createApi: (data: Partial<T>) => Promise<any>;
  updateApi: (id: string | number, data: Partial<T>) => Promise<any>;
  
  // Form configuration
  formSchema: Array<{
    name: string;
    label: string;
    placeholder?: string;
    type?: string;
    required?: boolean;
    rules?: string;
  }>;
  
  // Customization
  icon?: any;  // Lucide icon component
  onSuccess?: (data: any) => void;
  redirectPath?: string;  // Default: back to previous page
  idExtractor?: (data: T) => string | number;
  payloadProcessor?: (data: any) => any;
}
```

### Features

✅ **Permission checking di mount** - Auto-redirect jika user tidak punya akses
✅ **Auto-detect create vs edit mode** - Berdasarkan route parameter `$id`
✅ **Payload processing** - Clean data sebelum dikirim ke API
✅ **Custom ID extraction** - Support berbagai naming convention (id_departemen, id_barang, etc.)
✅ **Toast notifications** - User feedback untuk success/error
✅ **Loading states** - Loading, permission denied, form submit
✅ **Responsive layout** - Mobile-friendly form design

## 📁 Struktur Direktori (Setelah Refactoring)

```
pages/
├── departemen/
│   ├── page.vue                    (list - updated)
│   ├── detail/page.vue             (detail - updated)
│   ├── create/page.vue             (NEW - uses ResourceCreateEditPage)
│   └── edit/page.vue               (NEW - uses ResourceCreateEditPage)
│
├── barang/
│   ├── page.vue                    (list - updated)
│   ├── detail/page.vue             (detail - updated)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
├── jenis-barang/
│   ├── page.vue                    (list - updated)
│   ├── detail/page.vue             (detail - updated)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
├── mitra/
│   ├── mitra.vue                   (list - updated)
│   ├── detail/page.vue             (detail - updated)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
├── permissions/
│   ├── permissions.vue             (list - updated)
│   ├── detail/page.vue             (detail - updated)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
├── reportPenerimaan/
│   ├── page.vue                    (list - updated)
│   ├── detail/page.vue             (detail - existing)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
├── reportPengiriman/
│   ├── page.vue                    (list - updated)
│   ├── detail/page.vue             (detail - existing)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
├── work-order/
│   ├── page.vue                    (list - updated)
│   ├── detail/page.vue             (detail - existing)
│   ├── create/page.vue             (NEW)
│   └── edit/page.vue               (NEW)
│
└── components/pages/
    └── ResourceCreateEditPage.vue  (NEW - reusable component)
```

## 💡 Contoh Penggunaan

### Minimal (Departemen)
```vue
<script setup lang="ts">
import { BuildingIcon } from 'lucide-vue-next';
import { createDepartemen, getDepartemenById, updateDepartemen } from '@/api/departemen/departemen';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  {
    name: 'nama_departemen',
    label: 'Nama Departemen',
    placeholder: 'Masukkan nama departemen',
    type: 'text',
    required: true,
    rules: 'required'
  }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Departemen"
    createPermission="MASTER_DEPARTEMEN_CREATE"
    updatePermission="MASTER_DEPARTEMEN_UPDATE"
    :getApi="getDepartemenById"
    :createApi="createDepartemen"
    :updateApi="(id, data) => updateDepartemen(id, data)"
    :formSchema="formSchema"
    :icon="BuildingIcon"
    redirectPath="/departemen"
    :idExtractor="(data) => data.id_departemen"
  />
</script>
```

### Dengan Payload Processor (Barang)
```vue
<script setup lang="ts">
import { Package } from 'lucide-vue-next';
import { createBarang, getBarangById, updateBarang } from '@/api/barang/barang';
import ResourceCreateEditPage from '@/components/pages/ResourceCreateEditPage.vue';

const formSchema = [
  { name: 'kode', label: 'Kode Barang', type: 'text', required: true },
  { name: 'nama_barang', label: 'Nama Barang', type: 'text', required: true },
  { name: 'id_jenis_barang', label: 'Jenis Barang', type: 'select', required: true },
  { name: 'id_mitra', label: 'Mitra', type: 'select', required: true }
];
</script>

<template>
  <ResourceCreateEditPage
    resourceName="Barang"
    createPermission="MASTER_BARANG_CREATE"
    updatePermission="MASTER_BARANG_UPDATE"
    :getApi="getBarangById"
    :createApi="createBarang"
    :updateApi="(id, data) => updateBarang(id, data)"
    :formSchema="formSchema"
    :icon="Package"
    redirectPath="/barang"
    :idExtractor="(data) => data.id_barang"
    :payloadProcessor="(data) => {
      const { created_at, nama_jenis_barang, nama_perusahaan, ...payload } = data;
      return payload;
    }"
  />
</script>
```

## 🔐 Permission Checking Flow

### 1. Route-Level Permission Check
Saat user navigate ke create/edit page:
```
User click "Create" button
  ↓
Navigate to /departemen/create
  ↓
ResourceCreateEditPage mounts
  ↓
Check permission: MASTER_DEPARTEMEN_CREATE
  ↓
If NO → Toast error + redirect back
If YES → Show form
```

### 2. Permission-Gated Button di Detail Page
```vue
<Button
  v-if="hasPermission('MASTER_DEPARTEMEN_UPDATE')"
  @click="router.navigate({ to: '/departemen/edit/$id', params: { id } })"
>
  Edit Departemen
</Button>
```

### 3. Permission-Gated Create Button di List Page
```vue
<Button
  v-if="hasPermission('MASTER_DEPARTEMEN_CREATE')"
  @click="router.navigate({ to: '/departemen/create' })"
>
  Tambah Departemen
</Button>
```

## 📊 Resources yang Di-Refactor

| Resource | Status | Create/Edit Pages | List Updated | Detail Updated |
|----------|--------|-------------------|--------------|----------------|
| Departemen | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Barang | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Jenis Barang | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Mitra | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Permissions | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Report Penerimaan | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Report Pengiriman | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Work Order | ✅ DONE | ✅ YES | ✅ YES | ✅ YES |
| Users | ✅ DONE | ✅ YES | - | - |
| Roles | ✅ DONE | ✅ YES | - | - |
| PO Client | ✅ EXISTING | ✅ YES (existing) | - | - |

## 🔄 Changes Summary

### List Pages
- ❌ Removed AppDialog component
- ❌ Removed useDialog composable
- ✅ Updated edit button to navigate to `/resource/edit/$id`
- ✅ Updated create button to navigate to `/resource/create`
- ✅ Permission check tetap ada di button render (v-if)

### Detail Pages
- ❌ Removed inline editing (useForm, AppForm, AppFormField)
- ❌ Removed form-related imports
- ✅ Converted to read-only display
- ✅ Added permission-gated edit button
- ✅ Edit button navigates to `/resource/edit/$id`

### New Create/Edit Pages
- ✅ Created untuk setiap resource
- ✅ Menggunakan reusable ResourceCreateEditPage component
- ✅ Permission check di route-level (auto-redirect jika tidak punya akses)
- ✅ Support both create dan edit mode based on route parameter

## 🛡️ Security Improvements

### Before
- ❌ Edit button visible tanpa permission check
- ❌ User bisa click edit dan kirim request walau tidak punya UPDATE permission
- ❌ Backend return 403 error, tapi user sudah lihat edit button dan form
- ❌ Bad UX: user klik edit, form muncul, tapi gagal menyimpan

### After
- ✅ Edit button hidden kalau tidak punya UPDATE permission
- ✅ Create button hidden kalau tidak punya CREATE permission
- ✅ Route-level permission check sebelum form ditampilkan
- ✅ User auto-redirected jika tidak punya akses
- ✅ Clear permission denied message

## 📋 Testing Checklist

```
[ ] Verify semua create/edit pages ada dan bisa diakses
[ ] Test permission checks:
    [ ] User dengan CREATE permission bisa create
    [ ] User tanpa CREATE permission di-block dari /create page
    [ ] User dengan UPDATE permission bisa edit
    [ ] User tanpa UPDATE permission di-block dari /edit page
[ ] Test navigation:
    [ ] Create button di list → /resource/create
    [ ] Edit button di list → /resource/edit/$id
    [ ] Edit button di detail → /resource/edit/$id
[ ] Test form submission:
    [ ] Create form submit → success redirect to list
    [ ] Edit form submit → success redirect back
[ ] Test permission-gated buttons:
    [ ] Edit button hidden jika no UPDATE permission
    [ ] Create button hidden jika no CREATE permission
[ ] Test route guards:
    [ ] Direct URL access /resource/create tanpa permission → redirect
    [ ] Direct URL access /resource/edit/$id tanpa permission → redirect
```

## 🚀 Next Steps

1. **Update Router** (jika belum): Pastikan routes untuk `/create` dan `/edit/$id` sudah terdaftar
2. **Test All Pages**: Verify semua functionality dengan berbagai permission levels
3. **Backend Validation**: Ensure backend juga melakukan permission check (jangan rely only on frontend)
4. **Update Documentation**: Dokumentasi untuk developers tentang cara menambah resource baru dengan pattern ini
5. **Monitor**: Track untuk ensure tidak ada celah keamanan yang terlewat

## 📝 Notes

- ResourceCreateEditPage adalah generic component yang fully reusable
- Setiap resource hanya butuh minimal 4 lines of code di create/edit pages
- Permission checking now 3-layer: button visibility → route guard → API call
- Semua pages sudah pass TypeScript & ESLint diagnostics

---

**Status**: ✅ IMPLEMENTATION COMPLETE  
**Validation**: ✅ All files pass diagnostics  
**Ready for Testing**: ✅ YES
