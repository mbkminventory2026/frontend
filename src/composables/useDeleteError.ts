import { useConfirmDialog } from '@/composables/useConfirmDialog'
import { AxiosError } from 'axios'

export function useDeleteError() {
    const { openConfirm } = useConfirmDialog()

    function handleDeleteError(error: any, resourceName: string = 'Data') {
        console.error(`Gagal menghapus ${resourceName}:`, error)
        
        const axiosError = error as AxiosError<any>
        const status = axiosError.response?.status
        const rawMessage = axiosError.response?.data?.message || axiosError.response?.data?.error || axiosError.message || ''
        
        let title = `Gagal Menghapus ${resourceName}`
        let message = `Terjadi kesalahan saat menghapus ${resourceName.toLowerCase()}.`

        if (status === 409) {
            title = `Tidak Dapat Menghapus ${resourceName}`
            message = `${resourceName} ini tidak dapat dihapus karena sedang digunakan oleh data lain di dalam sistem (misalnya pengguna, transaksi, atau relasi lainnya).`
        } else if (status === 503) {
            title = `Layanan Tidak Tersedia (503)`
            message = `Database atau server layanan sedang tidak tersedia saat ini. Silakan coba beberapa saat lagi, atau hubungi administrator jika masalah ini berlanjut.`
        } else if (status === 403) {
            title = `Akses Ditolak (403)`
            message = `Anda tidak memiliki izin (hak akses) yang memadai untuk menghapus data ${resourceName.toLowerCase()} ini.`
        } else if (status === 400) {
            title = `Permintaan Tidak Valid (400)`
            message = `Gagal menghapus ${resourceName.toLowerCase()} karena kesalahan permintaan: ${rawMessage}.`
        } else {
            // General server errors
            const errMsg = rawMessage ? `: ${rawMessage}` : '.'
            message = `Sistem mengalami kendala saat memproses penghapusan data ${resourceName.toLowerCase()}${errMsg} Silakan coba beberapa saat lagi.`
        }

        // Tampilkan modal peringatan di tengah layar (bukan toast di bawah)
        setTimeout(() => {
            openConfirm({
                type: 'warning',
                title: title,
                message: message,
                confirmLabel: 'Mengerti',
                showCancel: false,
                onConfirm: () => {}
            })
        }, 400) // Beri jeda 400ms agar dialog konfirmasi delete selesai menutup (transisi fade-out)
    }

    return { handleDeleteError }
}
