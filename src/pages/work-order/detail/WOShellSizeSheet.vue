<script setup lang="ts">
import { Layers2Icon } from 'lucide-vue-next';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet';
import type { WorkOrderShell } from '@/api/work-orders/work-orders';

const props = defineProps<{
    isOpen: boolean;
    shell: WorkOrderShell | null;
}>();

const emit = defineEmits<{
    (e: 'update:isOpen', value: boolean): void;
}>();

const totalQty = (shell: WorkOrderShell) =>
    shell.sizes.reduce((acc, s) => acc + s.qty, 0);
</script>

<template>
    <Sheet :open="props.isOpen" @update:open="emit('update:isOpen', $event)">
        <SheetContent side="right" class="w-full sm:max-w-lg flex flex-col p-0 gap-0">
            <SheetHeader class="px-6 pt-6 pb-4 border-b border-neutral-200 bg-neutral-50/60">
                <div class="flex items-center gap-3">
                    <div class="bg-white border border-neutral-200 rounded-lg p-2 shadow-xs">
                        <Layers2Icon class="w-5 h-5 text-neutral-600" />
                    </div>
                    <div>
                        <SheetTitle class="text-base font-bold text-neutral-900">
                            {{ shell?.fabric || 'Shell' }} — {{ shell?.color || '' }}
                        </SheetTitle>
                        <SheetDescription class="text-xs text-neutral-500 mt-0.5">
                            Distribusi ukuran &amp; rasio untuk shell kain ini
                        </SheetDescription>
                    </div>
                </div>
            </SheetHeader>

            <!-- Shell Meta Info -->
            <div class="px-6 py-4 grid grid-cols-3 gap-4 border-b border-neutral-100 bg-white">
                <div>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Consumption</p>
                    <p class="font-mono font-semibold text-neutral-800 text-sm mt-0.5">{{ shell?.cons }} yd</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Allowance</p>
                    <p class="font-mono font-semibold text-neutral-800 text-sm mt-0.5">{{ shell?.allow }}%</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Berat / Yd</p>
                    <p class="font-mono font-semibold text-neutral-800 text-sm mt-0.5">{{ shell?.berat_1_yd }} kg</p>
                </div>
            </div>

            <!-- Sizes Table -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                        Size Chart
                    </h3>
                    <span v-if="shell" class="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-1 rounded-full">
                        Total: {{ totalQty(shell).toLocaleString('id-ID') }} pcs
                    </span>
                </div>

                <div v-if="!shell?.sizes || shell.sizes.length === 0"
                    class="text-center py-12 text-neutral-400 text-sm">
                    Tidak ada data ukuran.
                </div>

                <div v-else class="border border-neutral-200 rounded-xl overflow-hidden">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead class="bg-neutral-50 border-b border-neutral-200">
                            <tr>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Size</th>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Qty (pcs)</th>
                                <th class="px-4 py-2.5 text-[11px] font-bold text-neutral-500 uppercase tracking-wider text-right">Ratio</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100">
                            <tr
                                v-for="size in shell.sizes"
                                :key="size.id_wo_shell_size"
                                class="hover:bg-neutral-50/60 transition-colors"
                            >
                                <td class="px-4 py-3 font-semibold text-neutral-900">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 text-xs font-bold">
                                        {{ size.size }}
                                    </span>
                                </td>
                                <td class="px-4 py-3 font-mono font-medium text-neutral-800 text-right">
                                    {{ size.qty.toLocaleString('id-ID') }}
                                </td>
                                <td class="px-4 py-3 font-mono text-neutral-500 text-right">
                                    {{ size.ratio }}
                                </td>
                            </tr>
                        </tbody>
                        <!-- Footer Total -->
                        <tfoot class="bg-neutral-50 border-t-2 border-neutral-200">
                            <tr>
                                <td class="px-4 py-2.5 text-xs font-bold text-neutral-600 uppercase tracking-wider">Total</td>
                                <td class="px-4 py-2.5 font-mono font-bold text-neutral-900 text-right text-sm">
                                    {{ shell ? totalQty(shell).toLocaleString('id-ID') : 0 }}
                                </td>
                                <td class="px-4 py-2.5 font-mono text-neutral-400 text-right text-xs">
                                    —
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </SheetContent>
    </Sheet>
</template>
