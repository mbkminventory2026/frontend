<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from '@tanstack/vue-router';
import { ArrowLeftIcon, SaveIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { createSuratJalanInternal } from '@/api/surat-jalan-internal/surat-jalan-internal';
import { getPackingLists } from '@/api/packing-list/packing-list';
import type { PackingListListItem } from '@/schemas/packing-list/response';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/formatter';

const router = useRouter();

const noDokumen = ref('');
const deskripsi = ref('');
const isSubmitting = ref(false);

const availablePackingLists = ref<PackingListListItem[]>([]);
const selectedPlIds = ref<number[]>([]);
const isLoadingPls = ref(false);

const fetchAvailablePackingLists = async () => {
    isLoadingPls.value = true;
    try {
        const res = await getPackingLists({ limit: 100 });
        // Filter unassigned packing lists (id_surat_jalan_internal is null)
        availablePackingLists.value = res.results.filter(pl => !pl.id_surat_jalan_internal);
    } catch (e) {
        console.error("Gagal memuat packing list:", e);
    } finally {
        isLoadingPls.value = false;
    }
};

const togglePlSelection = (id: number) => {
    const idx = selectedPlIds.value.indexOf(id);
    if (idx > -1) {
        selectedPlIds.value.splice(idx, 1);
    } else {
        selectedPlIds.value.push(id);
    }
};

const handleSubmit = async () => {
    if (!noDokumen.value.trim()) {
        toast.error('Nomor dokumen wajib diisi.');
        return;
    }

    isSubmitting.value = true;
    try {
        await createSuratJalanInternal({
            no_dokumen: noDokumen.value.trim(),
            deskripsi: deskripsi.value.trim(),
            id_packing_lists: selectedPlIds.value
        });
        toast.success('Surat Jalan Internal berhasil dibuat.');
        router.navigate({ to: '/surat-jalan-internal' });
    } catch (error: any) {
        toast.error(error?.response?.data?.message || 'Gagal membuat Surat Jalan Internal.');
    } finally {
        isSubmitting.value = false;
    }
};

onMounted(() => {
    fetchAvailablePackingLists();
});
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <div class="flex items-center gap-4">
      <Button variant="outline" size="icon" @click="router.navigate({ to: '/surat-jalan-internal' })">
        <ArrowLeftIcon class="w-4 h-4" />
      </Button>
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Buat Surat Jalan Internal</h2>
        <p class="text-muted-foreground">Isi informasi dokumen surat jalan internal baru</p>
      </div>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Informasi Dokumen</CardTitle>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">No. Dokumen Surat Jalan <span class="text-destructive">*</span></label>
          <Input 
            v-model="noDokumen" 
            placeholder="Contoh: SJ-INT-2026-001"
            :disabled="isSubmitting"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium">Deskripsi / Catatan Tambahan</label>
          <Textarea 
            v-model="deskripsi" 
            placeholder="Masukkan deskripsi atau catatan mengenai pengiriman..."
            rows="3"
            :disabled="isSubmitting"
          />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Attach Packing List (Opsional)</CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="isLoadingPls" class="py-4 text-center text-muted-foreground">
          Memuat daftar Packing List...
        </div>
        <div v-else-if="availablePackingLists.length === 0" class="py-4 text-center text-muted-foreground">
          Tidak ada Packing List yang tersedia (semua Packing List sudah memiliki Surat Jalan).
        </div>
        <div v-else class="space-y-2 max-h-80 overflow-y-auto pr-2">
          <div 
            v-for="pl in availablePackingLists" 
            :key="pl.id_packing_list"
            class="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
            @click="togglePlSelection(pl.id_packing_list)"
          >
            <Checkbox 
              :checked="selectedPlIds.includes(pl.id_packing_list)"
              @update:checked="() => togglePlSelection(pl.id_packing_list)"
            />
            <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div><span class="font-semibold">ID PL:</span> #{{ pl.id_packing_list }}</div>
              <div><span class="font-semibold">ID WO:</span> #{{ pl.id_wo }}</div>
              <div><span class="font-semibold">Buyer/Model:</span> {{ pl.buyer }} - {{ pl.model }}</div>
              <div><span class="font-semibold">Dibuat:</span> {{ formatDate(pl.created_at) }}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="flex justify-end gap-3">
      <Button variant="outline" @click="router.navigate({ to: '/surat-jalan-internal' })" :disabled="isSubmitting">
        Batal
      </Button>
      <Button @click="handleSubmit" :disabled="isSubmitting" class="flex gap-2 items-center">
        <SaveIcon class="w-4 h-4" /> {{ isSubmitting ? 'Menyimpan...' : 'Simpan Surat Jalan' }}
      </Button>
    </div>
  </div>
</template>
