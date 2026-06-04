<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Form, Field as VeeField } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Field,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import AppFilePicker from '@/components/AppFilePicker.vue'
import { type DialogSchemaType, type DialogField } from '@/schemas/dialog/dialog'

interface Props {
  title: string
  description?: string
  submitLabel?: string
  schema: DialogSchemaType
  isOpen: boolean
  initialValues?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  submitLabel: 'Save changes',
  initialValues: () => ({}),
})

const emit = defineEmits(['submit', 'update:isOpen'])

// Reactive form values tracker — keeps track of current form values for dependency evaluation
const formValues = ref<Record<string, any>>({})

// Normalized initial values — ensures select values are strings for Radix UI
const normalizedInitialValues = computed(() => {
  const vals = { ...props.initialValues }
  if (props.schema && Array.isArray(props.schema)) {
    props.schema.forEach((field) => {
      if (field && field.type === 'select' && vals[field.key] !== undefined && vals[field.key] !== null) {
        vals[field.key] = String(vals[field.key])
      }
    })
  }
  return vals
})



// Initialize formValues when dialog opens or initialValues change
// Initialize and sync formValues when dialog opens or initialValues change
watch(
  [() => props.isOpen, () => props.initialValues],
  ([open, initVals]) => {
    console.log("[DEBUG] watch open/initialValues:", open, initVals)
    if (open) {
      formValues.value = { ...normalizedInitialValues.value }
    } else {
      formValues.value = {}
    }
  },
  { deep: true, immediate: true }
)

/**
 * Evaluate a dependency condition against the current form values.
 * Returns true if the condition IS MET.
 */
function evaluateDependency(dep: DialogField['dependency']): boolean {
  if (!dep) return true

  const parentValue = formValues.value[dep.parentKey]

  switch (dep.condition) {
    case '===':
      return String(parentValue) === String(dep.value)
    case '!==':
      return String(parentValue) !== String(dep.value)
    case '>':
      return Number(parentValue) > Number(dep.value)
    case '<':
      return Number(parentValue) < Number(dep.value)
    case 'includes':
      if (Array.isArray(parentValue)) {
        return parentValue.map(String).includes(String(dep.value))
      }
      return String(parentValue ?? '').includes(String(dep.value))
    case 'in':
      if (parentValue === undefined || parentValue === null || parentValue === '') return false
      return String(dep.value).split(',').includes(String(parentValue))
    default:
      return true
  }
}

/**
 * Determine whether a field should be VISIBLE based on its dependency config.
 * - action "show": field is visible only when condition IS MET
 * - action "hide": field is hidden when condition IS MET (visible when NOT met)
 * - no dependency: always visible
 */
function isFieldVisible(field: DialogField): boolean {
  if (!field.dependency) return true

  const conditionMet = evaluateDependency(field.dependency)

  switch (field.dependency.action) {
    case 'show':
      return conditionMet
    case 'hide':
      return !conditionMet
    case 'enable':
    case 'disable':
      // enable/disable don't affect visibility
      return true
    default:
      return true
  }
}

/**
 * Determine whether a field should be DISABLED based on its dependency config.
 * - action "disable": field is disabled when condition IS MET
 * - action "enable": field is enabled only when condition IS MET (disabled when NOT met)
 */
function isFieldDisabled(field: DialogField): boolean {
  if (field.key === 'id_role' && formValues.value['user_type'] === 'Mitra') {
    return true
  }

  if (!field.dependency) return false

  const conditionMet = evaluateDependency(field.dependency)

  switch (field.dependency.action) {
    case 'disable':
      return conditionMet
    case 'enable':
      return !conditionMet
    default:
      return false
  }
}

// Computed list of currently visible fields
const visibleFields = computed(() => {
  return (props.schema || []).filter((field) => isFieldVisible(field))
})

/**
 * Build a Zod schema for a single field based on its type and rules.
 */
