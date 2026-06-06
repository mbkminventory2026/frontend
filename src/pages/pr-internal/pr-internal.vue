<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, EyeIcon, CheckCircleIcon, ClipboardListIcon, FileTextIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getPRInternals, approvePRInternal, type PRInternalListItem } from '@/api/pr-internals/pr-internals';
import { prInternalSchema } from '@/pages/pr-internal/schema';

import DataTable from '@/components/DataTable.vue';
import { Button } from '@/components/ui/button';
import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { formatDate } from '@/lib/formatter';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

// ─── State ─────────────────────────────────────────────
const data = ref<PRInternalListItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

// ─── Confirm Approve Dialog ─────────────────────────────
const showApproveDialog = ref(false);
const approvingId = ref<number | null>(null);
const isApproving = ref(false);

const canCreate = computed(() => hasPermission('PO_INTERNAL_CREATE'));
const canApprove = computed(() => hasPermission('PR_APPROVE') || hasPermission('ALL_ACCESS'));

// ─── Fetch PR List ──────────────────────────────────────
const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';

        const response = await getPRInternals({
            limit: pageSize,
            offset: (page - 1) * pageSize,
            search: filter
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch PR Internals:", error);
    } finally {
        isLoading.value = false;
    }
};

// ─── Approve Handler ────────────────────────────────────
const openApproveDialog = (id: number) => {
    approvingId.value = id;
    showApproveDialog.value = true;
};

const cancelApprove = () => {
    approvingId.value = null;
    showApproveDialog.value = false;
};

const confirmApprove = async () => {
    if (approvingId.value === null) return;
    isApproving.value = true;
    try {
        await approvePRInternal(approvingId.value);
        toast.success('PR Internal berhasil disetujui!');
        showApproveDialog.value = false;
        approvingId.value = null;
        await fetchData();
    } catch (error: any) {
        toast.error(error.response?.data?.message || 'Gagal menyetujui PR Internal.');
    } finally {
        isApproving.value = false;
    }
};

// ─── Table ──────────────────────────────────────────────
const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID PR', accessorKey: 'id_pr_internal' },
        { header: 'Nama PR', accessorKey: 'nama' },
        { header: 'Tanggal', accessorKey: 'tanggal', cell: ({ row }) => formatDate(row.getValue('tanggal')) },
        { header: 'Vendor', accessorKey: 'vendor_name' },
        { header: 'Departemen', accessorKey: 'departemen' },
        { header: 'Projek', accessorKey: 'projek' },
        {
            header: 'Status',
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = (row.getValue('status') as string || '').toLowerCase();
                const isApproved = status === 'approved';
                return h('span', {
                    class: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`
                }, isApproved ? 'Approved' : 'Pending');
            }
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => {
                const id = row.getValue('id_pr_internal') as number;
                const status = (row.getValue('status') as string || '').toLowerCase();
                const isPending = status !== 'approved';

                return h('div', { class: 'flex gap-2 justify-center items-center' }, [
                    h(Button, {
                        variant: 'outline',
                        size: 'sm',
                        class: 'shadow-xs border-neutral-300',
                        onClick: () => router.navigate({ to: '/pr-internal/$id', params: { id: String(id) } })
                    }, () => [
                        h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                        'View'
                    ]),
                    ...(canApprove.value && isPending ? [
                        h(Button, {
                            variant: 'ghost',
                            size: 'sm',
                            class: 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50',
                            onClick: () => openApproveDialog(id)
                        }, () => [
                            h(CheckCircleIcon, { class: 'w-4 h-4 mr-1' }),
                            'Approve'
                        ])
                    ] : []),
                    ...(!isPending && canCreate.value ? [
                        h(Button, {
                            variant: 'outline',
                            size: 'sm',
                            class: 'shadow-xs border-neutral-300 text-neutral-700 hover:bg-neutral-50',
                            onClick: () => router.navigate({ to: '/po-internal/create', search: { prId: id } })
                        }, () => [
                            h(FileTextIcon, { class: 'w-4 h-4 mr-1' }),
                            'Jadikan PO'
                        ])
                    ] : [])
                ]);
            }
        }
    ],
    search: search,
    schema: prInternalSchema,
});

onMounted(() => { fetchData(); });
watch(() => search, () => { fetchData(); }, { deep: true });
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-neutral-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-neutral-50 border border-neutral-200/80 p-2.5 rounded-xl shadow-sm">
                    <ClipboardListIcon class="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-neutral-900">PR Internal</h1>
                    <p class="text-[13px] text-neutral-500 mt-1">Daftar Purchase Request Internal dan status persetujuan dokumen.</p>
                </div>
            </div>
            <div class="flex items-center gap-3" v-if="canCreate">
                <Button @click="router.navigate({ to: '/pr-internal/create' })" variant="outline" class="shadow-sm border-neutral-300">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Tambah PR Internal
                </Button>
            </div>
        </div>

        <!-- DataTable -->
        <DataTable
            :table="table"
            :is-loading="isLoading"
            v-model:search="searchTerm"
            @search="onSearch"
            @clear-filter="clearFilter"
        />

        <!-- Approve Confirm Dialog -->
        <Teleport to="body">
            <Transition name="modal-fade">
                <div v-if="showApproveDialog" class="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <!-- Backdrop -->
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="cancelApprove" />

                    <!-- Dialog -->
                    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md border border-neutral-200/80 p-6 z-10">
                        <div class="flex flex-col items-center text-center gap-4">
                            <div class="bg-emerald-100 border border-emerald-200 rounded-full p-4">
                                <CheckCircleIcon class="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h2 class="text-lg font-bold text-neutral-900">Konfirmasi Persetujuan</h2>
                                <p class="text-sm text-neutral-500 mt-2">
                                    Apakah Anda yakin ingin menyetujui PR Internal <span class="font-semibold text-neutral-800">#{{ approvingId }}</span>?
                                    Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                            <div class="flex gap-3 w-full pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    class="flex-1 border-neutral-300"
                                    @click="cancelApprove"
                                    :disabled="isApproving"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-sm"
                                    @click="confirmApprove"
                                    :disabled="isApproving"
                                >
                                    <CheckCircleIcon class="w-4 h-4 mr-2" v-if="!isApproving" />
                                    {{ isApproving ? 'Memproses...' : 'Ya, Setujui' }}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>
