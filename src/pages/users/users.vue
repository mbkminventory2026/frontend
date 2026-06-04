<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useNavigate, useSearch } from '@tanstack/vue-router';
import { PlusIcon, PencilIcon, CheckIcon, XIcon, CopyIcon, KeyRoundIcon, AlertTriangleIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

import { 
    getUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    approveUser, 
    rejectUser,
    assignUserRole,
    type UserResponseItem 
} from '@/api/users/users';
import { getDepartemen } from '@/api/departemen/departemen';
import { getMitra } from '@/api/mitra/mitra';
import { getRoles } from '@/api/roles/roles';
import { usersSchema } from '@/routes/_authenticated/users.index';

import DataTable from '@/components/DataTable.vue';
import AppDialog from '@/components/AppDialog.vue';
import { Button } from '@/components/ui/button';

import { usePermission } from '@/composables/usePermission';
import { useTable } from '@/composables/useTable';
import { useDialog } from '@/composables/useDialog';
import { type DialogSchemaType } from '@/schemas/dialog/dialog';
import { formatDate } from '@/lib/formatter';
import DeleteButton from '@/components/DeleteButton.vue';

const { hasPermission } = usePermission();
const search = useSearch({ strict: false }) as any;
const navigate = useNavigate();

const data = ref<UserResponseItem[]>([]);
const totalCount = ref(0);
const isLoading = ref(false);
const currentStatusTab = ref<string>('all');

const departemenOptions = ref<{ label: string, value: string | number }[]>([]);
const mitraOptions = ref<{ label: string, value: string | number }[]>([]);
const roleOptions = ref<{ label: string, value: string | number }[]>([]);

const fetchData = async () => {
    isLoading.value = true;
    try {
        const page = search.value?.page ?? 1;
        const pageSize = search.value?.pageSize ?? 20;
        const filter = search.value?.filter ?? '';
        const sortBy = search.value?.sortBy;
        const sortDesc = search.value?.sortDesc ?? false;

        const response = await getUsers({
            page,
            pageSize,
            search: filter,
            sortBy,
            sortDesc
        });

        data.value = response.results;
        totalCount.value = response.count;
    } catch (error) {
        console.error("Gagal fetch data users:", error);
        toast.error("Gagal memuat data pengguna");
    } finally {
        isLoading.value = false;
    }
}

const fetchDropdowns = async () => {
    try {
        const deptRes = await getDepartemen({ limit: 100, offset: 0 });
        departemenOptions.value = deptRes.results.map(d => ({
            label: d.nama_departemen,
            value: d.id_departemen
        }));

        const mitraRes = await getMitra({ limit: 100, offset: 0 });
        mitraOptions.value = mitraRes.results.map(m => ({
            label: m.nama_perusahaan,
            value: m.id_mitra
        }));

        const rolesRes = await getRoles({ limit: 100, offset: 0 });
        roleOptions.value = rolesRes.results.map((r: any) => ({
            label: r.nama_role,
            value: r.id_role
        }));
    } catch (error) {
        console.error("Gagal fetch dropdowns:", error);
    }
}

const handleApprove = async (id: number) => {
    try {
        await approveUser(id);
        toast.success("Pengguna berhasil disetujui!");
        fetchData();
    } catch (error) {
        console.error("Gagal menyetujui pengguna:", error);
        toast.error("Gagal menyetujui pendaftaran pengguna");
    }
}

const handleReject = async (id: number) => {
    try {
        await rejectUser(id);
        toast.success("Pengguna berhasil ditolak!");
        fetchData();
    } catch (error) {
        console.error("Gagal menolak pengguna:", error);
        toast.error("Gagal menolak pendaftaran pengguna");
    }
}

const createDialog = useDialog({
    onSubmit: async (values, isEdit) => {
        const payload = { ...values };
        if (!payload.password) {
            delete payload.password;
        }
        if (payload.user_type === 'Karyawan') {
            payload.id_mitra = null;
        } else if (payload.user_type === 'Mitra') {
            payload.id_departemen = null;
        }
        const selectedRoleId = payload.id_role;
        delete payload.user_type;

        if (isEdit) {
            const originalRoleId = createDialog.initialValues.value?.id_role;
            const result = await updateUser(values.id_user, payload);
            if (selectedRoleId && selectedRoleId !== originalRoleId) {
                await assignUserRole(values.id_user, selectedRoleId);
            }
            return result;
        } else {
            return await createUser(payload);
        }
    },
    onSuccess: (result) => {
        if (result?.temporary_password) {
            generatedTempPassword.value = result.temporary_password;
            generatedTempUsername.value = result.username || 'User';
            isTempPasswordModalOpen.value = true;
            isCopied.value = false;
            toast.success('User berhasil ditambahkan!');
        } else {
            toast.success(createDialog.isEditMode.value ? 'Pengguna berhasil diupdate!' : 'Pengguna berhasil ditambahkan!');
        }
        fetchData();
    } 
});

// Temporary password display modal state
const generatedTempPassword = ref('');
const generatedTempUsername = ref('');
const isTempPasswordModalOpen = ref(false);
const isCopied = ref(false);

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(generatedTempPassword.value);
        isCopied.value = true;
        toast.success('Password berhasil disalin!');
        setTimeout(() => {
            isCopied.value = false;
        }, 2000);
    } catch (err) {
        toast.error('Gagal menyalin password ke clipboard');
    }
};

