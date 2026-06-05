<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"

import {
  Factory,
  type LucideIcon,
} from "lucide-vue-next"

import NavMain from "@/components/layouts/NavMain.vue"
import NavProjects from "@/components/layouts/NavProjects.vue"
import NavSecondary from "@/components/layouts/NavSecondary.vue"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export interface NavItem {
  title: string
  url: string
  icon: LucideIcon
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export interface ProjectItem {
  name: string
  url: string
  icon: LucideIcon
}

interface Props extends SidebarProps {
  navMain: NavItem[]
  navSecondary: NavItem[]
  projects: ProjectItem[]
}

const props = defineProps<Props>()
</script>

<template>
  <Sidebar
    class="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
    v-bind="props"
    collapsible="icon"
  >
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <a href="#">
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Factory class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold text-sidebar-primary">Permatatex</span>
                <span class="truncate text-xs opacity-80">Garment Industry</span>
              </div>
            </a>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="props.navMain" />
      <NavProjects :projects="props.projects" />
      <NavSecondary :items="props.navSecondary" class="mt-auto" />
    </SidebarContent>
  </Sidebar>
</template>
