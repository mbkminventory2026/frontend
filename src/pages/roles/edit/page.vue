<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useParams } from '@tanstack/vue-router';
import { ArrowLeftIcon, SaveIcon, ShieldCheckIcon } from 'lucide-vue-next';
import { toast } from 'vue-sonner';

import { getRoleById, updateRole } from '@/api/roles/roles';
import { getPermissions } from '@/api/permissions/permissions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';

const router = useRouter();
const params = useParams({ from: '/_authenticated/roles/edit/$id' });
const authStore = useAuthStore();

const namaRole = ref('');
const selectedPermissionIds = ref<(string | number)[]>([]);
const isLoadingPermissions = ref(true);
const isLoadingRole = ref(true);
const isSaving = ref(false);

// Permission options fetched from API
const permissionOptions = ref<{ label: string, value: string | number, code: string, domain: string, action: string }[]>([]);

// ─── PAGE_LABELS Mapping ───
const PAGE_LABELS: Record<string, string> = {
    USER: "Daftar Pengguna (User)",
    ROLE: "Manajemen Role",
    PERMISSION: "Hak Akses & Fitur (Permission)",
    MASTER_BARANG: "Daftar Barang",
    MASTER_MITRA: "Mitra Perusahaan",
    MASTER_JENIS_BARANG: "Jenis Barang",
    MASTER_PROFIL_PERUSAHAAN: "Profil Perusahaan",
    MASTER_DEPARTEMEN: "Departemen",
    PO_CLIENT: "PO Client",
    PR_INTERNAL: "PR Internal",
    PO_INTERNAL: "PO Internal",
    WO: "Work Order (WO)",
    PRODUCTION_SUMMARY: "Production Summary",
    PRODUCTION_REPORT: "Laporan Produksi",
    TIMELINE: "Timeline",
    MARKER_PLAN: "Marker Plan",
    CUTTING_PLAN: "Cutting Plan",
    PACKING_LIST: "Packing List",
    INVENTORY: "Inventory (Gudang)",
    SURAT_JALAN: "Surat Jalan",
    REPORT: "Laporan (Report)",
    LOG: "Log Aktivitas",
    DASHBOARD: "Dashboard",
}

// ─── Group permissions by page ───
const permissionGroups = computed(() => {
    const opts = permissionOptions.value;
    if (!opts.length) return [];

    const groupsMap = new Map<string, { key: string, label: string, readCodes: string[], readValues: (string | number)[], actions: { label: string, value: string | number, code: string }[] }>();

    opts.forEach(opt => {
        if (opt.code === 'ALL_ACCESS') return;

        const code = opt.code || '';
        let key = '';
        if (code.startsWith('MASTER_')) {
            key = code.split('_').slice(0, 2).join('_');
        } else if (code.startsWith('PO_') || code.startsWith('PR_')) {
            key = code.split('_').slice(0, 2).join('_');
        } else if (code.startsWith('SURAT_JALAN_')) {
            key = 'SURAT_JALAN';
        } else if (code.startsWith('PRODUCTION_')) {
            key = code.split('_').slice(0, 2).join('_');
        } else if (code.startsWith('MARKER_') || code.startsWith('CUTTING_') || code.startsWith('PACKING_')) {
            key = code.split('_').slice(0, 2).join('_');
        } else {
            key = code.split('_')[0] || code;
        }

        if (!groupsMap.has(key)) {
            groupsMap.set(key, {
                key,
                label: PAGE_LABELS[key] || key.replace(/_/g, ' '),
                readCodes: [],
                readValues: [],
                actions: []
            });
        }

        const group = groupsMap.get(key)!;
        const isRead = code.endsWith('_READ') || code === 'INVENTORY_RECEIVE';

        if (isRead) {
            group.readCodes.push(code);
            group.readValues.push(opt.value);
        } else {
            let actionLabel = '';
            const parts = code.split('_');
            const actionWord = parts[parts.length - 1] || '';

            if (code === 'USER_ROLE_ASSIGN') {
                actionLabel = 'Assign Role';
            } else {
                actionLabel = actionWord.charAt(0).toUpperCase() + actionWord.slice(1).toLowerCase();
            }

            group.actions.push({
                label: actionLabel,
                value: opt.value,
                code: code
            });
        }
    });

    return Array.from(groupsMap.values()).filter(g => g.readValues.length > 0 || g.actions.length > 0);
});

