<script setup lang="ts">
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle, EmptyMedia } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/vue-router';
import { ShieldX } from 'lucide-vue-next';
</script>

<template>
  <Empty class="min-h-screen flex flex-col">
    <EmptyHeader>
        <EmptyMedia variant="icon">
            <ShieldX></ShieldX>
        </EmptyMedia>
      <EmptyTitle>403 - Akses Ditolak</EmptyTitle>
      <EmptyDescription>
        Anda tidak memiliki hak untuk mengakses halaman ini.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child variant="outline">
        <Link to="/dashboard">Kembali ke Dashboard</Link>
      </Button>
    </EmptyContent>
  </Empty>
</template>
