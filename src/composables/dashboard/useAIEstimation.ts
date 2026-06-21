import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { predictAIEstimation } from '@/api/dashboard/aiEstimation';
import { aiEstimationRequestSchema, type AIEstimationRequest } from '@/schemas/ai-estimation/request';
import type { AIPredictionResponseData } from '@/schemas/ai-estimation/response';

import { parseToFloat, parseToInt } from '@/lib/number';

export function useAIEstimation() {
  const isLoading = ref(false);
  const estimationResult = ref<AIPredictionResponseData | null>(null);

  const initialFormState = (): any => ({
    qty_s: '',
    qty_m: '',
    qty_l: '',
    qty_xl: '',
    qty_xxl: '',
    jenis: undefined,
    men_women: undefined,
    panjang_01: undefined,
    embro: undefined,
    furing: undefined,
    cutting_in_house: undefined,
    konsumsi_kain_per_pcs: '',
    jenis_kain: undefined,
  });

  const form = ref<any>(initialFormState());
  const errors = ref<Record<string, string>>({});

  // Real-time calculations matching backend logic, casting to Number to prevent string concatenation
  const totalQty = computed(() => {
    return parseToInt(form.value.qty_s) + 
           parseToInt(form.value.qty_m) + 
           parseToInt(form.value.qty_l) + 
           parseToInt(form.value.qty_xl) + 
           parseToInt(form.value.qty_xxl);
  });

  const jumlahSize = computed(() => {
    let count = 0;
    if (parseToInt(form.value.qty_s) > 0) count++;
    if (parseToInt(form.value.qty_m) > 0) count++;
    if (parseToInt(form.value.qty_l) > 0) count++;
    if (parseToInt(form.value.qty_xl) > 0) count++;
    if (parseToInt(form.value.qty_xxl) > 0) count++;
    return count;
  });

  const sizeRatios = computed(() => {
    const total = totalQty.value;
    if (total === 0) {
      return { s: 0, m: 0, l: 0, xl: 0, xxl: 0 };
    }
    return {
      s: Number((parseToInt(form.value.qty_s) / total).toFixed(4)),
      m: Number((parseToInt(form.value.qty_m) / total).toFixed(4)),
      l: Number((parseToInt(form.value.qty_l) / total).toFixed(4)),
      xl: Number((parseToInt(form.value.qty_xl) / total).toFixed(4)),
      xxl: Number((parseToInt(form.value.qty_xxl) / total).toFixed(4)),
    };
  });

  const resetForm = () => {
    form.value = initialFormState();
    errors.value = {};
    estimationResult.value = null;
    toast.info('Formulir berhasil direset');
  };

  const calculateEstimation = async () => {
    errors.value = {};
    const total = totalQty.value;
    if (total === 0) {
      toast.error('Jumlah total pesanan (QTY S + M + L + XL + XXL) harus lebih besar dari 0.');
      return;
    }

    const konsumsi = parseToFloat(form.value.konsumsi_kain_per_pcs);

    const rawPayload = {
      qty_s: form.value.qty_s === '' ? undefined : parseToInt(form.value.qty_s),
      qty_m: form.value.qty_m === '' ? undefined : parseToInt(form.value.qty_m),
      qty_l: form.value.qty_l === '' ? undefined : parseToInt(form.value.qty_l),
      qty_xl: form.value.qty_xl === '' ? undefined : parseToInt(form.value.qty_xl),
      qty_xxl: form.value.qty_xxl === '' ? undefined : parseToInt(form.value.qty_xxl),
      jenis: form.value.jenis,
      men_women: form.value.men_women,
      panjang_01: form.value.panjang_01,
      embro: form.value.embro,
      furing: form.value.furing,
      cutting_in_house: form.value.cutting_in_house,
      konsumsi_kain_per_pcs: form.value.konsumsi_kain_per_pcs === '' ? undefined : konsumsi,
      jenis_kain: form.value.jenis_kain,
    };

    const validation = aiEstimationRequestSchema.safeParse(rawPayload);
    if (!validation.success) {
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors.value[issue.path[0].toString()] = issue.message;
        }
      });
      toast.error('Silakan periksa kembali form Anda.');
      return;
    }

    const payload: AIEstimationRequest = validation.data;

    isLoading.value = true;
    try {
      const result = await predictAIEstimation(payload);
      estimationResult.value = result;
      toast.success('Estimasi AI berhasil dihitung!');
    } catch (error: any) {
      console.error('API Error:', error);
      console.error('API Error Response Data:', error.response?.data);
      
      const responseData = error.response?.data;
      let errorMsg = 'Gagal memproses prediksi AI. Periksa koneksi ke backend atau python service.';
      if (responseData) {
        if (responseData.error) {
          errorMsg = `${responseData.message}: ${responseData.error}`;
        } else if (responseData.message) {
          errorMsg = responseData.message;
        }
      }
      toast.error(errorMsg);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    form,
    errors,
    isLoading,
    estimationResult,
    totalQty,
    jumlahSize,
    sizeRatios,
    resetForm,
    calculateEstimation,
  };
}