// ─── All Access ───
const allAccessId = computed(() => {
    const opt = permissionOptions.value.find(o => o.code === 'ALL_ACCESS');
    return opt ? opt.value : null;
});

const isAllAccessSelected = computed(() => {
    if (!allAccessId.value) return false;
    return selectedPermissionIds.value.some(v => String(v) === String(allAccessId.value));
});

function handleAllAccessToggle(checked: boolean) {
    if (!allAccessId.value) return;
    selectedPermissionIds.value = checked ? [allAccessId.value] : [];
}

// ─── Page selection helpers ───
function isPageSelected(group: any): boolean {
    if (!group.readValues || group.readValues.length === 0) return false;
    return group.readValues.every((rv: any) => selectedPermissionIds.value.some(v => String(v) === String(rv)));
}

function handlePageToggle(group: any, checked: any) {
    if (group.actions && group.actions.length > 0) {
        group.actions.forEach((a: any) => {
        });
    } else {
    }

    let currentVals = [...selectedPermissionIds.value];
    if (checked) {
        group.readValues.forEach((rv: any) => {
            if (!currentVals.some(v => String(v) === String(rv))) {
                currentVals.push(rv);
            }
        });
    } else {
        // Remove read values
        const readValsStr = group.readValues.map((rv: any) => String(rv));
        currentVals = currentVals.filter(v => !readValsStr.includes(String(v)));
        // Remove action values too
        const actionValsStr = group.actions.map((a: any) => String(a.value));
        currentVals = currentVals.filter(v => !actionValsStr.includes(String(v)));
    }
    selectedPermissionIds.value = currentVals;
}

// ─── Action selection helpers ───
function isActionSelected(actionVal: any): boolean {
    return selectedPermissionIds.value.some(v => String(v) === String(actionVal));
}

function handleActionToggle(actionVal: any, checked: any) {
    let currentVals = [...selectedPermissionIds.value];
    if (checked) {
        currentVals.push(actionVal);
    } else {
        currentVals = currentVals.filter(v => String(v) !== String(actionVal));
    }
    selectedPermissionIds.value = currentVals;
}

// ─── Selected pages that have actions (Field 4) ───
const selectedPagesWithActions = computed(() => {
    return permissionGroups.value.filter(g => {
        if (!g.readValues || g.readValues.length === 0) return false;
        const isSelected = g.readValues.every((rv: any) => selectedPermissionIds.value.some(v => String(v) === String(rv)));
        return isSelected && g.actions.length > 0;
    });
});

// ─── Summary of selected permissions ───
const selectedSummary = computed(() => {
    if (isAllAccessSelected.value) return 'Full Access (All Permissions)';
    const pageCount = permissionGroups.value.filter(g => isPageSelected(g)).length;
    const actionCount = selectedPermissionIds.value.length - permissionGroups.value.reduce((acc, g) => {
        if (isPageSelected(g)) return acc + g.readValues.length;
        return acc;
    }, 0);
    if (pageCount === 0) return 'Belum ada hak akses yang dipilih';
    return `${pageCount} halaman${actionCount > 0 ? `, ${actionCount} aksi tambahan` : ''}`;
});

// ─── Fetch and Submit ───
const fetchPermissionOptions = async () => {
    isLoadingPermissions.value = true;
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
        toast.error("Gagal memuat daftar hak akses.");
    } finally {
        isLoadingPermissions.value = false;
    }
}

