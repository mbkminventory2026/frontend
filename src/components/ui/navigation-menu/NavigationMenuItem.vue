<script setup lang="ts">
import type { NavigationMenuItemProps } from "reka-ui"
import { type HTMLAttributes, computed } from "vue"
import { NavigationMenuItem } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<NavigationMenuItemProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <NavigationMenuItem
    data-slot="navigation-menu-item"
    v-bind="delegatedProps"
    :class="cn('relative', props.class)"
  >
    <slot />
  </NavigationMenuItem>
</template>
