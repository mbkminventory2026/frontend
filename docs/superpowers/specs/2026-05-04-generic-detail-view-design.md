# Design Spec - Generic Schema-Driven Detail View

This document outlines the design for a generic, schema-driven detail view component system to accelerate the development of detail pages in the frontend project.

## 1. Problem Statement
Developing detail pages for various entities (e.g., Report Pengiriman, Pokemon, etc.) currently involves repetitive work: fetching data by ID, creating layouts, handling loading states, and implementing common actions like Edit and Delete. We need a standardized way to render these pages with minimal boilerplate while maintaining flexibility for specific data types (like files).

## 2. Proposed Architecture

### A. Schema Definition (`src/schemas/detail/detail.ts`)
A centralized type definition for how fields should be rendered in the detail view.

```typescript
import { type Component } from 'vue';

export type DetailFieldType = 'text' | 'date' | 'number' | 'currency' | 'badge' | 'file' | 'image';

export interface DetailField {
  key: string;
  label: string;
  type?: DetailFieldType;
  variant?: 'default' | 'file' | 'image';
  formatter?: (val: any) => string;
  icon?: Component;
  className?: string; // For layout control per field
  span?: 'col-1' | 'col-2' | 'full'; // Grid span control
}

export type DetailSchema = DetailField[];
```

### B. The Generic Component (`src/components/AppDetailView.vue`)
A "Dumb" presentational component built with `shadcn-vue` (Card, Button, Skeleton).

- **Props:**
    - `title`: String
    - `description`: String (optional)
    - `data`: Object (The entity data)
    - `schema`: `DetailSchema`
    - `isLoading`: Boolean
    - `showEdit`: Boolean (default true)
    - `showDelete`: Boolean (default true)
- **Features:**
    - **Responsive Grid:** Fields automatically arranged.
    - **Built-in Formatters:** Handles currency, dates, and badges automatically if type is provided.
    - **File Handling:** Renders download links and file icons for `type: 'file'`.
    - **Actions:** Emits `edit` and `delete` events. Integrates `useDelete` for confirmation.
    - **Slots:** 
        - `item-<key>`: For custom field rendering.
        - `header-actions`: For extra buttons in the header.

### C. The Composable (`src/composables/useDetail.ts`)
A helper to reduce boilerplate in the "Smart" page component.

```typescript
export function useDetail<T>(fetchFn: (id: string | number) => Promise<T>, id: string | number) {
  const data = ref<T | null>(null);
  const isLoading = ref(false);
  const error = ref<any>(null);

  const fetchData = async () => {
    isLoading.value = true;
    try {
      data.value = await fetchFn(id);
    } catch (e) {
      error.value = e;
    } finally {
      isLoading.value = false;
    }
  };

  return { data, isLoading, error, fetchData };
}
```

## 3. Developer Experience (DX) Workflow

1.  **Define Schema:** Create an array of fields.
2.  **Fetch Data:** Use `useDetail` or TanStack Query in the page.
3.  **Render:** Use `<AppDetailView :data="data" :schema="schema" />`.
4.  **Customize:** Use slots for complex fields (e.g., a status that needs a specific color logic).

## 4. Visual Layout
The component will use a `Card` layout:
- **Header:** Title, Description, and Action Buttons (Edit/Delete).
- **Content:** A 2-column grid on desktop, 1-column on mobile.
- **Fields:** Label on top, Value below.

## 5. Security & Safety
- Sanitize data before rendering.
- Ensure `useDelete` confirmation is triggered before emitting delete events or performing actions.
