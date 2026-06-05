<script setup lang="ts">
import type { PrimitiveProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import type { ButtonVariants } from "."
import { Primitive } from "reka-ui"
import { cn } from "@/lib/utils"
import { buttonVariants } from "."
import { useSlots, computed } from "vue"

interface Props extends PrimitiveProps {
  variant?: ButtonVariants["variant"]
  size?: ButtonVariants["size"]
  class?: HTMLAttributes["class"]
}

const props = withDefaults(defineProps<Props>(), {
  as: "button",
})

const slots = useSlots()

const inferredVariant = computed(() => {
  if (props.variant && props.variant !== 'default') {
    return props.variant
  }

  const nodes = slots.default ? slots.default() : []
  
  const scanNodes = (nodesList: any[]): string => {
    for (const node of nodesList) {
      if (!node) continue

      if (typeof node === 'string' || typeof node === 'number') {
        const text = node.toString().toLowerCase().trim()
        if (text.includes('edit') || text.includes('ubah') || text.includes('update') || text.includes('perbarui')) return 'edit'
        if (text.includes('tambah') || text.includes('add') || text.includes('buat') || text.includes('create')) return 'add'
        if (text.includes('view') || text.includes('detail') || text.includes('lihat')) return 'detail'
        if (text.includes('delete') || text.includes('hapus')) return 'delete'
      }

      if (node.type && typeof node.type === 'symbol' && node.type.description === 'Text') {
        const text = (node.children || '').toString().toLowerCase().trim()
        if (text.includes('edit') || text.includes('ubah') || text.includes('update') || text.includes('perbarui')) return 'edit'
        if (text.includes('tambah') || text.includes('add') || text.includes('buat') || text.includes('create')) return 'add'
        if (text.includes('view') || text.includes('detail') || text.includes('lihat')) return 'detail'
        if (text.includes('delete') || text.includes('hapus')) return 'delete'
      }
      
      if (typeof node.children === 'string') {
        const text = node.children.toLowerCase().trim()
        if (text.includes('edit') || text.includes('ubah') || text.includes('update') || text.includes('perbarui')) return 'edit'
        if (text.includes('tambah') || text.includes('add') || text.includes('buat') || text.includes('create')) return 'add'
        if (text.includes('view') || text.includes('detail') || text.includes('lihat')) return 'detail'
        if (text.includes('delete') || text.includes('hapus')) return 'delete'
      }
      
      if (Array.isArray(node.children)) {
        const found = scanNodes(node.children)
        if (found) return found
      }
      
      if (node.dynamicChildren && Array.isArray(node.dynamicChildren)) {
        const found = scanNodes(node.dynamicChildren)
        if (found) return found
      }
    }
    return ''
  }

  const foundVariant = scanNodes(nodes)
  if (foundVariant) {
    return foundVariant as ButtonVariants["variant"]
  }

  return props.variant
})
</script>

<template>
  <Primitive
    data-slot="button"
    :data-variant="inferredVariant"
    :data-size="size"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant: inferredVariant, size }), props.class)"
  >
    <slot />
  </Primitive>
</template>