function buildFieldZodSchema(field: DialogField): z.ZodTypeAny {
  const isRequired = typeof field.rules === 'string' && field.rules.includes('required')
  const isEmail = typeof field.rules === 'string' && field.rules.includes('email')

  switch (field.type) {
    case 'number': {
      let schema = z.coerce.number({ invalid_type_error: `${field.label} harus berupa angka` })
      if (isRequired) {
        schema = schema.min(0, `${field.label} wajib diisi`)
      }
      return isRequired ? schema : schema.optional()
    }

    case 'checkbox':
    case 'switch': {
      let schema: z.ZodTypeAny = z.boolean()
      if (isRequired) {
        // For required checkboxes, the value must be true (e.g., "agree to terms")
        schema = z.literal(true, {
          errorMap: () => ({ message: `${field.label} harus dicentang` }),
        })
      }
      return schema
    }

    case 'permissions-selector':
    case 'multi-checkbox': {
      let schema = z.array(z.union([z.string(), z.number()]))
      if (isRequired) {
        return schema.min(1, `${field.label} wajib diisi`)
      }
      return schema.optional()
    }

    case 'file':
    case 'image': {
      // File inputs produce File objects; use z.any() with custom refinement
      if (isRequired) {
        return z.any().refine((val) => val != null, { message: `${field.label} wajib diisi` })
      }
      return z.any().optional()
    }

    case 'email': {
      let schema = z.string().email('Format email salah')
      if (isRequired) {
        schema = z.string().min(1, `${field.label} wajib diisi`).email('Format email salah')
      }
      return isRequired ? schema : schema.optional()
    }

    case 'textarea':
    case 'text':
    case 'password':
    case 'date':
    case 'select':
    default: {
      let schema: z.ZodTypeAny = z.string()
      if (isRequired) {
        schema = z.string().min(1, `${field.label} wajib diisi`)
      }
      if (isEmail) {
        schema = z.string().email('Format email salah')
      }
      return isRequired ? schema : (schema as z.ZodString).optional()
    }
  }
}

// Validation schema — only validate visible fields
const validationSchema = computed(() => {
  const schemaObject: Record<string, any> = {}

  visibleFields.value.forEach((field) => {
    let fieldSchema = buildFieldZodSchema(field)

    // If the field is disabled, make it optional
    if (isFieldDisabled(field)) {
      fieldSchema = fieldSchema.optional()
    }

    schemaObject[field.key] = fieldSchema
  })

  return toTypedSchema(z.object(schemaObject))
})

// Layout — split visible fields by position
const fields = computed(() => {
  const visible = visibleFields.value
  const left = visible.filter((f) => f.position === 'left' || !f.position)
  const right = visible.filter((f) => f.position === 'right')
  const full = visible.filter((f) => f.position === 'full')

  return {
    left,
    right,
    full,
    hasTwoColumns: right.length > 0,
  }
})

/**
 * Handle field value change — update formValues tracker.
 * This is called on every input/select change so dependencies react immediately.
 */
function onFieldChange(key: string, value: any) {
  formValues.value = { ...formValues.value, [key]: value }
}



function coerceValue(value: any, field: DialogField): any {
  if (value == null || value === '') return value

  switch (field.type) {
    case 'number':
      return Number(value)
    case 'checkbox':
    case 'switch':
      return Boolean(value)
    case 'select': {
      // If all options are numeric, coerce to number
      const allNumeric = field.options?.every((opt) => typeof opt.value === 'number')
      return allNumeric ? Number(value) : value
    }
    case 'permissions-selector':
    case 'multi-checkbox': {
      if (Array.isArray(value)) {
        const allNumeric = field.options?.every((opt) => typeof opt.value === 'number')
        return allNumeric ? value.map(Number) : value
      }
      return value
    }
    default:
      return value
  }
}

function onHandleSubmit(values: any) {
  // Build a lookup of field definitions by key for type coercion
  const fieldMap = new Map(visibleFields.value.map((f) => [f.key, f]))
  
  // result starts with all initial values to preserve IDs and other metadata
  const result = { ...props.initialValues }

  for (const [key, value] of Object.entries(values)) {
    const field = fieldMap.get(key)
    if (field) {
      result[key] = coerceValue(value, field)
    }
  }

  // Include file values from formValues (since vee-validate doesn't track native file inputs)
  visibleFields.value.forEach((field) => {
    if ((field.type === 'file' || field.type === 'image') && formValues.value[field.key]) {
      result[field.key] = formValues.value[field.key]
    }
  })

  // Include/fallback disabled fields from formValues if they are not in vee-validate values
  visibleFields.value.forEach((field) => {
    if (result[field.key] === undefined && formValues.value[field.key] !== undefined) {
      result[field.key] = coerceValue(formValues.value[field.key], field)
    }
  })

  emit('submit', result)
}

