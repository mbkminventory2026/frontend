import * as z from 'zod';

export const aiEstimationRequestSchema = z.object({
  qty_s: z.coerce.number({ required_error: 'QTY S wajib diisi', invalid_type_error: 'Harus berupa angka' }).min(0, 'Minimal 0'),
  qty_m: z.coerce.number({ required_error: 'QTY M wajib diisi', invalid_type_error: 'Harus berupa angka' }).min(0, 'Minimal 0'),
  qty_l: z.coerce.number({ required_error: 'QTY L wajib diisi', invalid_type_error: 'Harus berupa angka' }).min(0, 'Minimal 0'),
  qty_xl: z.coerce.number({ required_error: 'QTY XL wajib diisi', invalid_type_error: 'Harus berupa angka' }).min(0, 'Minimal 0'),
  qty_xxl: z.coerce.number({ required_error: 'QTY XXL wajib diisi', invalid_type_error: 'Harus berupa angka' }).min(0, 'Minimal 0'),
  jenis: z.coerce.number({ required_error: 'Jenis pakaian wajib dipilih', invalid_type_error: 'Jenis pakaian wajib dipilih' }),
  men_women: z.coerce.number({ required_error: 'Kategori gender wajib dipilih', invalid_type_error: 'Kategori gender wajib dipilih' }),
  panjang_01: z.coerce.number({ required_error: 'Jenis panjang lengan wajib dipilih', invalid_type_error: 'Jenis panjang lengan wajib dipilih' }),
  embro: z.coerce.number({ required_error: 'Kategori embroidery wajib dipilih', invalid_type_error: 'Kategori embroidery wajib dipilih' }),
  furing: z.coerce.number({ required_error: 'Kategori furing wajib dipilih', invalid_type_error: 'Kategori furing wajib dipilih' }),
  cutting_in_house: z.coerce.number({ required_error: 'Metode cutting wajib dipilih', invalid_type_error: 'Metode cutting wajib dipilih' }),
  konsumsi_kain_per_pcs: z.coerce.number({ required_error: 'Konsumsi kain per pcs wajib diisi', invalid_type_error: 'Harus berupa angka' }).min(0.01, 'Harus lebih dari 0'),
  jenis_kain: z.coerce.number({ required_error: 'Jenis kain wajib dipilih', invalid_type_error: 'Jenis kain wajib dipilih' }),
});

export type AIEstimationRequest = z.infer<typeof aiEstimationRequestSchema>;

// Dropdown option definitions for AI model compatibility
export const jenisOptions = [
  { label: 'Blouse', value: 0.0 },
  { label: 'Celana', value: 1.0 },
  { label: 'Dress', value: 2.0 },
  { label: 'Hoodie', value: 3.0 },
  { label: 'Jacket', value: 4.0 },
  { label: 'Kemeja', value: 5.0 },
  { label: 'Shirt', value: 6.0 },
  { label: 'Women Blouse', value: 7.0 },
];

export const menWomenOptions = [
  { label: 'Laki-laki (Men)', value: 1.0 },
  { label: 'Perempuan (Women)', value: 0.0 },
];

export const panjangOptions = [
  { label: 'Pendek (Short)', value: 0.0 },
  { label: 'Panjang (Long)', value: 1.0 },
];

export const embroOptions = [
  { label: 'Dengan Embroidery (Yes)', value: 1.0 },
  { label: 'Tanpa Embroidery (No)', value: 0.0 },
];

export const furingOptions = [
  { label: 'Dengan Furing/Lining (Yes)', value: 1.0 },
  { label: 'Tanpa Furing/Lining (No)', value: 0.0 },
];

export const cuttingInHouseOptions = [
  { label: 'Cutting In-House (Internal)', value: 1.0 },
  { label: 'Cutting Out-Sourced (Eksternal)', value: 0.0 },
];

export const jenisKainOptions = [
  { label: 'Drill', value: 0.0 },
  { label: 'Fleece', value: 1.0 },
  { label: 'Herringbone', value: 2.0 },
  { label: 'Oxford', value: 3.0 },
  { label: 'Polo', value: 4.0 },
  { label: 'Silk', value: 5.0 },
  { label: 'Slub', value: 6.0 },
  { label: 'Spandex', value: 7.0 },
];
