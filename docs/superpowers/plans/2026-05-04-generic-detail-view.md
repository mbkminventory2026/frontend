# Generic Detail View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a generic, schema-driven detail view component using shadcn-vue to standardize detail pages.

**Architecture:** Use a presentational "Dumb" component (`AppDetailView.vue`) that renders data based on a configuration schema (`DetailSchema`). A helper composable (`useDetail.ts`) will manage data fetching and loading states.

**Tech Stack:** Vue 3 (Composition API), TypeScript, TanStack Router, Lucide Vue Next, shadcn-vue.

---

### Task 1: Create Detail Schema Type

**Files:**
- Create: `src/schemas/detail/detail.ts`

- [ ] **Step 1: Define the Detail Schema types**

Create `src/schemas/detail/detail.ts` with the following content:

```typescript
import { type Component } from 'vue';

export type DetailFieldType = 'text' | 'date' | 'number' | 'currency' | 'badge' | 'file' | 'image';

export interface DetailField {
  key: string;
  label: string;
  type?: DetailFieldType;
  variant?: 'default' | 'file' | 'image';
  formatter?: (val: any) => string;
  icon?: Component;
  className?: string;
  span?: 'col-1' | 'col-2' | 'full';
}

export type DetailSchema = DetailField[];
```

- [ ] **Step 2: Commit**

```bash
git add src/schemas/detail/detail.ts
git commit -m "feat: add DetailSchema type definition"
```

---

### Task 2: Create AppDetailView Component

**Files:**
- Create: `src/components/AppDetailView.vue`

- [ ] **Step 1: Implement AppDetailView component**

Create `src/components/AppDetailView.vue` with support for schema-based rendering, loading states, and actions.

```vue
<script setup lang="ts">
import { computed } from 'vue';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Trash2, FileText, Download, ExternalLink } from 'lucide-vue-next';
import { type DetailSchema, type DetailField } from '@/schemas/detail/detail';
import { formatDate } from '@/lib/formatter';

interface Props {
  title: string;
  description?: string;
  data: Record<string, any> | null;
  schema: DetailSchema;
  isLoading?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showEdit: true,
  showDelete: true,
  isLoading: false,
});

const emit = defineEmits(['edit', 'delete']);

const formatValue = (field: DetailField, value: any) => {
  if (value === null || value === undefined) return '-';
  if (field.formatter) return field.formatter(value);
  
  switch (field.type) {
    case 'date':
      return formatDate(value);
    case 'currency':
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
    default:
      return value;
  }
};

const getGridSpan = (span?: string) => {
  switch (span) {
    case 'col-2': return 'md:col-span-2';
    case 'full': return 'md:col-span-full';
    default: return 'col-span-1';
  }
};
</script>

<template>
  <Card class="w-full">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-6">
      <div class="space-y-1.5">
        <CardTitle v-if="!isLoading">{{ title }}</CardTitle>
        <Skeleton v-else class="h-8 w-[200px]" />
        
        <CardDescription v-if="!isLoading && description">{{ description }}</CardDescription>
        <Skeleton v-else-if="isLoading" class="h-4 w-[300px] mt-2" />
      </div>
      
      <div class="flex gap-2" v-if="!isLoading">
        <slot name="header-actions"></slot>
        <Button v-if="showEdit" variant="outline" size="sm" @click="emit('edit')">
          <Pencil class="w-4 h-4 mr-2" />
          Edit
        </Button>
        <Button v-if="showDelete" variant="destructive" size="sm" @click="emit('delete')">
          <Trash2 class="w-4 h-4 mr-2" />
          Delete
        </Button>
      </div>
    </CardHeader>
    
    <CardContent>
      <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="i in 6" :key="i" class="space-y-2">
          <Skeleton class="h-4 w-[100px]" />
          <Skeleton class="h-6 w-full" />
        </div>
      </div>
      
      <div v-else-if="data" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          v-for="field in schema" 
          :key="field.key" 
          :class="[getGridSpan(field.span), field.className]"
          class="space-y-1"
        >
          <div class="flex items-center text-sm font-medium text-muted-foreground">
            <component :is="field.icon" v-if="field.icon" class="w-4 h-4 mr-2" />
            {{ field.label }}
          </div>
          
          <div class="text-base font-semibold">
            <slot :name="`item-${field.key}`" :value="data[field.key]" :data="data">
              <!-- File Variant -->
              <template v-if="field.type === 'file' || field.variant === 'file'">
                <div v-if="data[field.key]" class="flex items-center p-2 rounded-md border bg-muted/50 w-fit">
                  <FileText class="w-5 h-5 mr-3 text-blue-500" />
                  <div class="flex flex-col mr-6">
                    <span class="text-sm truncate max-w-[200px]">{{ data[field.key] }}</span>
                  </div>
                  <div class="flex gap-1">
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <Download class="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" class="h-8 w-8">
                      <ExternalLink class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <span v-else>-</span>
              </template>
              
              <!-- Default -->
              <template v-else>
                {{ formatValue(field, data[field.key]) }}
              </template>
            </slot>
          </div>
        </div>
      </div>
      
      <div v-else class="flex justify-center py-12 text-muted-foreground">
        Data tidak ditemukan.
      </div>
    </CardContent>
  </Card>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/AppDetailView.vue
git commit -m "feat: add AppDetailView generic component"
```

