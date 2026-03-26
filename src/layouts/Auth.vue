<script setup lang="ts">
import { Outlet } from '@tanstack/vue-router';
</script>
<template>
    <div class="min-h-screen flex flex-col">
        <header class="bg-white p-4 border-b shadow-sm font-bold text-lg">
        Sistem Inventaris ERP
        </header>
        <main class="flex-1 p-6">
            <Outlet />
        </main>
    </div>
</template>