const filteredData = computed(() => {
    if (currentStatusTab.value === 'all') {
        return data.value;
    }
    return data.value.filter(u => u.status === currentStatusTab.value);
});

const { table, searchTerm, onSearch, clearFilter } = useTable({
    data: filteredData,
    rowCount: computed(() => filteredData.value.length),
    columns: [
        { header: 'Created At', accessorKey: 'created_at', cell: ({ row }) => formatDate(row.getValue('created_at')) },
        { header: 'ID User', accessorKey: 'id_user' },
        { header: 'Username', accessorKey: 'username' },
        { 
            header: 'Status', 
            accessorKey: 'status',
            cell: ({ row }) => {
                const status = row.getValue('status') as string;
                let bgClass = 'bg-slate-100 text-slate-800';
                if (status === 'active') bgClass = 'bg-green-100 text-green-800 border-green-200 border';
                if (status === 'pending') bgClass = 'bg-yellow-100 text-yellow-800 border-yellow-200 border animate-pulse';
                if (status === 'rejected') bgClass = 'bg-red-100 text-red-800 border-red-200 border';
                
                return h('span', { 
                    class: `px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${bgClass}` 
                }, status);
            }
        },
        { 
            header: 'Role', 
            accessorKey: 'nama_role',
            cell: ({ row }) => {
                const roleName = row.getValue('nama_role') as string;
                return h('span', { 
                    class: 'px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800' 
                }, roleName || '-');
            }
        },
        {
            header: 'Entitas / Hubungan',
            accessorKey: 'nama_departemen',
            cell: ({ row }) => {
                const dept = row.original.nama_departemen;
                const company = row.original.nama_perusahaan;
                if (dept) {
                    return h('span', { class: 'text-xs text-slate-600 bg-blue-50 px-2 py-1 rounded' }, `Karyawan (${dept})`);
                }
                if (company) {
                    return h('span', { class: 'text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded' }, `Mitra (${company})`);
                }
                return h('span', { class: 'text-xs text-slate-400' }, '-');
            }
        },
        { 
            header: 'Actions', 
            id: 'actions', 
            cell: ({ row }) => {
                const item = row.original;
                const buttons = [];
                
                if (item.status === 'pending') {
                    if (hasPermission('USER_APPROVE')) {
                        buttons.push(
                            h(Button, { 
                                variant: 'outline',
                                size: 'sm',
                                class: 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 mr-2',
                                onClick: () => handleApprove(item.id_user) 
                            }, () => [
                                h(CheckIcon, { class: 'w-4 h-4 mr-1' }),
                                'Setujui'
                            ]),
                            h(Button, { 
                                variant: 'outline',
                                size: 'sm',
                                class: 'border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700',
                                onClick: () => handleReject(item.id_user) 
                            }, () => [
                                h(XIcon, { class: 'w-4 h-4 mr-1' }),
                                'Tolak'
                            ])
                        );
                    }
                } else {
                    if (hasPermission('USER_UPDATE')) {
                        buttons.push(
                            h(Button, { 
                                variant: 'ghost',
                                size: 'sm',
                                onClick: () => {
                                    const mappedData = {
                                        ...item,
                                        user_type: item.id_departemen ? 'Karyawan' : 'Mitra',
                                        id_departemen: item.id_departemen ? item.id_departemen : undefined,
                                        id_mitra: item.id_mitra ? item.id_mitra : undefined,
                                        id_role: item.id_role
                                    };
                                    createDialog.openDialog(mappedData);
                                }
                            }, () => [
                                h(PencilIcon, { class: 'w-4 h-4 mr-1' }),
                                'Edit'
                            ])
                        );
                    }
                    if (hasPermission('USER_DELETE')) {
                        buttons.push(
                            h(DeleteButton, {
                                onConfirm: async () => {
                                    await deleteUser(item.id_user);
                                    await fetchData();
                                },
                                confirmMessage: 'Apakah Anda yakin ingin menghapus Pengguna ini?'
                            })
                        );
                    }
                }

                if (buttons.length === 0) return h('span', { class: 'text-xs text-slate-400' }, '-');
                return h('div', { class: 'flex gap-2 justify-center items-center' }, buttons);
            } 
        }
    ],
    search: search,
    schema: usersSchema,
});

