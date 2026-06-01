import { apiClient } from "@/lib/apiClient";

export interface JenisBarangItem {
    id_jenis_barang: number;
    nama_jenis_barang: string;
    kode: string;
}

export const getJenisBarang = async () => {
    const response = await apiClient.get<JenisBarangItem[]>('/api/v1/master/jenis-barang', {
        params: {
            page: 1,
            pageSize: 1000,
            sortBy: 'nama_jenis_barang',
            sortDesc: false
        }
    });
    return response.data;
}
