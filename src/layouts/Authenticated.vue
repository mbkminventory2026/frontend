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
import { Outlet, Link } from "@tanstack/vue-router"
import {
  LayoutDashboard,
  Boxes,
  Users,
  Truck,
  LifeBuoy,
  Send,
  Sparkles,
  Shield,
  Factory,
  ClipboardList,
} from "lucide-vue-next"
import { useAuthStore } from "@/store/authStore"
import { usePermission } from '@/composables/usePermission'
import { computed } from "vue"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const { breadcrumbs } = useBreadcrumbs()
const authStore = useAuthStore()
const { hasPermission } = usePermission()

type NavLeaf = {
  title: string
  url: string
  permission?: string
}

type NavSection = {
  title: string
  url: string
  icon: any
  isActive?: boolean
  permission?: string
  items?: NavLeaf[]
}

const navMainItems = computed(() => {
  if (authStore.isMitra) {
    return [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        permission: "DASHBOARD_READ",
      },
      {
        title: "PO Client",
        url: "/po-client",
        icon: Truck,
        permission: "PO_CLIENT_READ",
      },
      {
        title: "Work Order",
        url: "/work-order",
        icon: Factory,
        permission: "WO_READ",
      },
      {
        title: "Production Summary",
        url: "/production-summary",
        icon: LayoutDashboard,
        permission: "PRODUCTION_SUMMARY_READ",
      },
    ].filter((item) => !item.permission || hasPermission(item.permission))
  }

  const rawItems: NavSection[] = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      isActive: true,
      permission: "DASHBOARD_READ",
    },
    {
      title: "Estimasi AI (AI)",
      url: "/ai-estimation",
      icon: Sparkles,
      permission: "AI_ESTIMATION_READ",
    },
    {
      title: "Master Data",
      url: "#",
      icon: Boxes,
      items: [
        {
          title: "Daftar Barang",
          url: "/barang",
          permission: "MASTER_BARANG_READ",
        },
        {
          title: "Jenis Barang",
          url: "/jenis-barang",
          permission: "MASTER_JENIS_BARANG_READ",
        },
        {
          title: "Departemen",
          url: "/departemen",
          permission: "MASTER_DEPARTEMEN_READ",
        },
        {
          title: "Mitra Perusahaan",
          url: "/mitra",
          permission: "MASTER_MITRA_READ",
        },
        {
          title: "Daftar Warna",
          url: "/warna",
          permission: "MASTER_WARNA_READ",
        },
        {
          title: "Profil Perusahaan",
          url: "/company",
          permission: "MASTER_COMPANY_READ",
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
          permission: "USER_READ",
        },
        {
          title: "Reset Password Request",
          url: "/password-reset-requests",
          permission: "PASSWORD_RESET_REQUEST_READ",
        },
      ],
    },
    {
      title: "Role & Hak Akses",
      url: "#",
      icon: Shield,
      items: [
        {
          title: "Manajemen Role",
          url: "/roles",
          permission: "ROLE_READ",
        },
        {
          title: "Hak Akses & Fitur",
          url: "/permissions",
          permission: "PERMISSION_READ",
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
          permission: "PO_CLIENT_READ",
        },
        {
          title: "Work Order",
          url: "/work-order",
          permission: "WO_READ",
        },
        {
          title: "PR Internal",
          url: "/pr-internal",
          permission: "PO_INTERNAL_READ",
        },
        {
          title: "PO Internal",
          url: "/po-internal",
          permission: "PO_INTERNAL_READ",
        },
        {
          title: "Laporan Pengiriman",
          url: "/report-pengiriman",
          permission: "REPORT_READ",
        },
        {
          title: "Laporan Penerimaan",
          url: "/report-penerimaan",
          permission: "REPORT_READ",
        },
        {
          title: "Production Summary",
          url: "/production-summary",
          permission: "PRODUCTION_SUMMARY_READ",
        },
      ],
    },
    {
      title: "Laporan Pabrik",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "Cutting",
          url: "/reports/cutting/create",
          permission: "PRODUCTION_REPORT_CREATE",
        },
        {
          title: "Sewing",
          url: "/reports/sewing/create",
          permission: "PRODUCTION_REPORT_CREATE",
        },
        {
          title: "QC Finish",
          url: "/reports/qc-finish/create",
          permission: "PRODUCTION_REPORT_CREATE",
        },
        {
          title: "Packing",
          url: "/reports/packing/create",
          permission: "PRODUCTION_REPORT_CREATE",
        },
        {
          title: "Pengiriman",
          url: "/reports/pengiriman/create",
          permission: "PRODUCTION_REPORT_CREATE",
        },
      ],
    },
  ]

  return rawItems
    .map((item) => {
      if (item.permission && !hasPermission(item.permission)) {
        return null
      }

      if (item.items) {
        return {
          ...item,
          items: item.items.filter((subItem) => {
            return !subItem.permission || hasPermission(subItem.permission)
          })
        }
      }
      return item
    })
    .filter((item): item is NavSection => {
      if (!item) return false
      if (item.items) {
        return item.items.length > 0
      }
      return true
    })
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
      <SiteHeader />
      <div class="flex flex-1">
        <AppSidebar 
          :nav-main="navMainItems"
          :nav-secondary="data.navSecondary"
          :projects="data.projects"
        />
        <SidebarInset class="min-w-0">
          <div class="flex flex-1 flex-col gap-4 p-4 min-w-0">
            <!-- Breadcrumbs placed above the content section -->
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
            
            <Outlet/>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
</template>
