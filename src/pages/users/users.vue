<script setup lang="ts">
import { h, ref, watch, onMounted, computed } from 'vue';
import { useNavigate, useSearch } from '@tanstack/vue-router';
import { PlusIcon, PencilIcon, CheckIcon, XIcon, CopyIcon, KeyRoundIcon, AlertTriangleIcon, EyeIcon, Building2Icon } from 'lucide-vue-next';
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
import { getMitra, getMitraById } from '@/api/mitra/mitra';
import { getRoles } from '@/api/roles/roles';
import { usersSchema } from '@/pages/users/schema';

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
    } catch (error) {
        console.warn("Gagal fetch departemen (mungkin tidak ada izin):", error);
    }

    try {
        const mitraRes = await getMitra({ limit: 100, offset: 0 });
        mitraOptions.value = mitraRes.results.map(m => ({
            label: m.nama_perusahaan,
            value: m.id_mitra
        }));
    } catch (error) {
        console.warn("Gagal fetch mitra (mungkin tidak ada izin):", error);
    }

    try {
        const rolesRes = await getRoles({ limit: 100, offset: 0 });
        roleOptions.value = rolesRes.results.map((r: any) => ({
            label: r.nama_role,
            value: r.id_role
        }));
    } catch (error) {
        console.error("Gagal fetch roles:", error);
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
            const res = await updateUser(values.id_user, payload);
            if (selectedRoleId && selectedRoleId !== originalRoleId) {
                await assignUserRole(values.id_user, selectedRoleId);
            }
            return res.data;
        } else {
            const res = await createUser(payload);
            return res.data;
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

// Approve Mitra modal state
const isApproveModalOpen = ref(false);
const approveUserId = ref<number | null>(null);
const approveUsernameInput = ref('');

const openApproveModal = (userId: number) => {
    approveUserId.value = userId;
    approveUsernameInput.value = '';
    isApproveModalOpen.value = true;
};

const submitApprove = async () => {
    if (!approveUserId.value) return;
    if (!approveUsernameInput.value.trim()) {
        toast.error("Username wajib diisi");
        return;
    }

    try {
        const result = await approveUser(approveUserId.value, { username: approveUsernameInput.value.trim() });
        isApproveModalOpen.value = false;
        
        if (result?.temporary_password) {
            generatedTempPassword.value = result.temporary_password;
            generatedTempUsername.value = result.username || approveUsernameInput.value.trim();
            isTempPasswordModalOpen.value = true;
            isCopied.value = false;
            toast.success("Pengguna berhasil disetujui!");
        } else {
            toast.success("Pengguna berhasil disetujui!");
        }
        fetchData();
    } catch (error: any) {
        console.error("Gagal menyetujui pengguna:", error);
        const errorMsg = error.response?.data?.message || "Gagal menyetujui pendaftaran pengguna";
        toast.error(errorMsg);
    }
};

// Mitra Detail modal state
const isMitraDetailModalOpen = ref(false);
const isMitraDetailLoading = ref(false);
const selectedMitraDetails = ref<any>(null);

const viewMitraDetails = async (mitraId: number) => {
    selectedMitraDetails.value = null;
    isMitraDetailModalOpen.value = true;
    isMitraDetailLoading.value = true;
    try {
        const response = await getMitraById(mitraId);
        selectedMitraDetails.value = response;
    } catch (error) {
        console.error("Gagal memuat detail mitra:", error);
        toast.error("Gagal memuat rincian informasi mitra");
        isMitraDetailModalOpen.value = false;
    } finally {
        isMitraDetailLoading.value = false;
    }
};

const activeFormValues = ref<Record<string, any>>({});

watch(() => createDialog.isOpen.value, (isOpen) => {
    if (isOpen) {
        activeFormValues.value = { ...createDialog.initialValues.value };
    } else {
        activeFormValues.value = {};
    }
});

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
        { 
            header: 'Username', 
            accessorKey: 'username',
            cell: ({ row }) => {
                const item = row.original;
                if (item.status === 'pending' && item.id_mitra) {
                    return '-';
                }
                return item.username;
            }
        },
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
                    if (item.id_mitra) {
                        buttons.push(
                            h(Button, { 
                                variant: 'outline',
                                size: 'sm',
                                class: 'border-slate-300 text-slate-700 hover:bg-slate-50 mr-2',
                                onClick: () => viewMitraDetails(item.id_mitra!) 
                            }, () => [
                                h(EyeIcon, { class: 'w-4 h-4 mr-1' }),
                                'Detail Mitra'
                            ])
                        );
                    }
                    if (hasPermission('USER_APPROVE')) {
                        buttons.push(
                            h(Button, { 
                                variant: 'outline',
                                size: 'sm',
                                class: 'border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 mr-2',
                                onClick: () => openApproveModal(item.id_user) 
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
    // Filter role options based on user_type
    let filteredRoles = roleOptions.value;
    const currentUserType = activeFormValues.value?.user_type;
    
    if (currentUserType === 'Karyawan') {
        // Exclude CLIENT role for internal employees
        filteredRoles = roleOptions.value.filter(r => String(r.label).toUpperCase() !== 'CLIENT');
    } else if (currentUserType === 'Mitra') {
        // Only allow CLIENT role for external partners
        filteredRoles = roleOptions.value.filter(r => String(r.label).toUpperCase() === 'CLIENT');
    }
    
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
            options: filteredRoles,
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
            @change="activeFormValues = $event"
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

        <!-- Approve Mitra Modal -->
        <Dialog :open="isApproveModalOpen" @update:open="isApproveModalOpen = $event">
            <DialogContent class="sm:max-w-md bg-white border border-slate-200 shadow-xl rounded-xl p-6">
                <DialogHeader class="flex flex-col space-y-2">
                    <DialogTitle class="text-xl font-bold text-slate-900">Setujui Pendaftaran Mitra</DialogTitle>
                    <DialogDescription class="text-xs text-slate-500">
                        Masukkan username login untuk mitra ini. Password acak akan digenerate otomatis.
                    </DialogDescription>
                </DialogHeader>

                <div class="mt-4 space-y-4">
                    <div class="flex flex-col gap-2">
                        <label class="text-sm font-semibold text-slate-700">Username Login</label>
                        <input
                            v-model="approveUsernameInput"
                            type="text"
                            placeholder="username-mitra"
                            class="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                        />
                    </div>
                </div>

                <div class="mt-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        @click="isApproveModalOpen = false"
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        @click="submitApprove"
                    >
                        Setujui & Buat Akun
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        <!-- Detail Mitra Modal -->
        <Dialog :open="isMitraDetailModalOpen" @update:open="isMitraDetailModalOpen = $event">
            <DialogContent class="sm:max-w-lg bg-white border border-slate-200 shadow-xl rounded-xl p-6">
                <DialogHeader class="flex flex-col space-y-2">
                    <div class="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit">
                        <Building2Icon class="w-4 h-4" />
                        <span class="text-xs font-bold uppercase tracking-wider">Informasi Pendaftaran Mitra</span>
                    </div>
                    <DialogTitle class="text-xl font-bold text-slate-900">Detail Profil Mitra</DialogTitle>
                    <DialogDescription class="text-xs text-slate-500">
                        Rincian data pendaftaran yang diisi oleh calon mitra saat registrasi.
                    </DialogDescription>
                </DialogHeader>

                <div v-if="isMitraDetailLoading" class="flex flex-col items-center justify-center py-12 gap-3 text-slate-500">
                    <div class="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
                    <span class="text-sm font-medium">Memuat data mitra...</span>
                </div>

                <div v-else-if="selectedMitraDetails" class="mt-4 space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nama Perusahaan</span>
                            <span class="text-base font-bold text-slate-800">{{ selectedMitraDetails.nama_perusahaan }}</span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipe Perusahaan</span>
                            <span class="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded w-fit">
                                {{ selectedMitraDetails.tipe_perusahaan || '-' }}
                            </span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Daftar</span>
                            <span class="text-xs font-semibold text-slate-700">
                                {{ formatDate(selectedMitraDetails.created_at) }}
                            </span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</span>
                            <a :href="`mailto:${selectedMitraDetails.email}`" class="text-xs font-semibold text-indigo-600 hover:underline">
                                {{ selectedMitraDetails.email }}
                            </a>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon</span>
                            <a :href="`tel:${selectedMitraDetails.no_telp}`" class="text-xs font-semibold text-slate-700 hover:text-indigo-600">
                                {{ selectedMitraDetails.no_telp }}
                            </a>
                        </div>

                        <div class="col-span-2 flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alamat Lengkap</span>
                            <span class="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                                {{ selectedMitraDetails.alamat || '-' }}
                            </span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kota</span>
                            <span class="text-xs font-semibold text-slate-700">
                                {{ selectedMitraDetails.kota || '-' }}
                            </span>
                        </div>

                        <div class="flex flex-col gap-1">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode Pos</span>
                            <span class="text-xs font-semibold text-slate-700">
                                {{ selectedMitraDetails.kode_pos || '-' }}
                            </span>
                        </div>
                    </div>
                </div>

                <div v-else class="flex flex-col items-center justify-center py-12 gap-3 text-red-500">
                    <span class="text-sm font-semibold">Data mitra tidak ditemukan atau gagal dimuat.</span>
                </div>

                <div class="mt-6 flex justify-end">
                    <Button
                        type="button"
                        class="bg-slate-900 text-white hover:bg-slate-800 font-semibold px-6"
                        @click="isMitraDetailModalOpen = false"
                    >
                        Tutup
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>
