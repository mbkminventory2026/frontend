<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'

export interface ChartBar {
  label: string
  value: number
  percent: number
}

defineProps<{
  data: ChartBar[]
}>()

const formatAngka = (n: number) => new Intl.NumberFormat('id-ID').format(n)
</script>

<template>
  <Card class="h-full">
    <CardContent class="p-5 h-full flex flex-col">
      <div class="flex items-end justify-between gap-3 flex-1 min-h-[160px]">
        <div
          v-for="item in data"
          :key="item.label"
          class="flex flex-col items-center flex-1 h-full justify-end"
        >
          <span class="text-[11px] font-semibold text-muted-foreground mb-1.5">
            {{ formatAngka(item.value) }}
          </span>
          <div
            class="w-full max-w-[40px] mx-auto bg-primary rounded-t transition-all duration-500"
            :style="{ height: `${Math.max(item.percent, 5)}%` }"
          />
        </div>
      </div>
      <div class="flex justify-between gap-3 mt-3 border-t pt-3">
        <div
          v-for="item in data"
          :key="item.label"
          class="flex-1 text-center"
        >
          <span class="text-xs font-medium text-muted-foreground">{{ item.label }}</span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