function updateOpen(val: boolean) {
  emit('update:isOpen', val)
}

/**
 * Get the file input accept attribute based on field config.
 */
function getFileAccept(field: DialogField): string | undefined {
  if (field.type === 'image') {
    return field.fileConfig?.accept ?? 'image/*'
  }
  return field.fileConfig?.accept
}

function isMultiCheckboxDisabled(field: DialogField, optVal: any, formVal: any): boolean {
  if (isFieldDisabled(field)) return true
  
  const allAccessOpt = field.options?.find((o: any) => o.code === 'ALL_ACCESS' || o.label.trim().toLowerCase().replace(/\s+/g, ' ') === 'all access')
  if (!allAccessOpt) return false
  
  const isAllAccessSelected = Array.isArray(formVal) && formVal.some(v => String(v) === String(allAccessOpt.value))
  return isAllAccessSelected && String(optVal) !== String(allAccessOpt.value)
}

function handleMultiCheckboxChange(field: DialogField, optVal: any, formVal: any, checked: boolean): any[] {
  const allAccessOpt = field.options?.find((o: any) => o.code === 'ALL_ACCESS' || o.label.trim().toLowerCase().replace(/\s+/g, ' ') === 'all access')
  let currentVals = Array.isArray(formVal) ? [...formVal] : []
  
  if (checked) {
    if (allAccessOpt && String(optVal) === String(allAccessOpt.value)) {
      currentVals = [optVal]
    } else {
      currentVals.push(optVal)
    }
  } else {
    currentVals = currentVals.filter(v => String(v) !== String(optVal))
  }
  return currentVals
}

// Helpers and Computed Properties for permissions-selector
const permissionGroups = computed(() => {
  const selectField = props.schema.find(f => f.type === 'permissions-selector')
  if (!selectField || !selectField.options) return []

  const opts = selectField.options as any[]
  const groupsMap = new Map<string, { key: string, label: string, readCodes: string[], readValues: any[], actions: any[] }>()

  const PAGE_LABELS: Record<string, string> = {
    USER: "Daftar Pengguna (User)",
    ROLE: "Manajemen Role",
    PERMISSION: "Hak Akses & Fitur (Permission)",
    MASTER_BARANG: "Daftar Barang",
    MASTER_MITRA: "Mitra Perusahaan",
    MASTER_JENIS_BARANG: "Jenis Barang",
    MASTER_COMPANY: "Profile Perusahaan (Company)",
    MASTER_DEPARTEMEN: "Departemen",
    PO_CLIENT: "PO Client",
    PR_INTERNAL: "PR Internal",
    PO_INTERNAL: "PO Internal",
    WO: "Work Order (WO)",
    PRODUCTION_SUMMARY: "Production Summary",
    PRODUCTION_REPORT: "Laporan Produksi",
    TIMELINE: "Timeline",
    MARKER_PLAN: "Marker Plan",
    CUTTING_PLAN: "Cutting Plan",
    PACKING_LIST: "Packing List",
    INVENTORY: "Inventory (Gudang)",
    SURAT_JALAN: "Surat Jalan",
    REPORT: "Laporan (Report)",
    LOG: "Log Aktivitas",
    DASHBOARD: "Dashboard",
  }

  opts.forEach(opt => {
    if (opt.code === 'ALL_ACCESS') return

    const code = opt.code || ''
    let key = ''
    if (code.startsWith('MASTER_')) {
      const parts = code.split('_')
      key = parts.slice(0, 2).join('_')
    } else if (code.startsWith('PO_') || code.startsWith('PR_')) {
      const parts = code.split('_')
      key = parts.slice(0, 2).join('_')
    } else if (code.startsWith('SURAT_JALAN_')) {
      key = 'SURAT_JALAN'
    } else if (code.startsWith('PRODUCTION_')) {
      const parts = code.split('_')
      key = parts.slice(0, 2).join('_')
    } else if (code.startsWith('MARKER_') || code.startsWith('CUTTING_') || code.startsWith('PACKING_')) {
      const parts = code.split('_')
      key = parts.slice(0, 2).join('_')
    } else {
      const parts = code.split('_')
      key = parts[0]
    }

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        key,
        label: PAGE_LABELS[key] || key.replace(/_/g, ' '),
        readCodes: [],
        readValues: [],
        actions: []
      })
    }

    const group = groupsMap.get(key)!
    const isRead = code.endsWith('_READ') || code === 'INVENTORY_RECEIVE'

    if (isRead) {
      group.readCodes.push(code)
      group.readValues.push(opt.value)
    } else {
      let actionLabel = ''
      const parts = code.split('_')
      const actionWord = parts[parts.length - 1]

      if (code === 'USER_ROLE_ASSIGN') {
        actionLabel = 'Assign Role'
      } else {
        actionLabel = actionWord.charAt(0).toUpperCase() + actionWord.slice(1).toLowerCase()
      }

      group.actions.push({
        label: actionLabel,
        value: opt.value,
        code: code
      })
    }
  })

  return Array.from(groupsMap.values()).filter(g => g.readValues.length > 0 || g.actions.length > 0)
})

