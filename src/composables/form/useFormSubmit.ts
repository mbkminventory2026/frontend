import { ref } from 'vue'
import { apiClient } from '@/lib/apiClient'
import { mapPayloadToSnakeCase } from '@/lib/utils'

export function useFormSubmit() {
  const isLoading = ref(false)

  const submitWithFiles = async (method: 'post' | 'put' | 'patch', endpoint: string, payload: Record<string, any>) => {
    isLoading.value = true
    try {
      // Map keys to snake_case first
      const snakeCasePayload = mapPayloadToSnakeCase(payload)
      
      const formData = new FormData()
      let hasFile = false
      
      for (const key in snakeCasePayload) {
        const value = snakeCasePayload[key]
        if (value instanceof File) {
          formData.append(key, value)
          hasFile = true
        } else if (Array.isArray(value) && value[0] instanceof File) {
          value.forEach((file) => formData.append(`${key}[]`, file))
          hasFile = true
        } else if (value !== null && value !== undefined) {
          formData.append(key, value)
        }
      }

      const headers = hasFile ? { 'Content-Type': 'multipart/form-data' } : {}
      const data = hasFile ? formData : snakeCasePayload

      const response = await apiClient[method](endpoint, data, { headers })
      return response.data
    } finally {
      isLoading.value = false
    }
  }

  return { submitWithFiles, isLoading }
}
