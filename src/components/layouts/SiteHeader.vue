<script setup lang="ts">
import { SidebarIcon, LogOut, ChevronsUpDown } from "lucide-vue-next"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/authStore"
import { useRouter } from "@tanstack/vue-router"
import { computed } from "vue"

const { toggleSidebar } = useSidebar()
const authStore = useAuthStore()
const router = useRouter()

const username = computed(() => authStore.user?.username || "User")
const role = computed(() => authStore.roleName || (authStore.isMitra ? "Mitra Partner" : "Karyawan Internal"))

const handleLogout = () => {
  authStore.logout()
  router.navigate({ to: "/login" })
}
</script>

<template>
  <header class="bg-background sticky top-0 z-50 flex w-full items-center border-b">
    <div class="flex h-(--header-height) w-full items-center justify-between px-4">
      <div class="flex items-center">
        <Button
          class="h-8 w-8"
          variant="ghost"
          size="icon"
          @click="toggleSidebar"
        >
          <SidebarIcon />
        </Button>
      </div>

      <div class="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" class="relative h-10 flex items-center gap-2 px-2 hover:bg-accent rounded-lg cursor-pointer">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage src="/avatars/admin.jpg" :alt="username" />
                <AvatarFallback class="rounded-lg bg-teal-800 text-white font-bold">
                  {{ username.slice(0, 2).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <div class="hidden md:flex flex-col text-left text-xs leading-tight">
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ username }}</span>
                <span class="text-muted-foreground text-[10px]">{{ role }}</span>
              </div>
              <ChevronsUpDown class="size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-56" align="end" :side-offset="4">
            <DropdownMenuLabel class="p-0 font-normal">
              <div class="flex items-center gap-2 px-2 py-1.5 text-left text-sm">
                <Avatar class="h-8 w-8 rounded-lg">
                  <AvatarImage src="/avatars/admin.jpg" :alt="username" />
                  <AvatarFallback class="rounded-lg bg-teal-800 text-white font-bold">
                    {{ username.slice(0, 2).toUpperCase() }}
                  </AvatarFallback>
                </Avatar>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-semibold">{{ username }}</span>
                  <span class="truncate text-xs text-muted-foreground">{{ role }}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="handleLogout" class="text-red-600 hover:text-red-700 dark:text-red-400 cursor-pointer">
              <LogOut class="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </header>
</template>
