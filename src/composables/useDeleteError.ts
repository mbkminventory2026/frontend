import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { toast } from 'vue-sonner'
import { AxiosError } from 'axios'

export function useDeleteError() {
    const { openConfirm } = useConfirmDialog()

    function handleDeleteError(error: any, resourceName: string = 'Data') {
        console.error(`Gagal menghapus ${resourceName}:`, error)
        
        const axiosError = error as AxiosError<any>
        const isConflict = axiosError.response?.status === 409
        
        if (isConflict) {
            // Tampilkan alert modal bahwa data tidak bisa dihapus karena digunakan
            setTimeout(() => {
                openConfirm({
                    type: 'warning',
                    title: `Tidak Dapat Menghapus ${resourceName}`,
                    message: `${resourceName} ini tidak dapat dihapus karena sedang digunakan oleh data lain di dalam sistem (misalnya pengguna, transaksi, atau relasi lainnya).`,
                    confirmLabel: 'Mengerti',
                    showCancel: false,
                    onConfirm: () => {}
                })
            }, 400) // Beri jeda 400ms agar dialog konfirmasi delete selesai menutup (transisi fade-out)
        } else {
            const errMsg = axiosError.response?.data?.message || axiosError.response?.data?.error || 'Terjadi kesalahan pada server.'
            toast.error(`Gagal menghapus ${resourceName}: ${errMsg}`)
        }
    }

    return { handleDeleteError }
}
