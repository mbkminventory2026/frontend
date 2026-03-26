<script setup lang="ts">
import { Outlet } from '@tanstack/vue-router'
// import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import AppSidebar from '@/components/AppSidebar.vue';

// const { open, setOpen, isMobile, openMobile, setOpenMobile } = useSidebar();

// const closeSidebar = () => {
//   if (isMobile.value) {
//     setOpenMobile(false);
//   } else {
//     setOpen(false);
//   }
// };
</script>

<template>
  <AppSidebar />

  <main class="relative flex min-h-screen w-full flex-col bg-background transition-all duration-300">
    <Outlet />
  </main>
</template>
