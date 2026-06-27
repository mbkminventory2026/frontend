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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useBreadcrumbs } from "@/composables/useBreadcrumbs"
import { Outlet, Link } from "@tanstack/vue-router"
import {
  LayoutDashboard,
  Boxes,
  Users,
  Truck,
  Sparkles,
  Shield,
  Factory,
  ClipboardList,
  ClipboardCheck,
  Building,
} from "lucide-vue-next"
import { useAuthStore } from "@/store/authStore"
import { usePermission } from '@/composables/usePermission'
import { computed, onMounted } from "vue"
import { useBrandingStore } from "@/store/brandingStore"

const { breadcrumbs } = useBreadcrumbs()
const authStore = useAuthStore()
const { hasPermission } = usePermission()
const brandingStore = useBrandingStore()

onMounted(() => {
  brandingStore.fetchBranding()
})



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
  const masterDataTitle = authStore.roleName === "ADMIN_KEUANGAN"
    ? "Referensi Pengadaan"
    : authStore.roleName === "ADMIN_GUDANG"
      ? "Referensi Gudang"
      : authStore.roleName === "ADMIN_PRODUKSI"
        ? "Referensi Produksi"
        : authStore.roleName === "MANAGER"
          ? "Referensi Operasional"
        : "Master Data"

  if (authStore.isMitra) {
    return [
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

  if (authStore.roleName === "ADMIN_SISTEM") {
    const adminSistemItems: NavSection[] = [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        permission: "DASHBOARD_READ",
      },
      {
        title: "Master Data",
        url: "#",
        icon: Boxes,
        items: [
          {
            title: "Departemen",
            url: "/departemen",
            permission: "MASTER_DEPARTEMEN_READ",
          },
          {
            title: "Profil Perusahaan",
            url: "/profil-perusahaan",
            permission: "MASTER_PROFIL_PERUSAHAAN_READ",
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
          {
            title: "History Log",
            url: "/history-log",
            permission: "LOG_READ",
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
    ]

    return adminSistemItems
      .map((item) => {
        if (item.permission && !hasPermission(item.permission)) {
          return null
        }

        if (item.items) {
          return {
            ...item,
            items: item.items.filter((subItem) => !subItem.permission || hasPermission(subItem.permission)),
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
  }

  const rawItems: NavSection[] = [
    {
      title: "Profil Perusahaan",
      url: "/profil-perusahaan",
      icon: Building,
      permission: "MASTER_PROFIL_PERUSAHAAN_READ",
    },
    {
      title: "Daftar Barang",
      url: "/barang",
      icon: Boxes,
      permission: "MASTER_BARANG_READ",
    },
    {
      title: "Jenis Barang",
      url: "/jenis-barang",
      icon: Boxes,
      permission: "MASTER_JENIS_BARANG_READ",
    },
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
      title: masterDataTitle,
      url: "#",
      icon: Boxes,
      items: [
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
          title: "Daftar Size",
          url: "/size",
          permission: "MASTER_SIZE_READ",
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
        {
          title: "History Log",
          url: "/history-log",
          permission: "LOG_READ",
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
          title: "Ajuan Pengembalian",
          url: "/ajuan-pengembalian",
          permission: "WO_READ",
        },
        {
          title: "Master Plan",
          url: "/master-plan",
          permission: "MASTER_PLAN_READ",
        },
        {
          title: "Marker Plan",
          url: "/marker-plan",
          permission: "MARKER_PLAN_READ",
        },
        {
          title: "Spreading & Cutting Plan",
          url: "/spreading-cutting-plan",
          permission: "CUTTING_PLAN_READ",
        },
        {
          title: "Data Approve Cutting Plan",
          url: "/data-approve-cutting-plan",
          permission: "DATA_APPROVE_CUTTING_PLAN_READ",
        },
        {
          title: "Timeline Produksi",
          url: "/timeline-produksi",
          permission: "TIMELINE_READ",
        },
        {
          title: "Packing List",
          url: "/packing-list",
          permission: "PACKING_LIST_READ",
        },
        {
          title: "Surat Jalan Internal",
          url: "/surat-jalan-internal",
          permission: "SURAT_JALAN_INTERNAL_READ",
        },
        {
          title: "Rekonsiliasi Material",
          url: "/rekonsiliasi",
          permission: "REKONSILIASI_READ",
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
          title: "Material List",
          url: "/material-list",
          permission: "MATERIAL_LIST_READ",
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
      title: "Approval",
      url: "#",
      icon: ClipboardCheck,
      items: [
        {
          title: "Cek & Approval",
          url: "/approvals",
          permission: "has_any_approval",
        },
      ],
    },
    {
      title: "Laporan Produksi",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "Ringkasan Laporan",
          url: "/reports",
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
            if (subItem.permission === 'has_any_approval') {
              const approvalPermissions = [
                'PR_INTERNAL_READ',
                'PO_INTERNAL_READ',
                'WO_READ',
                'MARKER_PLAN_READ',
                'TIMELINE_READ',
                'PACKING_LIST_READ'
              ]
              return approvalPermissions.some((permission) => hasPermission(permission))
            }
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
  navSecondary: [],
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
