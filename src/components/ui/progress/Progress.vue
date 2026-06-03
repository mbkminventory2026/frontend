<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import {
  ProgressIndicator,
  ProgressRoot,
  type ProgressRootProps,
} from 'reka-ui'
import { cn } from '@/lib/utils'

type ProgressProps = ProgressRootProps & {
  class?: HTMLAttributes['class']
  indicatorClass?: HTMLAttributes['class']
  value?: number | null
}

const props = withDefaults(
  defineProps<ProgressProps>(),
  {
    modelValue: 0,
  },
)

const safeValue = computed(() => {
  if (props.value !== undefined && props.value !== null) {
    return props.value
  }
  return props.modelValue ?? 0
})

const delegatedProps = computed(() => {
  const { class: _, indicatorClass: __, value: ___, modelValue: ____, ...delegated } = props
  return delegated
})
</script>

<template>
  <ProgressRoot
    v-bind="delegatedProps"
    :model-value="safeValue"
    :class="
      cn(
        'relative h-2 w-full overflow-hidden rounded-full bg-muted',
        props.class,
      )
    "
  >
    <ProgressIndicator
      :class="
        cn(
          'h-full w-full flex-1 bg-primary transition-all duration-500 ease-out',
          props.indicatorClass,
        )
      "
      :style="`transform: translateX(-${100 - Math.min(100, Math.max(0, safeValue ?? 0))}%);`"
    />
  </ProgressRoot>
</template>
