<script setup lang="ts">
import { SidebarIcon } from "lucide-vue-next"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Link } from "@tanstack/vue-router"

const { toggleSidebar } = useSidebar()
defineProps<{
  breadcrumbs: Array<{ label: string; href: string; active?: boolean }>
}>()
</script>

<template>
  <header class="bg-background sticky top-0 z-50 flex w-full items-center border-b">
    <div class="flex h-(--header-height) w-full items-center gap-0 px-0">
      <div class="flex w-(--sidebar-width-icon) items-center justify-center">
        <Button
          class="h-8 w-8"
          variant="ghost"
          size="icon"
          @click="toggleSidebar"
        >
          <SidebarIcon />
        </Button>
      </div>
      <Breadcrumb class="hidden sm:block">
        <BreadcrumbList>
          <template v-for="(item, index) in breadcrumbs" :key="item.href">
            <BreadcrumbItem>
              <BreadcrumbLink v-if="!item.active" :href="item.href">
                <Link :to="item.href">{{ item.label }}</Link>
              </BreadcrumbLink>
              <BreadcrumbPage v-else>{{ item.label }}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator v-if="index < breadcrumbs.length - 1"/>
          </template>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  </header>
</template>
