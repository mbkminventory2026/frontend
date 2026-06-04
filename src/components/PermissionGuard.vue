<script setup lang="ts">
import { computed } from 'vue'
import { usePermission } from '@/composables/usePermission'

const props = withDefaults(defineProps<{
    permission: string
    mode?: 'hide' | 'disable'
}>(), {
    mode: 'hide'
})

const { hasPermission } = usePermission()
const isAllowed = computed(() => hasPermission(props.permission))
</script>

<template>
    <template v-if="mode === 'hide'">
        <slot v-if="isAllowed" />
    </template>
    <template v-else>
        <div :class="{ 'opacity-50 pointer-events-none select-none': !isAllowed }">
            <slot />
        </div>
    </template>
</template>
