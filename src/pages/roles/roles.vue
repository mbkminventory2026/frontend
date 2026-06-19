<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useSearch, useRouter } from '@tanstack/vue-router';
import { PlusIcon, PencilIcon, EyeIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import {
    getRoles,
    getRoleById,
    updateRole,
    deleteRole,
} from '@/api/roles/roles';
import { getPermissions } from '@/api/permissions/permissions';
import { rolesSchema } from '@/pages/roles/schema';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';
import { useAuthStore } from '@/store/authStore';

const { hasPermission } = usePermission();
const authStore = useAuthStore();
const search = useSearch({ strict: false }) as any;
const router = useRouter();

const RESERVED_ROLES = [
    'SUPER_ADMIN',
    'ADMIN_SISTEM',
    'ADMIN_KEUANGAN',
    'ADMIN_PRODUKSI',
    'ADMIN_GUDANG',
    'MANAGER',
    'CLIENT'
];

const data = ref<any[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);

const permissionOptions = ref<{ label: string, value: string | number, code?: string, domain?: string, action?: string }[]>([]);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getRoles({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data roles:", error);
        toast.error("Gagal memuat data role");
    } finally {
        isLoading.value = false;
    }
}

const fetchPermissionOptions = async () => {
    try {
        const permRes = await getPermissions({ limit: 200, offset: 0 });
        permissionOptions.value = permRes.results.map(p => ({
            label: p.nama_halaman,
            value: p.id_hak_akses,
            code: p.kode_permission,
            domain: p.domain_permission,
            action: p.aksi_permission
        }));
    } catch (error) {
        console.error("Gagal fetch permissions:", error);
    }
}

// Edit dialog — only used for editing existing roles
const editDialog = useDialog({
    onSubmit: async (values) => {
        const payload = {
            nama_role: values.nama_role,
            hak_akses_ids: values.hak_akses_ids || []
        };
        return await updateRole(values.id_role, payload);
    },
    onSuccess: () => fetchData()
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: data,
    rowCount: totalCount,
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID Role', accessorKey: 'id_role' },
        { header: 'Nama Role', accessorKey: 'nama_role' },
        { header: 'Actions', id: 'actions', cell: ({ row }) => {
            const item = row.original;
            const buttons = [];

            // Details button
            buttons.push(h(Button, {
                variant: 'outline',
                size: 'sm',
                onClick: () => router.navigate({ to: '/roles/$id', params: { id: String(item.id_role) } } as any)
            }, () => [
                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                'View'
            ]));

            const isSuperAdmin = authStore.roleName === 'SUPER_ADMIN';
            const targetRoleName = item.nama_role;
            const canModify = isSuperAdmin || (
                targetRoleName !== 'SUPER_ADMIN' &&
                targetRoleName !== 'ADMIN_SISTEM' &&
                targetRoleName !== authStore.roleName
            );

            if (hasPermission('ROLE_UPDATE') && canModify) {
                buttons.push(h(Button, {
                    variant: 'ghost',
                    size: 'sm',
                    onClick: () => {
                        getRoleById(item.id_role).then((fullRole) => {
                            console.log("=== [DEBUG] EDIT ROLE CLICKED ===");
                            console.log("Nama Role:", item.nama_role);
                            console.log("Daftar ID Hak Akses:", fullRole.hak_akses_ids);
                            
                            // Map IDs to permission codes and details
                            const matchedPerms = (fullRole.hak_akses_ids || []).map(id => {
                                return permissionOptions.value.find(p => String(p.value) === String(id));
                            }).filter(Boolean) as any[];

                            console.log("Detail Hak Akses dari Database:", matchedPerms.map(p => ({
                                id: p.value,
                                kode: p.code,
                                nama_halaman: p.label
                            })));

                            // Determine active pages
                            const activePages: string[] = [];
                            matchedPerms.forEach(p => {
                                const code = p.code || '';
                                const isRead = code.endsWith('_READ') || code === 'INVENTORY_RECEIVE';
                                if (isRead) {
                                    activePages.push(`${p.label} [Kode: ${code}]`);
                                }
                            });
                            console.log("Halaman yang Aktif (memiliki akses GET/READ):", activePages);
                            console.log("=================================");

                            editDialog.openDialog({
                                ...item,
                                hak_akses_ids: fullRole.hak_akses_ids || []
                            });
                        }).catch((err) => {
                            console.error("Gagal fetch detail role:", err);
                            editDialog.openDialog(item);
                        });
                    }
                }, () => [
                    h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                    'Edit'
                ]));
            }

            const isReservedRole = RESERVED_ROLES.includes(item.nama_role.trim().toUpperCase());

            if (hasPermission('ROLE_DELETE') && canModify && !isReservedRole) {
                buttons.push(h(DeleteButton, {
                    onConfirm: async () => {
                        await deleteRole(item.id_role);
                        await fetchData();
                    },
                    confirmMessage: 'Apakah Anda yakin ingin menghapus Role ini?',
                    resourceName: 'Role'
                }));
            }

            if (buttons.length === 0) return h('span', { class: 'text-xs text-slate-400' }, '-');
            return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
        }}
    ],
    search: search,
    schema: rolesSchema,
});

const EditRoleDialogSchema = computed<DialogSchemaType>(() => [
    {
        key: "nama_role",
        label: "Nama Role",
        type: "text",
        placeholder: "Masukkan nama role (contoh: ADMIN_QC)",
        rules: "required",
        position: "full"
    },
    {
        key: "hak_akses_ids",
        label: "Hak Akses",
        type: "permissions-selector",
        placeholder: "Pilih hak akses untuk role ini",
        rules: "",
        options: permissionOptions.value,
        position: "full"
    }
]);

onMounted(() => {
    fetchData();
    fetchPermissionOptions();
})

watch(() => search, () => {
    fetchData();
}, { deep: true })
</script>

<template>
    <div class="flex flex-col bg-slate-50 min-h-screen">
        <div class="bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
                <h1 class="text-xl font-bold text-slate-900">Manajemen Role</h1>
                <p class="text-xs text-slate-500 mt-0.5">Kelola role dan hak akses yang diberikan kepada setiap role.</p>
            </div>
            <Button
                v-if="hasPermission('ROLE_CREATE')"
                @click="router.navigate({ to: '/roles/create' })"
            >
                <PlusIcon class="w-4 h-4 mr-2" />
                Tambah Role
            </Button>
        </div>

        <div class="flex-1 p-6">
            <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
                <DataTable
                    :table="table"
                    :is-loading="isLoading"
                    v-model:search="searchTerm"
                    @search="onSearch"
                    @clear-filter="clearFilter"
                />
            </div>
        </div>

        <!-- Edit Dialog (only for editing existing roles) -->
        <AppDialog
            title="Edit Role"
            description="Perbarui informasi role di bawah ini."
            :schema="EditRoleDialogSchema"
            :is-open="editDialog.isOpen.value"
            :initial-values="editDialog.initialValues.value"
            :submit-label="editDialog.isLoading.value ? 'Menyimpan...' : 'Update'"
            @update:is-open="editDialog.isOpen.value = $event"
            @submit="editDialog.handleSubmit"
        />
    </div>
</template>
