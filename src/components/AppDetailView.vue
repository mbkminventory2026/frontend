<script setup lang="ts">
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
