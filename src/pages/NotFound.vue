<script setup lang="ts">
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle, EmptyMedia } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/vue-router';
import { BotOff } from 'lucide-vue-next';
</script>

<template>
  <Empty class="min-h-full">
    <EmptyHeader>
        <EmptyMedia variant="icon">
            <BotOff></BotOff>
        </EmptyMedia>
      <EmptyTitle>404 - Not Found</EmptyTitle>
      <EmptyDescription>
        The page you're looking for doesn't exist.
      </EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Button as-child variant="outline">
        <Link to="/">Return Home</Link>
      </Button>
    </EmptyContent>
  </Empty>
</template>
