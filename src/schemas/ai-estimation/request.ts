import * as z from 'zod';

export const aiEstimationRequestSchema = z.object({
  qty_s: z.number({ required_error: 'QTY S wajib diisi' }).min(0, 'Minimal 0'),
  qty_m: z.number({ required_error: 'QTY M wajib diisi' }).min(0, 'Minimal 0'),
  qty_l: z.number({ required_error: 'QTY L wajib diisi' }).min(0, 'Minimal 0'),
  qty_xl: z.number({ required_error: 'QTY XL wajib diisi' }).min(0, 'Minimal 0'),
  qty_xxl: z.number({ required_error: 'QTY XXL wajib diisi' }).min(0, 'Minimal 0'),
  jenis: z.number({ required_error: 'Jenis pakaian wajib dipilih' }),
  men_women: z.number({ required_error: 'Kategori gender wajib dipilih' }),
  panjang_01: z.number({ required_error: 'Jenis panjang lengan wajib dipilih' }),
  embro: z.number({ required_error: 'Kategori embroidery wajib dipilih' }),
  furing: z.number({ required_error: 'Kategori furing wajib dipilih' }),
  cutting_in_house: z.number({ required_error: 'Metode cutting wajib dipilih' }),
  konsumsi_kain_per_pcs: z.number({ required_error: 'Konsumsi kain per pcs wajib diisi' }).min(0.01, 'Harus lebih dari 0'),
  jenis_kain: z.number({ required_error: 'Jenis kain wajib dipilih' }),
});

export type AIEstimationRequest = z.infer<typeof aiEstimationRequestSchema>;

// Dropdown option definitions for AI model compatibility
export const jenisOptions = [
  { label: 'T-Shirt (Kaos)', value: 1.0 },
  { label: 'Shirt (Kemeja)', value: 2.0 },
  { label: 'Jacket (Jaket)', value: 3.0 },
  { label: 'Pants (Celana)', value: 4.0 },
  { label: 'Others (Lainnya)', value: 5.0 },
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
  { label: 'Katun (Cotton)', value: 1.0 },
  { label: 'Polyester', value: 2.0 },
  { label: 'Denim', value: 3.0 },
  { label: 'Viscose / Rayon', value: 4.0 },
  { label: 'Linen / Drill', value: 5.0 },
];
