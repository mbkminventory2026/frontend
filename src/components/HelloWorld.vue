<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ msg: string }>()

const count = ref(0)
</script>

<template>
  <h1 class="text-5xl leading-tight font-bold">{{ msg }}</h1>

  <div class="p-8">
    <button type="button" class="rounded-lg border border-transparent py-2.5 px-5 text-base font-medium bg-[#1a1a1a] dark:bg-[#f9f9f9]0 cursor-pointer transition-colors duration-250 hover:border-[#646cff] focus:outline-[4px_auto_-webkit-focus-ring-color]" @click="count++">
      count is {{ count }}
    </button>
    <p class="mt-4">
      Edit
      <code class="bg-gray-800 p-1 rounded">components/HelloWorld.vue</code> to test HMR
    </p>
  </div>

  <p class="mt-2 text-gray-500">
    Check out
    <a href="https://vuejs.org/guide/quick-start.html#local" target="_blank" class="font-medium text-[#646cff] hover:text-[#535bf2] no-underline"
      >create-vue</a
    >, the official Vue + Vite starter
  </p>
  <p class="mt-2 text-gray-500">
    Learn more about IDE Support for Vue in the
    <a
      href="https://vuejs.org/guide/scaling-up/tooling.html#ide-support"
      target="_blank" class="font-medium text-[#646cff] hover:text-[#535bf2] no-underline"
      >Vue Docs Scaling up Guide</a
    >.
  </p>
  <p class="mt-8 text-[#888]">Click on the Vite and Vue logos to learn more</p>
</template>

<style scoped>
</style>
