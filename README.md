# 🎨 Permatatex IT Inventory System - Frontend Client

[![Vue Version](https://img.shields.io/badge/Vue-3.5+-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Vite Version](https://img.shields.io/badge/Vite-7.0+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind Version](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Frontend user interface for the **Permatatex IT Inventory System**. This Single Page Application (SPA) is built to provide smooth, responsive management panels for both internal employees (Admins, Gudang, Produksi, Keuangan, Manager) and external partners (Mitra/Clients/Suppliers).

---

## 🛠️ Technology Stack

*   **UI Framework:** Vue 3 (Composition API with `<script setup>`)
*   **Asset Bundler:** Vite v7.0+
*   **Programming Language:** TypeScript
*   **Routing System:** `@tanstack/vue-router` (Type-safe file-system based routing with Vite router-plugin auto-generation)
*   **Styling (CSS):** Tailwind CSS v4.0 (Utilizing `@tailwindcss/vite` compiler integration)
*   **Component Library:** PrimeVue v4.x & Reka UI (Optimized radix-style components)
*   **State Management:** Pinia (Core session/authentication store)
*   **Form Control & Validation:** Vee-Validate & Zod
*   **HTTP Client:** Axios (Custom configured instance with interceptors for auth tokens)
*   **E2E Testing:** Playwright Test Suite
*   **Icons:** Lucide Vue Next

---

## 📂 Project Structure

```text
permatatex-project/frontend/
├── src/
│   ├── api/               # Axios services for communicating with Go Backend endpoints
│   ├── assets/            # Static assets (images, global CSS styles)
│   ├── components/        # Shared components (DataTable, AppDialog, Form fields)
│   │   └── dashboard/     # Role-specific dashboard layouts (AdminSistemDashboard, ClientDashboard, etc.)
│   ├── composables/       # Vue Composition helper functions (useTable, usePermission, useDialog)
│   ├── layouts/           # Page wrapper layouts (Authenticated vs. Guest headers/sidebars)
│   ├── lib/               # Utility functions, API Client interceptor, formatters
│   ├── pages/             # Page components mapped to TanStack routes
│   ├── routes/            # TanStack route configuration files
│   ├── schemas/           # Zod schema definitions for form inputs and API responses
│   └── store/             # Pinia store state (authStore, handling JWT tokens and permissions)
├── dist/                  # Production-compiled artifacts folder
└── tests/                 # Playwright E2E end-to-end spec tests
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js v20 or higher
*   npm (or yarn)

### Installation
1. Navigate into the frontend folder:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```

### Development Server
To run the client development server with hot-module replacement (HMR) and automatically watch for routing configuration changes:
```bash
npm run dev
```
Open **http://localhost:5173** in your web browser.

### Route Generation
TanStack Router creates type-safe links from your pages folder. If you add a new page or modify paths, run:
```bash
npm run generate-routes
```

### Production Build
To compile the TypeScript code and bundle files for production hosting:
```bash
npm run build
```
The output files will be created in the `dist/` directory. You can preview the production bundle locally with:
```bash
npm run preview
```

---

## 🧪 Testing

This project uses **Playwright** for complete End-to-End browser workflow testing:

```bash
# Run tests in headless mode
npm run test:e2e

# Run tests in UI mode (interactive runner)
npm run test:e2e:headed

# Open the HTML test report
npm run test:e2e:report
```
