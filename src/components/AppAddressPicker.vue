<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const props = defineProps<{
    modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

// Data states
const provinces = ref<any[]>([]);
const regencies = ref<any[]>([]);
const districts = ref<any[]>([]);

// Selected values (names)
const selectedProvince = ref('');
const selectedRegency = ref('');
const selectedDistrict = ref('');
const postalCode = ref('');
const street = ref('');

// Loading states
const isLoadingProvinces = ref(false);
const isLoadingRegencies = ref(false);
const isLoadingDistricts = ref(false);

// Using a different API mirror for better CORS support
const API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api';

const fetchProvinces = async () => {
    isLoadingProvinces.value = true;
    try {
        const response = await fetch(`${API_BASE}/provinces.json`);
        provinces.value = await response.json();
    } catch (error) {
        console.error("Gagal fetch provinsi:", error);
    } finally {
        isLoadingProvinces.value = false;
    }
}

const fetchRegencies = async (provinceId: string) => {
    if (!provinceId) return;
    isLoadingRegencies.value = true;
    try {
        const response = await fetch(`${API_BASE}/regencies/${provinceId}.json`);
        regencies.value = await response.json();
    } catch (error) {
        console.error("Gagal fetch kabupaten:", error);
    } finally {
        isLoadingRegencies.value = false;
    }
}

const fetchDistricts = async (regencyId: string) => {
    if (!regencyId) return;
    isLoadingDistricts.value = true;
    try {
        const response = await fetch(`${API_BASE}/districts/${regencyId}.json`);
        districts.value = await response.json();
    } catch (error) {
        console.error("Gagal fetch kecamatan:", error);
    } finally {
        isLoadingDistricts.value = false;
    }
}

const isInitialParsing = ref(true);

const SEPARATOR = ' | ';

const updateModel = () => {
    if (isInitialParsing.value) return;
    
    // Always join with 5 parts to keep the structure consistent for parsing
    const parts = [
        street.value || '',
        selectedDistrict.value || '',
        selectedRegency.value || '',
        selectedProvince.value || '',
        postalCode.value || ''
    ];
    
    emit('update:modelValue', parts.join(SEPARATOR));
}

// Parse the address string
const parseAddress = async (value: string) => {
    if (!value) {
        isInitialParsing.value = false;
        return;
    }

    const parts = value.split(SEPARATOR);
    
    // Reset before parsing
    street.value = '';
    selectedDistrict.value = '';
    selectedRegency.value = '';
    selectedProvince.value = '';
    postalCode.value = '';

    if (parts.length >= 5) {
        street.value = parts[0] || '';
        selectedDistrict.value = parts[1] || '';
        selectedRegency.value = parts[2] || '';
        selectedProvince.value = parts[3] || '';
        postalCode.value = parts[4] || '';
    } else {
        // Fallback for legacy address or single string
        street.value = value;
    }

    // Ensure provinces are loaded
    if (provinces.value.length === 0) {
        await fetchProvinces();
    }
    
    if (selectedProvince.value) {
        const prov = provinces.value.find(p => p.name.toUpperCase() === selectedProvince.value.toUpperCase());
        if (prov) {
            await fetchRegencies(prov.id);
            if (selectedRegency.value) {
                const reg = regencies.value.find(r => r.name.toUpperCase() === selectedRegency.value.toUpperCase());
                if (reg) {
                    await fetchDistricts(reg.id);
                }
            }
        }
    }
    
    isInitialParsing.value = false;
}

watch([selectedProvince, selectedRegency, selectedDistrict, postalCode, street], () => {
    updateModel();
});

// Watch for external model changes (e.g. when record changes or initial load)
watch(() => props.modelValue, async (newVal, oldVal) => {
    // Only re-parse if values are actually different to avoid infinite loops
    if (newVal !== oldVal) {
        await parseAddress(newVal);
    }
}, { immediate: true });

onMounted(async () => {
    // Initial fetch of provinces if empty
    if (provinces.value.length === 0) {
        await fetchProvinces();
    }
});

const onProvinceChange = async (value: string) => {
    selectedProvince.value = value;
    const prov = provinces.value.find(p => p.name === value);
    selectedRegency.value = '';
    selectedDistrict.value = '';
    regencies.value = [];
    districts.value = [];
    if (prov) await fetchRegencies(prov.id);
}

const onRegencyChange = async (value: string) => {
    selectedRegency.value = value;
    const reg = regencies.value.find(r => r.name === value);
    selectedDistrict.value = '';
    districts.value = [];
    if (reg) await fetchDistricts(reg.id);
}

const onDistrictChange = (value: string) => {
    selectedDistrict.value = value;
}

</script>

<template>
    <div class="space-y-4 w-full">
        <div class="flex flex-col gap-4">
            <div class="space-y-2">
                <Label class="text-muted-foreground">Provinsi</Label>
                <Select :model-value="selectedProvince" @update:model-value="onProvinceChange">
                    <SelectTrigger class="w-full">
                        <SelectValue :placeholder="isLoadingProvinces ? 'Memuat...' : 'Pilih Provinsi'" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="item in provinces" :key="item.id" :value="item.name">
                            {{ item.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div class="space-y-2">
                <Label class="text-muted-foreground">Kabupaten / Kota</Label>
                <Select :model-value="selectedRegency" @update:model-value="onRegencyChange" :disabled="!selectedProvince">
                    <SelectTrigger class="w-full">
                        <SelectValue :placeholder="isLoadingRegencies ? 'Memuat...' : 'Pilih Kabupaten/Kota'" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="item in regencies" :key="item.id" :value="item.name">
                            {{ item.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div class="space-y-2">
                <Label class="text-muted-foreground">Kecamatan</Label>
                <Select :model-value="selectedDistrict" @update:model-value="onDistrictChange" :disabled="!selectedRegency">
                    <SelectTrigger class="w-full">
                        <SelectValue :placeholder="isLoadingDistricts ? 'Memuat...' : 'Pilih Kecamatan'" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem v-for="item in districts" :key="item.id" :value="item.name">
                            {{ item.name }}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div class="space-y-2">
                <Label class="text-muted-foreground">Kode Pos</Label>
                <Input v-model="postalCode" placeholder="Masukkan kode pos" />
            </div>

            <div class="space-y-2">
                <Label class="text-muted-foreground">Nama Jalan / No. Rumah / Gedung</Label>
                <Input v-model="street" placeholder="Contoh: Jl. Sudirman No. 123" />
            </div>
        </div>
    </div>
</template>
