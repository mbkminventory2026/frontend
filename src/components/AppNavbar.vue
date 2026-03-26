<script setup lang="ts">
import { type Component } from 'vue'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

export interface NavChildItem {
  title: string
  href: string
  description?: string
  icon?: Component
}

export interface NavItem {
  title: string
  href?: string
  children?: NavChildItem[]
  layout?: 'simple' | 'grid' 
}

defineProps<{
  items: NavItem[]
}>();
</script>

<template>
  <NavigationMenu :viewport="false">
    <NavigationMenuList>
      <NavigationMenuItem v-for="item in items" :key="item.title">
        
        <NavigationMenuLink 
          v-if="!item.children?.length" 
          as-child 
          :class="navigationMenuTriggerStyle()"
        >
          <a :href="item.href">{{ item.title }}</a>
        </NavigationMenuLink>

        <template v-else>
          <NavigationMenuTrigger>{{ item.title }}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul
              :class="[
                'p-4 gap-3 w-max max-w-[500px]',
                item.layout === 'grid' 
                  ? 'grid grid-cols-2' 
                  : 'flex flex-col'   
              ]"
            >
              <li v-for="child in item.children" :key="child.title">
                <NavigationMenuLink as-child>
                  <a
                    :href="child.href"
                    class="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                    :class="{'flex gap-3': child.icon && !child.description}"
                  >
                    <div class="flex items-center gap-2">
                      <component :is="child.icon" v-if="child.icon" class="h-4 w-4 text-muted-foreground" />
                      <div class="text-sm font-medium leading-none">{{ child.title }}</div>
                    </div>
                    
                    <p
                      v-if="child.description"
                      class="line-clamp-2 text-sm leading-snug text-muted-foreground mt-2"
                    >
                      {{ child.description }}
                    </p>
                  </a>
                </NavigationMenuLink>
              </li>
            </ul>
          </NavigationMenuContent>
        </template>

      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>