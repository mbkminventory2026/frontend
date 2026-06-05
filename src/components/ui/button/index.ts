import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Button } from "./Button.vue"

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md cursor-pointer text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#10756e] text-white hover:bg-[#1a9188] dark:bg-[#094945] dark:text-[#e0f2f1] dark:hover:bg-[#10756e]",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[#10756e] text-[#10756e] hover:bg-[#10756e]/10 dark:border-[#094945] dark:text-[#e0f2f1] dark:hover:bg-[#094945]/30",
        secondary:
          "bg-[#10756e]/10 text-[#10756e] hover:bg-[#10756e]/20 dark:bg-[#094945]/20 dark:text-[#e0f2f1] dark:hover:bg-[#094945]/30",
        ghost:
          "text-[#10756e] hover:bg-[#10756e]/10 dark:text-[#e0f2f1] dark:hover:bg-[#094945]/30",
        link: "text-[#10756e] underline-offset-4 hover:underline dark:text-[#e0f2f1]",
        add:
          "bg-[#10756e] text-white hover:bg-[#1a9188] dark:bg-[#094945] dark:hover:bg-[#10756e]",
        edit:
          "bg-[#F7C548] text-slate-950 hover:bg-[#F7C548]/90 dark:bg-[#F7C548] dark:text-slate-950 dark:hover:bg-[#F7C548]/90",
        detail:
          "hover:bg-accent hover:text-accent-foreground",
        delete:
          "bg-[#AB3428] text-white hover:bg-[#AB3428]/90 dark:bg-[#AB3428] dark:text-white dark:hover:bg-[#AB3428]/90",
      },
      size: {
        "default": "h-9 px-4 py-2 has-[>svg]:px-3",
        "sm": "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        "lg": "h-10 rounded-md px-6 has-[>svg]:px-4",
        "icon": "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)
export type ButtonVariants = VariantProps<typeof buttonVariants>
