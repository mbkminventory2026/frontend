<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

defineProps<{
  title: string
  value: string
  valueSuffix?: string
  subtitle: string
  showProgress?: boolean
  progressValue?: number
}>()
</script>

<template>
  <Card>
    <CardContent class="p-5 flex flex-col justify-between h-full">
      <p class="text-sm font-semibold text-muted-foreground mb-3">{{ title }}</p>
      <div>
        <p class="text-3xl font-bold text-foreground tracking-tight leading-none">
          {{ value }}
          <span v-if="valueSuffix" class="text-sm font-medium text-muted-foreground ml-1">{{ valueSuffix }}</span>
        </p>
        <Progress v-if="showProgress" :model-value="progressValue ?? 0" class="h-1.5 mt-3" />
        <p class="text-xs text-muted-foreground mt-2">{{ subtitle }}</p>
      </div>
    </CardContent>
  </Card>
</template>
