<script setup lang="ts">
import type { NavigationMenuRootEmits, NavigationMenuRootProps } from "reka-ui"
import { type HTMLAttributes, computed } from "vue"
import {
  NavigationMenuRoot,
  useForwardPropsEmits,
} from "reka-ui"
import { cn } from "@/lib/utils"
import NavigationMenuViewport from "./NavigationMenuViewport.vue"

const props = withDefaults(defineProps<NavigationMenuRootProps & {
  class?: HTMLAttributes["class"]
  viewport?: boolean
}>(), {
  viewport: true,
})
const emits = defineEmits<NavigationMenuRootEmits>()

const delegatedProps = computed(() => {
  const { class: _, viewport: _1, ...delegated } = props
  return delegated
})
const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <NavigationMenuRoot
    v-slot="slotProps"
    data-slot="navigation-menu"
    :data-viewport="viewport"
    v-bind="forwarded"
    :class="cn('group/navigation-menu relative flex max-w-max flex-1 items-center justify-center', props.class)"
  >
    <slot v-bind="slotProps" />
    <NavigationMenuViewport v-if="viewport" />
  </NavigationMenuRoot>
</template>
