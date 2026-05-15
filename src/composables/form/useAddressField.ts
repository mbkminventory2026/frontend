import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useAddressField(rawAddressSource: MaybeRefOrGetter<string | null | undefined>) {
  const parsedAddress = computed(() => {
    const rawAddress = toValue(rawAddressSource)
    if (!rawAddress) return { main: '', details: '' }
    
    if (rawAddress.includes(' | ')) {
      const parts = rawAddress.split(' | ')
      return {
        main: parts[0],
        details: parts.slice(1).join(', ')
      }
    }
    
    return { main: rawAddress, details: '' }
  })

  return { parsedAddress }
}