const loadRoleData = async () => {
    isLoadingRole.value = true;
    try {
        const idRole = params.value.id;
        if (!idRole) throw new Error("ID Role tidak ditemukan");

        const roleData = await getRoleById(idRole);

        // Prevent editing sensitive roles if not SUPER_ADMIN
        const isSuperAdmin = authStore.roleName === 'SUPER_ADMIN';
        const targetRoleName = roleData.nama_role;
        const canModify = isSuperAdmin || (
            targetRoleName !== 'SUPER_ADMIN' &&
            targetRoleName !== 'ADMIN_SISTEM' &&
            targetRoleName !== authStore.roleName
        );

        if (!canModify) {
            toast.error("Anda tidak memiliki hak akses untuk mengedit role ini.");
            router.navigate({ to: '/roles' });
            return;
        }

        namaRole.value = roleData.nama_role;
        selectedPermissionIds.value = roleData.hak_akses_ids || [];
    } catch (error) {
        console.error("Gagal memuat data role:", error);
        toast.error("Gagal memuat data role.");
        router.navigate({ to: '/roles' });
    } finally {
        isLoadingRole.value = false;
    }
}

const handleSubmit = async () => {
    if (!namaRole.value.trim()) {
        toast.error("Nama Role wajib diisi.");
        return;
    }

    isSaving.value = true;
    try {
        const idRole = params.value.id;
        await updateRole(idRole, {
            nama_role: namaRole.value.trim(),
            hak_akses_ids: selectedPermissionIds.value.map(v => Number(v))
        });
        toast.success("Role berhasil diperbarui!");
        router.navigate({ to: '/roles' });
    } catch (error: any) {
        console.error("Gagal memperbarui role:", error);
        toast.error(error?.response?.data?.message || "Gagal memperbarui role.");
    } finally {
        isSaving.value = false;
    }
}

onMounted(() => {
    fetchPermissionOptions();
    loadRoleData();
});
</script>

