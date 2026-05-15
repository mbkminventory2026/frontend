import { ref } from 'vue'
import { toast } from 'vue-sonner'

interface UseDialogOptions {
    onSubmit: (values: any, isEdit: boolean) => Promise<any>
    onSuccess?: () => void
    onError?: (error: any) => void
}

export function useDialog({
    onSubmit,
    onSuccess,
    onError
}: UseDialogOptions) {
    const isOpen = ref(false)
    const isLoading = ref(false)
    const initialValues = ref<Record<string, any>>({})
    const isEditMode = ref(false)

    const openDialog = (data?: Record<string, any>) => {
        if (data) {
            isEditMode.value = true
            initialValues.value = { ...data }
        } else {
            isEditMode.value = false
            initialValues.value = {}
        }
        isOpen.value = true
    }

    const closeDialog = () => {
        isOpen.value = false
        initialValues.value = {}
    }

    const handleSubmit = async (values: any) => {
        isLoading.value = true
        try {
            await onSubmit(values, isEditMode.value)
            
            toast.success(isEditMode.value ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan')

            closeDialog()
            if (onSuccess) onSuccess()
        } catch (error: any) {
            console.error('API Error:', error.response?.data)
            toast.error(error.response?.data?.message || 'Terjadi kesalahan sistem')
            if (onError) onError(error)
        } finally {
            isLoading.value = false
        }
    } 

    return {
        isOpen,
        isLoading,
        initialValues,
        isEditMode,
        openDialog,
        closeDialog,
        handleSubmit,
    }
}
