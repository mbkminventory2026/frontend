import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { predictAIEstimation } from '@/api/dashboard/aiEstimation';
import type { AIEstimationRequest } from '@/schemas/ai-estimation/request';
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
    jenis: 1.0,
    men_women: 1.0,
    panjang_01: 0.0,
    embro: 0.0,
    furing: 0.0,
    cutting_in_house: 1.0,
    konsumsi_kain_per_pcs: '',
    jenis_kain: 1.0,
  });

  const form = ref<any>(initialFormState());

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
    estimationResult.value = null;
    toast.info('Formulir berhasil direset');
  };

  const calculateEstimation = async () => {
    const total = totalQty.value;
    if (total === 0) {
      toast.error('Jumlah total pesanan (QTY S + M + L + XL + XXL) harus lebih besar dari 0.');
      return;
    }

    const konsumsi = parseToFloat(form.value.konsumsi_kain_per_pcs);
    if (konsumsi <= 0) {
      toast.error('Konsumsi kain per pcs harus lebih besar dari 0.');
      return;
    }

    // Map and sanitize request payload to strict numbers
    const payload: AIEstimationRequest = {
      qty_s: parseToInt(form.value.qty_s),
      qty_m: parseToInt(form.value.qty_m),
      qty_l: parseToInt(form.value.qty_l),
      qty_xl: parseToInt(form.value.qty_xl),
      qty_xxl: parseToInt(form.value.qty_xxl),
      jenis: Number(form.value.jenis),
      men_women: Number(form.value.men_women),
      panjang_01: Number(form.value.panjang_01),
      embro: Number(form.value.embro),
      furing: Number(form.value.furing),
      cutting_in_house: Number(form.value.cutting_in_house),
      konsumsi_kain_per_pcs: konsumsi,
      jenis_kain: Number(form.value.jenis_kain),
    };

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
    isLoading,
    estimationResult,
    totalQty,
    jumlahSize,
    sizeRatios,
    resetForm,
    calculateEstimation,
  };
}
