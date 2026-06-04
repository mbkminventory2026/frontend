import { reactive } from 'vue'

export type ConfirmDialogType = 'delete' | 'warning' | 'info' | 'success'

export interface ConfirmDialogOptions {
    /** Judul dialog. Jika tidak diisi, ditentukan otomatis dari `type`. */
    title?: string
    /** Pesan konfirmasi yang ditampilkan di body dialog. */
    message: string
    /** Varian visual dialog — menentukan icon dan aksen warna. Default: `'info'` */
    type?: ConfirmDialogType
    /** Label tombol konfirmasi. Default: ditentukan dari `type`. */
    confirmLabel?: string
    /** Label tombol batal. Default: `'Batal'` */
    cancelLabel?: string
    /** Menampilkan tombol batal. Default: `true` */
    showCancel?: boolean
    /** Callback yang dijalankan saat user menekan tombol konfirmasi. */
    onConfirm: () => Promise<void> | void
    /** Callback opsional yang dijalankan saat user membatalkan. */
    onCancel?: () => void
}

interface ConfirmDialogState {
    isOpen: boolean
    isLoading: boolean
    options: ConfirmDialogOptions | null
}

// Singleton state — satu instance global, dikontrol via composable
const state = reactive<ConfirmDialogState>({
    isOpen: false,
    isLoading: false,
    options: null,
})

export function useConfirmDialog() {
    /**
     * Membuka dialog konfirmasi dengan opsi yang diberikan.
     */
    function openConfirm(options: ConfirmDialogOptions) {
        state.options = options
        state.isOpen = true
    }

    /**
     * Menutup dialog dan mereset state.
     * Dipanggil oleh AppConfirmDialog secara internal.
     */
    function closeConfirm() {
        state.isOpen = false
        // Reset setelah animasi close selesai
        setTimeout(() => {
            state.options = null
            state.isLoading = false
        }, 300)
    }

    /**
     * Dijalankan saat user menekan tombol konfirmasi.
     * Dipanggil oleh AppConfirmDialog secara internal.
     */
    async function handleConfirm() {
        if (!state.options) return
        state.isLoading = true
        try {
            await state.options.onConfirm()
        } finally {
            state.isLoading = false
            closeConfirm()
        }
    }

    /**
     * Dijalankan saat user menekan tombol batal atau menutup dialog.
     * Dipanggil oleh AppConfirmDialog secara internal.
     */
    function handleCancel() {
        state.options?.onCancel?.()
        closeConfirm()
    }

    return {
        // State (readonly untuk konsumen luar)
        state,

        // Public API
        openConfirm,

        // Internal API — dipakai AppConfirmDialog
        closeConfirm,
        handleConfirm,
        handleCancel,
    }
}
