<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '@/lib/formatter'
import {
  ScissorsIcon,
  CheckCircle2Icon,
  PackageIcon,
  TruckIcon,
  HammerIcon
} from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    target: number
    cutting: number
    sewing: number
    qcPass: number
    packing: number
    shipped: number
    showOverallOnly?: boolean
  }>(),
  {
    showOverallOnly: false
  }
)

const hitungPersen = (val: number, targetVal: number) => {
  if (!targetVal || targetVal <= 0) return 0
  const p = (val / targetVal) * 100
  return parseFloat(Math.min(p, 100).toFixed(1))
}

const overallProgress = computed(() => {
  const t = props.target
  if (!t || t <= 0) return 0
  const sum = props.cutting + props.sewing + props.qcPass + props.packing + props.shipped
  const pct = (sum / (5 * t)) * 100
  return parseFloat(Math.min(pct, 100).toFixed(1))
})

const stages = computed(() => {
  const t = props.target
  return [
    {
      name: 'Cutting',
      label: 'Cutting',
      qty: props.cutting,
      percent: hitungPersen(props.cutting, t),
      color: 'from-blue-500 to-indigo-500',
      icon: ScissorsIcon,
      bgColor: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
    },
    {
      name: 'Sewing',
      label: 'Sewing',
      qty: props.sewing,
      percent: hitungPersen(props.sewing, t),
      color: 'from-indigo-500 to-violet-500',
      icon: HammerIcon,
      bgColor: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
    },
    {
      name: 'QC Pass',
      label: 'QC Finishing',
      qty: props.qcPass,
      percent: hitungPersen(props.qcPass, t),
      color: 'from-emerald-500 to-teal-500',
      icon: CheckCircle2Icon,
      bgColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
    },
    {
      name: 'Packing',
      label: 'Packing',
      qty: props.packing,
      percent: hitungPersen(props.packing, t),
      color: 'from-amber-500 to-orange-500',
      icon: PackageIcon,
      bgColor: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
    },
    {
      name: 'Shipped',
      label: 'Shipping / Pengiriman',
      qty: props.shipped,
      percent: hitungPersen(props.shipped, t),
      color: 'from-rose-500 to-pink-500',
      icon: TruckIcon,
      bgColor: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
    }
  ]
})
</script>

<template>
  <div class="space-y-6">
    <!-- Overall Progress Card -->
    <div class="p-5 rounded-2xl border bg-card/60 backdrop-blur-md shadow-sm relative overflow-hidden transition-all hover:shadow-md">
      <div class="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
        <PackageIcon class="w-40 h-40" />
      </div>
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 relative z-10">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Progres Global Produksi</span>
          <h4 class="text-lg font-bold text-foreground mt-0.5">Weighted Completion</h4>
        </div>
        <div class="text-left sm:text-right">
          <p class="text-xs text-muted-foreground">
            Target: <span class="font-bold text-foreground">{{ formatNumber(target) }} pcs</span>
          </p>
          <p class="text-xs text-muted-foreground mt-0.5">
            Shipped: <span class="font-bold text-foreground">{{ formatNumber(shipped) }} pcs</span>
          </p>
        </div>
      </div>

      <div class="flex items-center gap-4 mb-3 relative z-10">
        <div class="flex-1 h-3 bg-muted rounded-full overflow-hidden p-[1px] border border-border/50">
          <div
            class="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700 ease-out"
            :style="{ width: `${overallProgress}%` }"
          />
        </div>
        <span class="text-2xl font-black text-primary tracking-tight w-16 text-right leading-none">
          {{ overallProgress }}%
        </span>
      </div>
      <p class="text-[11px] text-muted-foreground/80 relative z-10">
        Dihitung berdasarkan rata-rata kumulatif progres 5 divisi produksi.
      </p>
    </div>

    <!-- Stages Breakdown -->
    <div v-if="!showOverallOnly" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div
        v-for="stage in stages"
        :key="stage.name"
        class="p-4 rounded-xl border bg-card/40 backdrop-blur-sm shadow-sm flex flex-col justify-between transition-all hover:translate-y-[-2px] hover:shadow-md"
      >
        <div class="flex items-start justify-between gap-2 mb-3">
          <div class="space-y-1">
            <span class="text-xs font-semibold text-muted-foreground block leading-none">{{ stage.label }}</span>
            <span class="text-lg font-bold text-foreground tracking-tight block">
              {{ formatNumber(stage.qty) }} <span class="text-[10px] font-normal text-muted-foreground">pcs</span>
            </span>
          </div>
          <div class="p-1.5 rounded-lg border" :class="stage.bgColor">
            <component :is="stage.icon" class="w-4 h-4" />
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="text-muted-foreground">Progres</span>
            <span class="font-bold text-foreground">{{ stage.percent }}%</span>
          </div>
          <div class="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r rounded-full transition-all duration-700 ease-out"
              :class="stage.color"
              :style="{ width: `${stage.percent}%` }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
