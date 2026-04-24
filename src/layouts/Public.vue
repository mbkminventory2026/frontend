<script setup lang="ts">
import AppNavbar from '@/components/AppNavbar.vue';
import { Outlet } from '@tanstack/vue-router';
import { type NavItem } from '@/components/AppNavbar.vue';
import { 
    CircleHelpIcon,
    CircleIcon, 
    CircleCheckIcon 
} from 'lucide-vue-next'

const myNavigation: NavItem[] = [
  // 1. Contoh Direct Link
  {
    title: 'Home',
    href: '/'
  },
  {
    title: 'Docs',
    href: '/docs'
  },
  // 2. Contoh Dropdown Grid + Deskripsi (seperti "Components" sebelumnya)
  {
    title: 'Components',
    layout: 'grid',
    children: [
      { 
        title: 'Accordion', 
        href: '/docs/accordion', 
        description: 'A vertically stacked set of interactive headings that each reveal a section of content.' 
      },
      { 
        title: 'Alert', 
        href: '/docs/alert', 
        description: 'Displays a callout for user attention.' 
      },
    ]
  },
  // 3. Contoh Dropdown Simple (Tanpa deskripsi)
  {
    title: 'Simple',
    layout: 'simple',
    children: [
      { title: 'Components', href: '#' },
      { title: 'Documentation', href: '#' },
      { title: 'Blocks', href: '#' },
    ]
  },
  // 4. Contoh Dropdown dengan Icon
  {
    title: 'With Icon',
    layout: 'simple',
    children: [
      { title: 'Backlog', href: '#', icon: CircleHelpIcon, description: '1234567890' },
      { title: 'To Do', href: '#', icon: CircleIcon },
      { title: 'Done', href: '#', icon: CircleCheckIcon },
    ]
  }
]
</script>
<template>
    <div class="flex flex-col min-h-screen">
        <AppNavbar  :items="myNavigation" class="flex-none"/>
        <main class="flex flex-col flex-1 p-6">
            <Outlet />
        </main>
    </div>
</template>