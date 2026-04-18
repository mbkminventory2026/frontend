# 📝 Notes Frontend -> Backend: Implementasi Server-Side Sorting & Pagination

Halo tim Backend 👋,

Terkait fitur Data Table di Frontend, kami sedang mengimplementasikan **Server-Side Pagination & Sorting** menggunakan TanStack Table. Agar fitur sorting ini bisa berjalan, Frontend akan mengirimkan parameter baru melalui *Query Params* (URL) saat memanggil API *list/index*. 

Berikut adalah detail *API Contract* yang dibutuhkan dari sisi Frontend:

## 1. Query Parameters yang Dikirim Frontend

Saat user melakukan *sorting*, Frontend akan menyisipkan 2 parameter tambahan di luar parameter pagination (`page` dan `pageSize`):

| Parameter | Tipe Data | Deskripsi | Contoh Value |
| :--- | :--- | :--- | :--- |
| `sortBy` | `string` (opsional) | Nama kolom/field yang ingin diurutkan. | `name`, `created_at`, `price` |
| `sortDesc`| `boolean` (opsional)| Arah urutan. `true` = Descending (Z-A / Terkini), `false` = Ascending (A-Z / Terlama). Default-nya adalah `false`. | `true`, `false` |

## 2. Contoh Request (Skenario)

### A. Kondisi Default (Tidak ada sorting aktif / Clear sort)
Hanya mengirimkan pagination.
```http
GET /api/v1/pokemon?page=1&pageSize=20
```

### B. User mengklik kolom "Nama" (Ascending A-Z)
```http
GET /api/v1/pokemon?page=1&pageSize=20&sortBy=name&sortDesc=false
```

### C. User mengklik lagi kolom "Nama" (Descending Z-A)
```http
GET /api/v1/pokemon?page=1&pageSize=20&sortBy=name&sortDesc=true
```

## 3. Catatan Tambahan untuk Backend

*   **Reset Halaman:** Frontend sudah diprogram agar setiap kali user mengubah *sorting* (atau filter), parameter `page` akan otomatis di-reset kembali ke `1`. Jadi Backend tidak perlu khawatir soal anomali data jika *sorting* diubah saat user berada di halaman tengah/akhir.
*   **Keamanan Field:** Dari sisi Backend, mohon pastikan parameter `sortBy` di-*whitelist* (divalidasi) agar user tidak bisa memasukkan *query* sembarangan (mencegah *SQL Injection* pada klausa `ORDER BY`).
*   **Null Safety:** Jika Frontend tidak mengirimkan `sortBy` (undefined/null), mohon kembalikan data dengan urutan *default* (misalnya berdasarkan `created_at DESC` atau ID).

Mohon infokan jika strukturnya sudah siap di-test atau jika ada penyesuaian penamaan parameter (misalnya backend lebih prefer menggunakan string `asc`/`desc` daripada boolean `true`/`false` untuk `sortDesc`, kami bisa menyesuaikannya di Frontend).

Terima kasih! 🚀