const selectedPagesWithActions = computed(() => {
  const selectField = props.schema.find(f => f.type === 'permissions-selector')
  if (!selectField) return []

  const currentVals = formValues.value[selectField.key] || []
  return permissionGroups.value.filter(g => {
    if (!g.readValues || g.readValues.length === 0) return false
    const isSelected = g.readValues.every((rv: any) => currentVals.some((v: any) => String(v) === String(rv)))
    return isSelected && g.actions.length > 0
  })
})

function getAllAccessId() {
  const selectField = props.schema.find(f => f.type === 'permissions-selector')
  const opt = selectField?.options?.find((o: any) => o.code === 'ALL_ACCESS')
  return opt ? opt.value : null
}

function isAllAccessSelected(value: any): boolean {
  const allAccessId = getAllAccessId()
  if (!allAccessId) return false
  return Array.isArray(value) && value.some(v => String(v) === String(allAccessId))
}

function handleAllAccessToggle(checked: boolean, handleChange: any) {
  const allAccessId = getAllAccessId()
  if (!allAccessId) return
  const newVals = checked ? [allAccessId] : []
  handleChange(newVals)
  onFieldChange('hak_akses_ids', newVals)
}

function isPageSelected(group: any, value: any): boolean {
  console.log(`[DEBUG] isPageSelected for ${group.label}, value:`, value, "readValues:", group.readValues);
  if (!group.readValues || group.readValues.length === 0) return false
  const res = Array.isArray(value) && group.readValues.every((rv: any) => value.some((v: any) => String(v) === String(rv)))
  console.log(`[DEBUG] isPageSelected result for ${group.label}:`, res);
  return res
}

function handlePageToggle(group: any, checked: any, value: any, handleChange: any) {
  console.log(`=== [DEBUG] PAGE CHECKBOX TOGGLED (DIALOG) ===`);
  console.log(`Halaman: ${group.label} (${group.key})`);
  console.log(`Status: ${checked ? 'DIPILIH (Checked)' : 'BATAL DIPILIH (Unchecked)'}`);
  console.log(`Otomatis Grant Hak Akses GET/READ:`, group.readCodes);
  if (group.actions && group.actions.length > 0) {
      console.log(`Daftar Operasi Khusus (Field 4) yang ${checked ? 'akan muncul' : 'dihilangkan'}:`);
      group.actions.forEach((a: any) => {
          console.log(`  - ${a.label} [Kode: ${a.code}]`);
      });
  } else {
      console.log(`Tidak ada Operasi Khusus (Field 4) untuk halaman ini.`);
  }
  console.log(`==============================================`);

  let currentVals = Array.isArray(value) ? [...value] : []
  if (checked) {
    group.readValues.forEach((rv: any) => {
      if (!currentVals.some(v => String(v) === String(rv))) {
        currentVals.push(rv)
      }
    })
  } else {
    const readValsStr = group.readValues.map((rv: any) => String(rv))
    currentVals = currentVals.filter(v => !readValsStr.includes(String(v)))

    const actionValsStr = group.actions.map((a: any) => String(a.value))
    currentVals = currentVals.filter(v => !actionValsStr.includes(String(v)))
  }
  handleChange(currentVals)
  onFieldChange('hak_akses_ids', currentVals)
}

