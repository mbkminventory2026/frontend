<script lang="ts">
export const iframeHeight = "800px"
export const description = "A sidebar with a header and a search form."
</script>

<script setup lang="ts">
import AppSidebar from "@/components/layouts/AppSidebar.vue"
import SiteHeader from "@/components/layouts/SiteHeader.vue"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useBreadcrumbs } from "@/composables/useBreadcrumbs"
import { Outlet } from "@tanstack/vue-router"
import {
  BookOpen,
  Bot,
  Frame,
  LifeBuoy,
  Map,
  PieChart,
  Send,
  Settings2,
  SquareTerminal,
} from "lucide-vue-next"

const { breadcrumbs } = useBreadcrumbs()

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ],
  projects: [
    // {
    //   name: "Design Engineering",
    //   url: "#",
    //   icon: Frame,
    // },
    // {
    //   name: "Sales & Marketing",
    //   url: "#",
    //   icon: PieChart,
    // },
    // {
    //   name: "Travel",
    //   url: "#",
    //   icon: Map,
    // },
  ],
}
</script>

<template>
    <SidebarProvider class="flex flex-col [--header-height:calc(--spacing(14))]">
      <SiteHeader :breadcrumbs="breadcrumbs"/>
      <div class="flex flex-1">
        <AppSidebar 
          :user="data.user"
          :nav-main="data.navMain"
          :nav-secondary="data.navSecondary"
          :projects="data.projects"
        />
        <SidebarInset>
          <div class="flex flex-1 flex-col gap-4 p-4">
            <Outlet/>
            <div class="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
</template>