const UserDialogSchema = computed<DialogSchemaType>(() => {
    const isEdit = createDialog.isEditMode.value;
    
    return [
        {
            key: "username",
            label: "Username",
            type: "text",
            placeholder: "Masukkan username",
            rules: "required",
            position: "left"
        },
        {
            key: "password",
            label: "Password",
            type: "password",
            placeholder: isEdit ? "Biarkan kosong jika tidak diubah" : "Kosongkan untuk generate otomatis",
            rules: "",
            position: "right"
        },
        {
            key: "user_type",
            label: "Jenis Pengguna",
            type: "select",
            placeholder: "Pilih jenis pengguna",
            rules: "required",
            options: [
                { label: "Karyawan Internal", value: "Karyawan" },
                { label: "Mitra Eksternal (Client/Supplier)", value: "Mitra" }
            ],
            position: "full"
        },
        {
            key: "id_departemen",
            label: "Departemen",
            type: "select",
            placeholder: "Pilih departemen",
            rules: "required",
            options: departemenOptions.value,
            dependency: {
                parentKey: "user_type",
                condition: "===",
                value: "Karyawan",
                action: "show"
            },
            position: "full"
        },
        {
            key: "id_mitra",
            label: "Mitra Perusahaan",
            type: "select",
            placeholder: "Pilih mitra perusahaan",
            rules: "required",
            options: mitraOptions.value,
            dependency: {
                parentKey: "user_type",
                condition: "===",
                value: "Mitra",
                action: "show"
            },
            position: "full"
        },
        {
            key: "id_role",
            label: "Role",
            type: "select",
            placeholder: "Pilih role pengguna",
            rules: "required",
            options: roleOptions.value,
            position: "full",
            dependency: {
                parentKey: "user_type",
                condition: "in",
                value: "Karyawan,Mitra",
                action: "show"
            }
        }
    ];
});

onMounted(() => {
    fetchData();
    fetchDropdowns();
})

watch(() => search, () => {
    fetchData();
}, { deep: true })
</script>

