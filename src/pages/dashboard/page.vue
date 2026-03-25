<script setup lang="ts">
import Dashboard from '@/components/dashboard/Dashboard.vue';
import { useDashboard } from '@/composables/dashboard/useDashboard';

const { username, role, handleLogout } = useDashboard();
</script>

<template>
<Dashboard :username="username" :role="role" @logout="handleLogout"/>
</template>