---

### Task 3: Create useDetail Composable

**Files:**
- Create: `src/composables/useDetail.ts`

- [ ] **Step 1: Implement useDetail composable**

Create `src/composables/useDetail.ts` to standardize data fetching for detail pages.

```typescript
import { ref, onMounted } from 'vue';

interface UseDetailOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  immediate?: boolean;
}

export function useDetail<T>(
  fetchFn: (id: string | number) => Promise<T>,
  id: string | number,
  options: UseDetailOptions<T> = {}
) {
  const data = ref<T | null>(null) as any;
  const isLoading = ref(false);
  const error = ref<any>(null);

  const fetchData = async () => {
    if (!id) return;
    
    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetchFn(id);
      data.value = result;
      options.onSuccess?.(result);
    } catch (e) {
      error.value = e;
      options.onError?.(e);
      console.error("Fetch detail error:", e);
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  });

  return {
    data,
    isLoading,
    error,
    fetchData,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/composables/useDetail.ts
git commit -m "feat: add useDetail composable"
```

---

### Task 4: Implement Example Detail Page (Report Pengiriman)

**Files:**
- Create: `src/pages/reportPengiriman/detail/page.vue`
- Modify: `src/routes/_authenticated/report-pengiriman.$id.ts`

- [ ] **Step 1: Ensure the route is correctly set up**

Check `src/routes/_authenticated/report-pengiriman.$id.ts` to point to the new page component.

```typescript
// Assume this file exists and needs to point to the component
import { createFileRoute } from '@tanstack/vue-router'
import ReportPengirimanDetailPage from '@/pages/reportPengiriman/detail/page.vue'

export const Route = createFileRoute('/_authenticated/report-pengiriman/$id')({
  component: ReportPengirimanDetailPage,
})
```

- [ ] **Step 2: Implement the Detail Page**

Create `src/pages/reportPengiriman/detail/page.vue`.

```vue
<script setup lang="ts">
import { useRoute } from '@tanstack/vue-router';
import { getReportPengirimanById, deleteReportPengiriman } from '@/api/reportPengiriman/reportPengiriman';
import { useDetail } from '@/composables/useDetail';
import { useDelete } from '@/composables/useDelete';
import { useRouter } from '@tanstack/vue-router';
import AppDetailView from '@/components/AppDetailView.vue';
import { type DetailSchema } from '@/schemas/detail/detail';
import { Calendar, Package, Hash, Layers } from 'lucide-vue-next';

const route = useRoute({ from: '/_authenticated/report-pengiriman/$id' });
const router = useRouter();
const id = route.params.id;

const { data, isLoading } = useDetail(
  (id) => getReportPengirimanById(Number(id)),
  id
);

const { deleteItem } = useDelete({
  onSuccess: () => {
    router.navigate({ to: '/report-pengiriman' });
  }
});

const schema: DetailSchema = [
  { 
    key: 'id_report_pengiriman', 
    label: 'ID Report', 
    icon: Hash 
  },
  { 
    key: 'date', 
    label: 'Tanggal Pengiriman', 
    type: 'date',
    icon: Calendar 
  },
  { 
    key: 'id_wo_shell_size', 
    label: 'ID WO Shell Size', 
    icon: Layers 
  },
  { 
    key: 'quantity', 
    label: 'Kuantitas', 
    type: 'number',
    icon: Package,
    className: 'text-primary'
  },
  {
    key: 'file_lampiran', // Contoh field file
    label: 'Lampiran',
    type: 'file',
    span: 'full'
  }
];

const handleEdit = () => {
  console.log("Navigating to edit page for ID:", id);
  // router.navigate({ to: `/report-pengiriman/${id}/edit` });
};

const handleDelete = () => {
  deleteItem(async () => {
    await deleteReportPengiriman(Number(id));
  }, "Apakah Anda yakin ingin menghapus laporan pengiriman ini?");
};
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
       <Button variant="ghost" @click="router.history.back()">
         &larr; Kembali ke Daftar
       </Button>
    </div>

    <AppDetailView
      title="Detail Laporan Pengiriman"
      description="Informasi lengkap mengenai laporan pengiriman barang."
      :data="data"
      :schema="schema"
      :is-loading="isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/reportPengiriman/detail/page.vue
git commit -m "feat: implement report pengiriman detail page using AppDetailView"
```