<template>
    <div class="flex flex-col bg-slate-50 min-h-screen">
        <!-- Dashboard Header -->
        <div class="bg-white border-b px-6 py-4 flex justify-between items-center">
            <div>
                <h1 class="text-xl font-bold text-slate-900">Manajemen Akses & Pengguna</h1>
                <p class="text-xs text-slate-500 mt-0.5">Kelola verifikasi pendaftaran mitra eksternal dan hak akses karyawan.</p>
            </div>
            <div class="flex gap-2">
                <Button
                    v-if="hasPermission('PASSWORD_RESET_REQUEST_READ')"
                    variant="outline"
                    @click="navigate({ to: '/password-reset-requests' as any })"
                >
                    Permintaan Reset Password
                </Button>
                <Button v-if="hasPermission('USER_CREATE')" @click="createDialog.openDialog()" class="bg-indigo-600 hover:bg-indigo-700">
                    <PlusIcon class="w-4 h-4 mr-2" />
                    Tambah Karyawan
                </Button>
            </div>
        </div>

        <!-- Filter Status Tab Bar -->
        <div class="flex border-b border-slate-200 px-6 bg-white">
            <button 
                v-for="tab in ['all', 'active', 'pending', 'rejected']" 
                :key="tab"
                @click="currentStatusTab = tab"
                :class="[
                    'px-4 py-3 text-sm font-semibold border-b-2 capitalize transition-all duration-200 relative',
                    currentStatusTab === tab 
                        ? 'border-indigo-600 text-indigo-600' 
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                ]"
            >
                <span class="flex items-center gap-1.5">
                    {{ tab === 'all' ? 'Semua User' : tab === 'pending' ? 'Menunggu Persetujuan' : tab }}
                    <span 
                        v-if="tab === 'pending' && data.filter(u => u.status === 'pending').length > 0"
                        class="bg-yellow-500 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center animate-pulse"
                    >
                        {{ data.filter(u => u.status === 'pending').length }}
                    </span>
                </span>
            </button>
        </div>

        <!-- DataTable Container -->
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

        <AppDialog
            :title="createDialog.isEditMode.value ? 'Edit Pengguna' : 'Tambah Karyawan Baru'"
            description="Isi kredensial akun pengguna di bawah ini."
            :schema="UserDialogSchema"
            :is-open="createDialog.isOpen.value"
            :initial-values="createDialog.initialValues.value"
            :submit-label="createDialog.isLoading.value ? 'Sending...' : (createDialog.isEditMode.value ? 'Update' : 'Create')"
            @update:is-open="createDialog.isOpen.value = $event"
            @submit="createDialog.handleSubmit"
        />

        <!-- Generated Temporary Password Modal -->
        <Dialog :open="isTempPasswordModalOpen" @update:open="isTempPasswordModalOpen = $event">
            <DialogContent class="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-xl p-6">
                <DialogHeader class="flex flex-col items-center text-center space-y-2">
                    <div class="bg-amber-50 p-3 rounded-full border border-amber-200">
                        <KeyRoundIcon class="w-8 h-8 text-amber-600 animate-pulse" />
                    </div>
                    <DialogTitle class="text-xl font-bold text-slate-900">Karyawan Baru Terdaftar</DialogTitle>
                    <DialogDescription class="text-xs text-slate-500">
                        Akun pengguna untuk <strong>{{ generatedTempUsername }}</strong> berhasil dibuat dengan password acak.
                    </DialogDescription>
                </DialogHeader>

                <div class="mt-4 space-y-4">
                    <!-- Password display box -->
                    <div class="flex items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg font-mono text-base font-bold text-slate-800">
                        <span class="select-all tracking-wide break-all">{{ generatedTempPassword }}</span>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            class="flex-shrink-0 border-slate-300 hover:bg-slate-100"
                            @click="copyToClipboard"
                        >
                            <component :is="isCopied ? CheckIcon : CopyIcon" class="w-4 h-4 mr-1.5" :class="isCopied ? 'text-green-600' : 'text-slate-600'" />
                            {{ isCopied ? 'Disalin' : 'Salin' }}
                        </Button>
                    </div>

                    <!-- Alert box -->
                    <div class="flex items-start gap-2.5 p-3.5 bg-amber-50 border border-amber-100 rounded-lg text-amber-800">
                        <AlertTriangleIcon class="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div class="text-xs space-y-1">
                            <p class="font-bold">Perhatian Penting:</p>
                            <p class="leading-relaxed">Salin dan bagikan password sementara ini secara aman kepada pengguna. Password ini <strong>hanya muncul satu kali ini saja</strong> dan tidak dapat dipulihkan atau dilihat kembali setelah menutup dialog.</p>
                        </div>
                    </div>
                </div>

                <div class="mt-6 flex justify-end">
                    <Button
                        type="button"
                        class="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-6"
                        @click="isTempPasswordModalOpen = false"
                    >
                        Selesai & Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
