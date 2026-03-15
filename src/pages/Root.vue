<script setup lang="ts">
import { Link, Outlet } from '@tanstack/vue-router'
</script>

<template>
  <div class="p-2 flex gap-2">
    <Link to="/" class="[&.active]:font-bold"> Home </Link>
  </div>
  <hr />
  <Outlet />
</template>
