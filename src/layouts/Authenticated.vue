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
  LayoutDashboard,
  Boxes,
  Users,
  Truck,
  LifeBuoy,
  Send,
  Sparkles
} from "lucide-vue-next"
import { useAuthStore } from "@/store/authStore"
import { computed } from "vue"

const { breadcrumbs } = useBreadcrumbs()
const authStore = useAuthStore()

const currentUser = computed(() => {
  const name = authStore.user?.username || "User"
  const typeLabel = authStore.isMitra ? "Mitra Partner" : "Karyawan Internal"
  return {
    name: name,
    email: typeLabel,
    avatar: "/avatars/admin.jpg",
  }
})

const navMainItems = computed(() => {
  if (authStore.isMitra) {
    return [
      {
        title: "PO Client",
        url: "/po-client",
        icon: Truck,
      }
    ]
  }
  return [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Estimasi AI (AI)",
      url: "/ai-estimation",
      icon: Sparkles,
    },
    {
      title: "Master Data",
      url: "#",
      icon: Boxes,
      items: [
        {
          title: "Daftar Barang",
          url: "/barang",
        },
        {
          title: "Jenis Barang",
          url: "/jenis-barang",
        },
        {
          title: "Departemen",
          url: "/departemen",
        },
        {
          title: "Mitra Perusahaan",
          url: "/mitra",
        },
      ],
    },
    {
      title: "Manajemen Akses",
      url: "#",
      icon: Users,
      items: [
        {
          title: "Daftar Pengguna",
          url: "/users",
        },
        {
          title: "Hak Akses & Fitur",
          url: "/permissions",
        },
      ],
    },
    {
      title: "Logistik & Transaksi",
      url: "#",
      icon: Truck,
      items: [
        {
          title: "PO Client",
          url: "/po-client",
        },
        {
          title: "Work Order",
          url: "/work-order",
        },
        {
          title: "Laporan Pengiriman",
          url: "/report-pengiriman",
        },
      ],
    },
  ]
})

const data = {
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
  projects: [],
}
</script>

<template>
    <SidebarProvider class="flex flex-col [--header-height:calc(--spacing(14))]">
      <SiteHeader :breadcrumbs="breadcrumbs"/>
      <div class="flex flex-1">
        <AppSidebar 
          :user="currentUser"
          :nav-main="navMainItems"
          :nav-secondary="data.navSecondary"
          :projects="data.projects"
        />
        <SidebarInset>
          <div class="flex flex-1 flex-col gap-4 p-4">
            <Outlet/>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
</template>
