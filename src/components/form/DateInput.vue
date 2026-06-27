<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverPortal, PopoverContent } from 'reka-ui'
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import { toISO, fromISO, buildMonthGrid } from '@/lib/dateGrid'

// Cross-browser date picker. v-model is a LOCAL yyyy-mm-dd string, identical to
// what <input type="date"> produced, so existing payload mapping is unchanged.
const props = defineProps<{
  modelValue?: string | null
  class?: any
  disabled?: boolean
  placeholder?: string
  id?: string
  ariaInvalid?: boolean | 'true' | 'false'
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const open = ref(false)
const selected = computed(() => fromISO(props.modelValue ?? ''))
const viewDate = ref(selected.value ?? new Date())

// Reset the visible month to the selected date (or today) each time it opens
watch(open, (o) => { if (o) viewDate.value = selected.value ?? new Date() })

const grid = computed(() => buildMonthGrid(viewDate.value))
const monthLabel = computed(() =>
  viewDate.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
)
const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const todayISO = toISO(new Date())

const label = computed(() =>
  selected.value
    ? selected.value.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    : (props.placeholder || 'Pilih tanggal'),
)

function prevMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() - 1, 1)
}
function nextMonth() {
  viewDate.value = new Date(viewDate.value.getFullYear(), viewDate.value.getMonth() + 1, 1)
}
function pick(d: Date) {
  emit('update:modelValue', toISO(d))
  open.value = false
}
function inMonth(d: Date) {
  return d.getMonth() === viewDate.value.getMonth()
}
</script>

<template>
  <PopoverRoot v-model:open="open">
    <PopoverTrigger as-child :disabled="disabled">
      <button
        :id="id"
        type="button"
        :disabled="disabled"
        :aria-invalid="ariaInvalid"
        :class="cn(
          'border-input flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
          !selected && 'text-muted-foreground',
          props.class,
        )"
      >
        <span class="truncate">{{ label }}</span>
        <CalendarIcon class="size-4 shrink-0 opacity-60" />
      </button>
    </PopoverTrigger>
    <PopoverPortal>
      <PopoverContent
        align="start"
        :side-offset="4"
        class="z-50 w-auto rounded-md border border-slate-200 bg-white p-3 text-slate-900 shadow-md"
      >
        <div class="flex items-center justify-between px-1 pb-2">
          <button type="button" class="rounded p-1 hover:bg-slate-100" @click="prevMonth">
            <ChevronLeftIcon class="size-4" />
          </button>
          <span class="text-sm font-semibold capitalize">{{ monthLabel }}</span>
          <button type="button" class="rounded p-1 hover:bg-slate-100" @click="nextMonth">
            <ChevronRightIcon class="size-4" />
          </button>
        </div>
        <div class="grid grid-cols-7 gap-0.5">
          <div
            v-for="w in weekdays"
            :key="w"
            class="py-1 text-center text-[11px] font-medium text-slate-400"
          >
            {{ w }}
          </div>
          <button
            v-for="d in grid"
            :key="toISO(d)"
            type="button"
            @click="pick(d)"
            :class="[
              'size-8 rounded text-sm transition-colors',
              inMonth(d) ? 'text-slate-800 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50',
              toISO(d) === modelValue ? 'bg-indigo-600 text-white hover:bg-indigo-600' : '',
              toISO(d) === todayISO && toISO(d) !== modelValue ? 'border border-indigo-400' : '',
            ]"
          >
            {{ d.getDate() }}
          </button>
        </div>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>
