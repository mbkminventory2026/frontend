<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, onMounted, watch } from 'vue';
import { useRouter, useParams } from '@tanstack/vue-router';
import { ArrowLeftIcon, SaveIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { useForm } from '@/composables/form/useForm';
import { usePermission } from '@/composables/usePermission';

import AppForm from '@/components/form/AppForm.vue';
import AppFormField from '@/components/form/AppFormField.vue';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface ResourceCreateEditPageProps<T> {
  /**
   * Tipe resource (digunakan untuk permission check dan heading)
   * Contoh: "Departemen", "Barang", "Jenis Barang"
   */
  resourceName: string;

  /**
   * Permission yang dibutuhkan untuk CREATE
   * Contoh: "MASTER_DEPARTEMEN_CREATE"
   */
  createPermission: string;

  /**
   * Permission yang dibutuhkan untuk UPDATE
   * Contoh: "MASTER_DEPARTEMEN_UPDATE"
   */
  updatePermission: string;

  /**
   * API call untuk mendapatkan data (diperlukan untuk edit mode)
   */
  getApi?: (id: string | number) => Promise<any>;

  /**
   * API call untuk membuat data baru
   */
  createApi: (data: Partial<T>) => Promise<any>;

  /**
   * API call untuk mengupdate data
   */
  updateApi: (id: string | number, data: Partial<T>) => Promise<any>;

  /**
   * Skema field untuk form
   * Contoh: [{ name: 'nama_departemen', label: 'Nama Departemen', type: 'text' }]
   */
  formSchema: Array<{
    name: string;
    label: string;
    placeholder?: string;
    type?: any;
    required?: boolean;
    rules?: string;
  }>;

  /**
   * Icon component untuk ditampilkan di header
   */
  icon?: any;

  /**
   * Callback ketika data berhasil disimpan
   */
  onSuccess?: (data: any) => void;

  /**
   * Path untuk redirect setelah sukses
   * Default: back to previous page
   */
  redirectPath?: string;

  /**
   * Extract ID dari data untuk API call update
   * Default: 'id' atau field pertama yang berisi 'id'
   */
  idExtractor?: (data: T) => string | number;

  /**
   * Cleanup fields sebelum mengirim ke API
   * Default: tidak ada, hanya send as is
   */
  payloadProcessor?: (data: any) => any;
}

const props = withDefaults(
  defineProps<ResourceCreateEditPageProps<T>>(),
  {
    icon: null,
    redirectPath: undefined,
  }
);

const router = useRouter();
const { hasPermission } = usePermission();

// Get ID from route params for edit mode
const params = useParams({ strict: false });
const id = computed(() => {
  const routeId = params.value.id as string | undefined;
  console.log('Route params:', params.value, 'routeId:', routeId);
  return routeId && routeId !== 'undefined' ? String(routeId) : null;
});
const isEditMode = computed(() => !!id.value);

// Permission checks
const hasCreatePermission = computed(() => hasPermission(props.createPermission));
const hasUpdatePermission = computed(() => hasPermission(props.updatePermission));
const canAccess = computed(() => {
  if (isEditMode.value) return hasUpdatePermission.value;
  return hasCreatePermission.value;
});

// Redirect if no permission
onMounted(() => {
  if (!canAccess.value) {
    toast.error('Anda tidak memiliki akses untuk melakukan action ini.');
    router.history.back();
  }
});

// Setup form
const formId = ref<string | null>(id.value);

watch(() => id.value, (newId) => {
  formId.value = newId;
});

const form = useForm({
  api: {
    get: (formId.value && props.getApi) ? () => props.getApi!(formId.value!) : undefined,
    update: formId.value
      ? (_id, payload) => {
          const processed = props.payloadProcessor ? props.payloadProcessor(payload) : payload;
          const resourceId = props.idExtractor ? props.idExtractor(payload) : payload.id;
          return props.updateApi(resourceId, processed);
        }
      : undefined,
    create: (payload) => {
      const processed = props.payloadProcessor ? props.payloadProcessor(payload) : payload;
      return props.createApi(processed);
    },
  },
  onSuccess: (data) => {
    if (isEditMode.value) {
      toast.success('Data berhasil diperbarui');
    } else {
      toast.success('Data berhasil dibuat');
    }
    props.onSuccess?.(data);

    // Redirect after success
    if (props.redirectPath) {
      router.navigate({ to: props.redirectPath });
    } else {
      router.history.back();
    }
  },
  id: formId.value,
  immediate: true,
});

const { isLoading, isSaving } = form;

const title = computed(() => {
  if (isEditMode.value) return `Edit ${props.resourceName}`;
  return `Tambah ${props.resourceName}`;
});

const description = computed(() => {
  if (isEditMode.value) return `Perbarui informasi ${props.resourceName.toLowerCase()} di bawah ini.`;
  return `Masukkan detail ${props.resourceName.toLowerCase()} baru di sini.`;
});
</script>

<template>
  <div class="container mx-auto py-8 max-w-3xl">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <Spinner class="size-8" />
      <p class="text-muted-foreground animate-pulse">Memuat data {{ resourceName.toLowerCase() }}...</p>
    </div>

    <!-- No Permission State -->
    <div v-else-if="!canAccess" class="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <div class="bg-muted p-4 rounded-full">
        <span class="text-muted-foreground">🔒</span>
      </div>
      <h2 class="text-2xl font-bold">Akses Ditolak</h2>
      <p class="text-muted-foreground">Anda tidak memiliki permission untuk melakukan action ini.</p>
      <Button @click="router.history.back()">Kembali</Button>
    </div>

    <!-- Form Content -->
    <div v-else>
      <!-- Header -->
      <div class="flex items-center gap-4 mb-8">
        <Button @click="router.history.back()" variant="ghost" size="sm" class="px-2">
          <ArrowLeftIcon class="w-4 h-4" />
        </Button>
        <div class="flex-1">
          <h1 class="text-3xl font-bold tracking-tight">{{ title }}</h1>
          <p class="text-muted-foreground text-sm mt-1">{{ description }}</p>
        </div>
      </div>

      <!-- Form Card -->
      <Card class="border-none shadow-md">
        <CardHeader class="bg-muted/30 pb-4">
          <CardTitle class="flex items-center gap-2">
            <component v-if="icon" :is="icon" class="w-5 h-5 text-primary" />
            <span>{{ isEditMode ? 'Perbarui Data' : 'Data Baru' }}</span>
          </CardTitle>
        </CardHeader>
        <CardContent class="pt-6">
          <AppForm :form="form" @submit="form.save">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <AppFormField
                v-for="field in formSchema"
                :key="field.name"
                :name="field.name"
                :label="field.label"
                :placeholder="field.placeholder"
                :type="field.type"
                :class="{
                  'sm:col-span-2': field.name?.includes('keterangan') || field.name?.includes('description') || field.name?.includes('alamat'),
                }"
              />
            </div>

            <!-- Submit Button -->
            <div class="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                @click="router.history.back()"
                :disabled="isSaving"
              >
                Batal
              </Button>
              <Button
                type="submit"
                :disabled="isSaving"
                class="flex-1 sm:flex-none gap-2"
              >
                <template v-if="isSaving">
                  <Spinner class="w-4 h-4" />
                  Menyimpan...
                </template>
                <template v-else>
                  <SaveIcon class="w-4 h-4" />
                  {{ isEditMode ? 'Perbarui' : 'Simpan' }}
                </template>
              </Button>
            </div>
          </AppForm>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
