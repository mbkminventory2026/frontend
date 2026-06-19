<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { CheckIcon, ChevronDownIcon } from 'lucide-vue-next';

export interface SelectOption {
  value: string;
  label: string;
}

const props = withDefaults(defineProps<{
  modelValue: string;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  inputClass?: string;
}>(), {
  placeholder: 'Pilih...',
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const triggerRef = ref<HTMLButtonElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const searchInputRef = ref<HTMLInputElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue);
  return found?.label ?? '';
});

const filteredOptions = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  if (!q) return props.options;
  return props.options.filter(o => o.label.toLowerCase().includes(q));
});

const calcPosition = () => {
  const el = triggerRef.value;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropdownMaxH = 220;

  if (spaceBelow >= dropdownMaxH || spaceBelow >= 120) {
    dropdownStyle.value = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(dropdownMaxH, spaceBelow - 8)}px`,
    };
  } else {
    dropdownStyle.value = {
      position: 'fixed',
      bottom: `${window.innerHeight - rect.top + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      maxHeight: `${Math.min(dropdownMaxH, rect.top - 8)}px`,
    };
  }
};

const open = () => {
  if (props.disabled) return;
  calcPosition();
  isOpen.value = true;
  searchQuery.value = '';
};

const close = () => {
  isOpen.value = false;
  searchQuery.value = '';
};

const select = (value: string) => {
  emit('update:modelValue', value);
  close();
};

const onOutsideClick = (e: MouseEvent) => {
  const target = e.target as Node;
  if (triggerRef.value?.contains(target)) return;
  if (dropdownRef.value?.contains(target)) return;
  close();
};

const onScroll = (e: Event) => {
  if (dropdownRef.value?.contains(e.target as Node)) return;
  close();
};

watch(isOpen, async (val) => {
  if (val) {
    document.addEventListener('mousedown', onOutsideClick);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', close);
    await nextTick();
    searchInputRef.value?.focus();
  } else {
    document.removeEventListener('mousedown', onOutsideClick);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', close);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onOutsideClick);
  window.removeEventListener('scroll', onScroll, true);
  window.removeEventListener('resize', close);
});
</script>

<template>
  <div class="relative w-full min-w-0">
    <!-- Trigger -->
    <button
      ref="triggerRef"
      type="button"
      :disabled="disabled"
      @click="open"
      :class="[
        'w-full flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-left transition h-9',
        'focus:outline-none focus:ring-2 focus:ring-neutral-900/20 focus:border-neutral-400',
        disabled ? 'bg-neutral-50 text-neutral-400 cursor-not-allowed' : 'cursor-pointer hover:border-neutral-300',
        isOpen ? 'border-neutral-400 ring-2 ring-neutral-900/20' : '',
        inputClass,
      ]"
    >
      <span class="truncate" :class="selectedLabel ? 'text-neutral-800' : 'text-neutral-400'">
        {{ selectedLabel || placeholder }}
      </span>
      <ChevronDownIcon class="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-1" />
    </button>

    <!-- Dropdown via Teleport to avoid overflow-hidden clipping -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        :style="dropdownStyle"
        class="z-[9999] rounded-lg border border-neutral-200 bg-white shadow-xl overflow-hidden flex flex-col"
      >
        <!-- Search -->
        <div class="p-1.5 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            placeholder="Cari..."
            class="w-full rounded border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900/30"
            @keydown.esc="close"
          />
        </div>

        <!-- Options -->
        <div class="overflow-y-auto">
          <!-- Clear option -->
          <button
            type="button"
            @click="select('')"
            class="w-full text-left px-3 py-2 text-xs text-neutral-400 hover:bg-neutral-50 transition flex items-center justify-between"
            :class="{ 'bg-neutral-50': !modelValue }"
          >
            <span>{{ placeholder }}</span>
            <CheckIcon v-if="!modelValue" class="w-3 h-3 shrink-0" />
          </button>

          <div v-if="filteredOptions.length === 0" class="px-3 py-2 text-xs text-neutral-400 text-center">
            Tidak ada pilihan ditemukan
          </div>

          <button
            v-for="option in filteredOptions"
            :key="option.value"
            type="button"
            @click="select(option.value)"
            class="w-full text-left px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-100 transition flex items-center justify-between gap-2"
            :class="{ 'bg-neutral-50 font-semibold text-neutral-900': modelValue === option.value }"
          >
            <span class="truncate">{{ option.label }}</span>
            <CheckIcon v-if="modelValue === option.value" class="w-3 h-3 text-neutral-700 shrink-0" />
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>
