import { ref, computed } from 'vue';
import { toast } from 'vue-sonner';
import { predictAIEstimation } from '@/api/dashboard/aiEstimation';
import type { AIEstimationRequest } from '@/schemas/ai-estimation/request';
import type { AIPredictionResponseData } from '@/schemas/ai-estimation/response';

export function useAIEstimation() {
  const isLoading = ref(false);
  const estimationResult = ref<AIPredictionResponseData | null>(null);

  const initialFormState = (): AIEstimationRequest => ({
    qty_s: 0,
    qty_m: 0,
    qty_l: 0,
    qty_xl: 0,
    qty_xxl: 0,
    jenis: 1.0,
    men_women: 1.0,
    panjang_01: 0.0,
    embro: 0.0,
    furing: 0.0,
    cutting_in_house: 1.0,
    konsumsi_kain_per_pcs: 1.0,
    jenis_kain: 1.0,
  });

  const form = ref<AIEstimationRequest>(initialFormState());

  // Real-time calculations matching backend logic, casting to Number to prevent string concatenation
  const totalQty = computed(() => {
    return Number(form.value.qty_s || 0) + 
           Number(form.value.qty_m || 0) + 
           Number(form.value.qty_l || 0) + 
           Number(form.value.qty_xl || 0) + 
           Number(form.value.qty_xxl || 0);
  });

  const jumlahSize = computed(() => {
    let count = 0;
    if (Number(form.value.qty_s || 0) > 0) count++;
    if (Number(form.value.qty_m || 0) > 0) count++;
    if (Number(form.value.qty_l || 0) > 0) count++;
    if (Number(form.value.qty_xl || 0) > 0) count++;
    if (Number(form.value.qty_xxl || 0) > 0) count++;
    return count;
  });

  const sizeRatios = computed(() => {
    const total = totalQty.value;
    if (total === 0) {
      return { s: 0, m: 0, l: 0, xl: 0, xxl: 0 };
    }
    return {
      s: Number((Number(form.value.qty_s || 0) / total).toFixed(4)),
      m: Number((Number(form.value.qty_m || 0) / total).toFixed(4)),
      l: Number((Number(form.value.qty_l || 0) / total).toFixed(4)),
      xl: Number((Number(form.value.qty_xl || 0) / total).toFixed(4)),
      xxl: Number((Number(form.value.qty_xxl || 0) / total).toFixed(4)),
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

    const konsumsi = Number(form.value.konsumsi_kain_per_pcs || 0);
    if (konsumsi <= 0) {
      toast.error('Konsumsi kain per pcs harus lebih besar dari 0.');
      return;
    }

    // Map and sanitize request payload to strict numbers
    const payload: AIEstimationRequest = {
      qty_s: Number(form.value.qty_s || 0),
      qty_m: Number(form.value.qty_m || 0),
      qty_l: Number(form.value.qty_l || 0),
      qty_xl: Number(form.value.qty_xl || 0),
      qty_xxl: Number(form.value.qty_xxl || 0),
      jenis: Number(form.value.jenis),
      men_women: Number(form.value.men_women),
      panjang_01: Number(form.value.panjang_01),
      embro: Number(form.value.embro),
      furing: Number(form.value.furing),
      cutting_in_house: Number(form.value.cutting_in_house),
      konsumsi_kain_per_pcs: konsumsi,
      jenis_kain: Number(form.value.jenis_kain),
    };

    console.log('[AI Estimation] Sending payload to Go backend:', JSON.stringify(payload));

    isLoading.value = true;
    try {
      const result = await predictAIEstimation(payload);
      console.log('[AI Estimation] Received result from Go backend:', JSON.stringify(result));
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
