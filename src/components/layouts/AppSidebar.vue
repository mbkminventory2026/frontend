<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar"

import {
  Command,
  type LucideIcon,
} from "lucide-vue-next"

import NavMain from "@/components/layouts/NavMain.vue"
import NavProjects from "@/components/layouts/NavProjects.vue"
import NavSecondary from "@/components/layouts/NavSecondary.vue"
import NavUser from "@/components/layouts/NavUser.vue"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

export interface UserData {
  name: string
  email: string
  avatar: string
}

interface Props extends SidebarProps {
  user: UserData
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
                <Command class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">Acme Inc</span>
                <span class="truncate text-xs">Enterprise</span>
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
    <SidebarFooter>
      <NavUser :user="props.user" />
    </SidebarFooter>
  </Sidebar>
</template>
