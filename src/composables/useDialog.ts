import { ref } from 'vue'
import { toast } from 'vue-sonner'
import axios from 'axios'

interface UseDialogOptions {
    endpoint: string
    onSuccess?: () => void
    onError?: (error: any) => void
}

export function useDialog({
    endpoint,
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

        const hasFile = Object.values(values).some(
            (val) => val instanceof File || (Array.isArray(val) && val[0] instanceof File)
        )

        let payload: any = values
        if (hasFile) {
            const formData = new FormData() // agar bisa menerima file
            Object.keys(values).forEach((key) => {
                if (Array.isArray([key])) { // jika payload merupakan array
                    values[key].forEach((item: any) => formData.append(`${key}[]`, item))
                } else {
                    formData.append(key, values[key])
                }
            })
            payload = formData
        }

        try {
            const method = isEditMode.value ? 'patch' : 'post'
            const url = isEditMode.value ? `${endpoint}/${values.id}` : endpoint
            
            await axios({
                method: method,
                url: url,
                data: payload,
                headers: {
                    'Content-Type': hasFile ? 'multipart/form-data' : 'application-json',
                },
            })

            toast.success(isEditMode.value ? 'Data berhasil diperbarui' : 'Data berhasil ditambahkan')

            closeDialog()
            if (onSuccess) onSuccess()
        } catch (error: any) {
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