function isActionSelected(actionVal: any, value: any): boolean {
  return Array.isArray(value) && value.some(v => String(v) === String(actionVal))
}

function handleActionToggle(actionVal: any, checked: any, value: any, handleChange: any) {
  let currentVals = Array.isArray(value) ? [...value] : []
  if (checked) {
    currentVals.push(actionVal)
  } else {
    currentVals = currentVals.filter(v => String(v) !== String(actionVal))
  }
  handleChange(currentVals)
  onFieldChange('hak_akses_ids', currentVals)
}

function watchFormValues(values: any, setFieldValue: any) {
  if (values && values.user_type === 'Mitra') {
    const roleField = props.schema.find((f) => f.key === 'id_role')
    const clientOpt = roleField?.options?.find(
      (opt) => String(opt.label).toUpperCase() === 'CLIENT' || String(opt.value).toUpperCase() === 'CLIENT'
    )
    if (clientOpt) {
      const clientVal = String(clientOpt.value)
      if (String(values.id_role) !== clientVal) {
        setTimeout(() => {
          setFieldValue('id_role', clientVal)
          onFieldChange('id_role', clientVal)
        }, 0)
      }
    }
  }
  return ''
}
</script>

<template>
  <Dialog :open="props.isOpen" @update:open="updateOpen">
    <DialogContent :class="[fields.hasTwoColumns ? 'sm:max-w-[700px]' : 'sm:max-w-[425px]']">
        <DialogHeader>
            <DialogTitle>{{ props.title }}</DialogTitle>
            <DialogDescription v-if="props.description">
                {{ props.description }}
            </DialogDescription>
        </DialogHeader>

        <Form
            v-if="props.isOpen"
            v-slot="{ handleSubmit, values, setFieldValue }"
            as=""
            :validation-schema="validationSchema"
            :initial-values="normalizedInitialValues"
        >
            <form id="dialogForm" @submit.prevent="handleSubmit(onHandleSubmit)">
                <span class="hidden">{{ watchFormValues(values, setFieldValue) }}</span>
                <div :class="['grid gap-4', fields.hasTwoColumns ? 'grid-cols-2' : 'grid-cols-1']">
                    <VeeField
                        v-for="item in visibleFields"
                        :key="item.key"
                        v-slot="{ componentField, errors, handleChange, value }"
                        :name="item.key"
                    >
                        <div
                            :class="[
                                fields.hasTwoColumns
                                    ? item.position === 'full'
                                        ? 'col-span-2'
                                        : item.position === 'right'
                                            ? 'col-start-2'
                                            : 'col-start-1'
                                    : 'col-span-1'
                            ]"
                        >
                            <Field :data-invalid="!!errors.length">
                                <FieldLabel :for="item.key">{{ item.label }}</FieldLabel>
                                
                                <!-- Select -->
                                <template v-if="item.type === 'select'">
                                    <Select
                                        :model-value="value !== undefined && value !== null ? String(value) : undefined"
                                        :disabled="isFieldDisabled(item)"
                                        @update:model-value="(val: any) => { handleChange(val); onFieldChange(item.key, val) }"
                                    >
                                        <SelectTrigger :id="item.key">
                                            <SelectValue :placeholder="item.placeholder" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                <template v-if="item.options && item.options.length > 0">
                                                    <SelectItem
                                                        v-for="opt in item.options"
                                                        :key="String(opt.value)"
                                                        :value="String(opt.value)"
                                                    >
                                                        {{ opt.label }}
                                                    </SelectItem>
                                                </template>
                                                <template v-else>
                                                    <div class="py-6 text-center text-sm text-muted-foreground">
                                                        No Data
                                                    </div>
                                                </template>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </template>

                                <!-- Textarea -->
                                <template v-else-if="item.type === 'textarea'">
                                    <Textarea
                                        :id="item.key"
                                        :placeholder="item.placeholder"
                                        :disabled="isFieldDisabled(item)"
                                        v-bind="componentField"
                                        @update:model-value="(val: any) => onFieldChange(item.key, val)"
                                        @input="(e: Event) => onFieldChange(item.key, (e.target as HTMLTextAreaElement)?.value)"
                                    />
                                </template>

                                <!-- Checkbox -->
                                <template v-else-if="item.type === 'checkbox'">
                                    <div class="flex items-center gap-2 mt-1">
                                        <Checkbox
                                            :id="item.key"
                                            :checked="!!value"
                                            :disabled="isFieldDisabled(item)"
                                            @update:checked="(val: boolean) => { handleChange(val); onFieldChange(item.key, val) }"
                                        />
                                        <label :for="item.key" class="text-sm text-muted-foreground cursor-pointer select-none">
                                            {{ item.placeholder }}
                                        </label>
                                    </div>
                                </template>

                                <!-- Multi Checkbox -->
                                <template v-else-if="item.type === 'multi-checkbox'">
                                    <div class="grid grid-cols-2 gap-2 mt-1 border rounded-lg p-3 bg-slate-50/50 max-h-60 overflow-y-auto">
                                        <div 
                                            v-for="opt in item.options" 
                                            :key="String(opt.value)"
                                            class="flex items-center gap-2"
                                        >
                                            <Checkbox
                                                :id="`${item.key}-${opt.value}`"
                                                :checked="Array.isArray(values[item.key]) && values[item.key].some((v: any) => String(v) === String(opt.value))"
                                                :disabled="isMultiCheckboxDisabled(item, opt.value, values[item.key])"
                                                @update:checked="(checked: any) => {
                                                    const newVals = handleMultiCheckboxChange(item, opt.value, values[item.key], checked);
                                                    handleChange(newVals);
                                                    onFieldChange(item.key, newVals);
                                                }"
                                            />
                                            <label :for="`${item.key}-${opt.value}`" class="text-xs text-slate-700 cursor-pointer select-none font-medium">
                                                {{ opt.label }}
                                            </label>
                                        </div>
                                    </div>
                                </template>

                                <!-- Custom Permissions Selector -->
                                <template v-else-if="item.type === 'permissions-selector'">
                                    <div class="border rounded-lg p-4 bg-slate-50/50 space-y-4 col-span-2">
                                        <!-- 1. All Access Checkbox -->
                                        <div class="flex items-center gap-2 pb-2 border-b">
                                            <Checkbox
                                                :id="`${item.key}-all-access`"
                                                :checked="isAllAccessSelected(values[item.key])"
                                                @click="handleAllAccessToggle(!isAllAccessSelected(values[item.key]), handleChange)"
                                            />
                                            <label :for="`${item.key}-all-access`" class="text-sm font-bold text-indigo-700 cursor-pointer select-none">
                                                Grant All Access (Emergency Full Access)
                                            </label>
                                        </div>

                                        <!-- If not All Access, show Pages and Actions -->
                                        <div v-if="!isAllAccessSelected(values[item.key])" class="space-y-4">
                                            <!-- FIELD 3: Pages Checklist -->
                                            <div>
                                                <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-2">
                                                    1. Halaman yang Ingin Diakses (Otomatis mendapatkan Hak Akses GET)
                                                </span>
                                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto border rounded-md p-3 bg-white pr-1">
                                                    <div v-for="group in permissionGroups" :key="group.key" class="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded transition-colors duration-150">
                                                        <Checkbox
                                                            :id="`${item.key}-page-${group.key}`"
                                                            :checked="isPageSelected(group, values[item.key])"
                                                            @click="handlePageToggle(group, !isPageSelected(group, values[item.key]), values[item.key], handleChange)"
                                                        />
                                                        <label :for="`${item.key}-page-${group.key}`" class="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                                            {{ group.label }}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- FIELD 4: Specific Actions -->
                                            <div>
                                                <span class="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-2">
                                                    2. Opsi Aksi Khusus (Hanya tampil untuk Halaman yang dipilih di atas)
                                                </span>
                                                
                                                <!-- Display selected pages actions -->
                                                <div class="border rounded-md p-3 bg-white max-h-[220px] overflow-y-auto space-y-3">
                                                    <!-- Check if there are any selected pages with actions -->
                                                    <template v-if="selectedPagesWithActions.length > 0">
                                                        <div 
                                                            v-for="group in selectedPagesWithActions" 
                                                            :key="group.key" 
                                                            class="border-b last:border-b-0 pb-2.5 last:pb-0 space-y-1.5"
                                                        >
                                                            <span class="text-xs font-bold text-slate-800 block">
                                                                {{ group.label }}
                                                            </span>
                                                            <div class="flex flex-wrap gap-x-4 gap-y-1.5 pl-2">
                                                                <div v-for="actionPerm in group.actions" :key="String(actionPerm.value)" class="flex items-center gap-1.5">
                                                                    <Checkbox
                                                                        :id="`${item.key}-action-${actionPerm.value}`"
                                                                        :checked="isActionSelected(actionPerm.value, values[item.key])"
                                                                        @click="handleActionToggle(actionPerm.value, !isActionSelected(actionPerm.value, values[item.key]), values[item.key], handleChange)"
                                                                    />
                                                                    <label :for="`${item.key}-action-${actionPerm.value}`" class="text-[11px] text-slate-600 cursor-pointer select-none font-medium">
                                                                        {{ actionPerm.label }}
                                                                    </label>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </template>
                                                    <template v-else>
                                                        <p class="text-xs text-slate-400 italic text-center py-4">
                                                            Pilih halaman di atas yang memiliki opsi aksi khusus untuk mulai mengaturnya.
                                                        </p>
                                                    </template>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </template>

                                <!-- Switch -->
                                <template v-else-if="item.type === 'switch'">
                                    <div class="flex items-center gap-2 mt-1">
                                        <Switch
                                            :id="item.key"
                                            :checked="!!value"
                                            :disabled="isFieldDisabled(item)"
                                            @update:checked="(val: boolean) => { handleChange(val); onFieldChange(item.key, val) }"
                                        />
                                        <label :for="item.key" class="text-sm text-muted-foreground cursor-pointer select-none">
                                            {{ item.placeholder }}
                                        </label>
                                    </div>
                                </template>

                                <!-- File / Image -->
                                <template v-else-if="item.type === 'file' || item.type === 'image'">
                                    <AppFilePicker
                                        :model-value="value"
                                        :accept="getFileAccept(item)"
                                        :preview="item.type === 'image'"
                                        :disabled="isFieldDisabled(item)"
                                        @update:model-value="(file: any) => { handleChange(file); onFieldChange(item.key, file) }"
                                    />
                                    <p v-if="item.fileConfig?.maxSize" class="text-xs text-muted-foreground mt-1">
                                        Maks. {{ item.fileConfig.maxSize }} MB
                                    </p>
                                </template>

                                <!-- Standard Input (text, number, password, email, date) -->
                                <template v-else>
                                    <Input
                                        :id="item.key"
                                        :type="item.type"
                                        :placeholder="item.placeholder"
                                        :disabled="isFieldDisabled(item)"
                                        v-bind="componentField"
                                        @update:model-value="(val: any) => onFieldChange(item.key, val)"
                                        @input="(e: Event) => onFieldChange(item.key, (e.target as HTMLInputElement)?.value)"
                                    />
                                </template>

                                <FieldError v-if="errors.length" :errors="errors" />
                            </Field>
                        </div>
                    </VeeField>
                </div>
            </form>
        </Form>
            <DialogFooter>
                <Button variant="ghost" @click="updateOpen(false)">Cancel</Button>
                <Button type="submit" form="dialogForm">
                {{ props.submitLabel }}
                </Button>
            </DialogFooter>
        </DialogContent>
  </Dialog>
</template>