<template>
    <div class="container mx-auto py-8 max-w-4xl space-y-6">
        <!-- Header Navigation -->
        <div class="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 border-slate-100 gap-4">
            <div class="flex items-center gap-3">
                <div class="bg-indigo-50 border border-indigo-200/80 p-2.5 rounded-xl shadow-sm">
                    <ShieldCheckIcon class="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h1 class="text-2xl font-bold tracking-tight text-slate-900">
                        Edit Role
                    </h1>
                    <p class="text-[13px] text-slate-500 mt-1">
                        Perbarui nama role dan atur hak akses yang diberikan.
                    </p>
                </div>
            </div>

            <div class="flex items-center gap-3">
                <Button type="button" @click="router.navigate({ to: '/roles' })" variant="outline" class="h-10 px-4 border-slate-300 shadow-sm transition-all rounded-lg">
                    <ArrowLeftIcon class="w-4 h-4 mr-2" /> Kembali
                </Button>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoadingPermissions || isLoadingRole" class="flex flex-col items-center justify-center min-h-[300px] gap-4">
            <Spinner class="size-8" />
            <p class="text-slate-500 animate-pulse text-sm">Memuat data...</p>
        </div>

        <!-- Form Content -->
        <div v-else class="space-y-6">
            <!-- Card 1: Nama Role -->
            <Card class="border border-slate-200 bg-white p-6 shadow-sm rounded-xl">
                <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span class="inline-block w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                    Informasi Role
                </h2>
                <div class="max-w-md">
                    <label for="nama_role" class="block text-sm font-medium text-slate-700 mb-1.5">
                        Nama Role <span class="text-red-500">*</span>
                    </label>
                    <Input
                        id="nama_role"
                        v-model="namaRole"
                        placeholder="Contoh: ADMIN_QC, PO_Internal"
                        class="h-10"
                    />
                    <p class="text-xs text-slate-400 mt-1.5">Gunakan format UPPERCASE dengan underscore, contoh: ADMIN_GUDANG</p>
                </div>
            </Card>

            <!-- Card 2: Permissions Selector -->
            <Card class="border border-slate-200 bg-white p-6 shadow-sm rounded-xl">
                <h2 class="text-sm font-bold text-slate-800 uppercase tracking-wider mb-5 flex items-center gap-2">
                    <span class="inline-block w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                    Pengaturan Hak Akses
                </h2>

                <div class="space-y-5">
                    <!-- All Access Toggle -->
                    <div class="flex items-center gap-3 pb-3 border-b border-slate-200">
                        <Checkbox
                            id="all-access-toggle"
                            :checked="isAllAccessSelected"
                            @click="handleAllAccessToggle(!isAllAccessSelected)"
                        />
                        <label for="all-access-toggle" class="text-sm font-bold text-indigo-700 cursor-pointer select-none">
                            Grant All Access (Emergency Full Access)
                        </label>
                    </div>

                    <!-- Pages & Actions -->
                    <div v-if="!isAllAccessSelected" class="space-y-5">
                        <!-- FIELD 3: Pages Checklist -->
                        <div>
                            <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-2">
                                1. Halaman yang Ingin Diakses
                                <span class="text-slate-400 font-normal normal-case tracking-normal ml-1">(Otomatis mendapatkan Hak Akses GET)</span>
                            </span>
                            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[280px] overflow-y-auto border rounded-lg p-3 bg-slate-50/50 pr-1">
                                <div
                                    v-for="group in permissionGroups"
                                    :key="group.key"
                                    class="flex items-center gap-2 hover:bg-white p-2 rounded-lg transition-colors duration-150"
                                >
                                    <Checkbox
                                        :id="`page-${group.key}`"
                                        :checked="isPageSelected(group)"
                                        @click="handlePageToggle(group, !isPageSelected(group))"
                                    />
                                    <label :for="`page-${group.key}`" class="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                        {{ group.label }}
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- FIELD 4: Specific Actions -->
                        <div>
                            <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-2">
                                2. Opsi Aksi Khusus
                                <span class="text-slate-400 font-normal normal-case tracking-normal ml-1">(Hanya tampil untuk Halaman yang dipilih di atas)</span>
                            </span>

                            <div class="border rounded-lg p-3 bg-slate-50/50 max-h-[280px] overflow-y-auto space-y-3">
                                <template v-if="selectedPagesWithActions.length > 0">
                                    <div
                                        v-for="group in selectedPagesWithActions"
                                        :key="group.key"
                                        class="border-b last:border-b-0 pb-3 last:pb-0 space-y-2"
                                    >
                                        <span class="text-xs font-bold text-slate-800 block">
                                            {{ group.label }}
                                        </span>
                                        <div class="flex flex-wrap gap-x-5 gap-y-2 pl-2">
                                            <div v-for="actionPerm in group.actions" :key="String(actionPerm.value)" class="flex items-center gap-1.5">
                                                <Checkbox
                                                    :id="`action-${actionPerm.value}`"
                                                    :checked="isActionSelected(actionPerm.value)"
                                                    @click="handleActionToggle(actionPerm.value, !isActionSelected(actionPerm.value))"
                                                />
                                                <label :for="`action-${actionPerm.value}`" class="text-[11px] text-slate-600 cursor-pointer select-none font-medium">
                                                    {{ actionPerm.label }}
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <template v-else>
                                    <p class="text-xs text-slate-400 italic text-center py-4">
                                        Pilih halaman di atas untuk melihat opsi aksi yang tersedia.
                                    </p>
                                </template>
                            </div>
                        </div>
                    </div>

                    <!-- Summary -->
                    <div class="flex items-center gap-2 pt-3 border-t border-slate-200">
                        <ShieldCheckIcon class="w-4 h-4 text-indigo-500 flex-shrink-0" />
                        <span class="text-xs text-slate-600">
                            <strong>Ringkasan:</strong> {{ selectedSummary }}
                        </span>
                    </div>
                </div>
            </Card>

            <!-- Footer Buttons -->
            <div class="border-t border-slate-200 pt-6 flex gap-3 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    @click="router.navigate({ to: '/roles' })"
                    class="h-10 px-5 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg transition-all border-slate-300"
                >
                    Batal
                </Button>
                <Button
                    type="button"
                    :disabled="isSaving"
                    @click="handleSubmit"
                    class="h-10 px-6 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm border border-indigo-500 transition-all flex items-center gap-2 active:scale-[0.98]"
                >
                    <template v-if="isSaving">
                        <Spinner class="w-4 h-4" /> Menyimpan...
                    </template>
                    <template v-else>
                        <SaveIcon class="w-4 h-4" /> Simpan Perubahan
                    </template>
                </Button>
            </div>
        </div>
    </div>
</template>
