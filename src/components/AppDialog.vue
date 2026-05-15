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
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      formValues.value = { ...normalizedInitialValues.value }
    } else {
      formValues.value = {}
    }
  },
  { immediate: true }
)

watch(
  () => normalizedInitialValues.value,
  (newVals) => {
    if (props.isOpen) {
      formValues.value = { ...newVals }
    }
  },
  { deep: true }
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
  formValues.value[key] = value
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
            v-slot="{ handleSubmit }"
            as=""
            :validation-schema="validationSchema"
            :initial-values="normalizedInitialValues"
        >
            <form id="dialogForm" @submit.prevent="handleSubmit(onHandleSubmit)">
                <div :class="['grid gap-4', fields.hasTwoColumns ? 'grid-cols-2' : 'grid-cols-1']">
                    <!-- left -->
                    <div class="flex flex-col gap-4">
                        <VeeField
                            v-for="item in fields.left"
                            :key="item.key"
                            v-slot="{ componentField, errors, handleChange, value }"
                            :name="item.key"
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
                        </VeeField>
                    </div>

                    <!-- right -->
                    <div v-if="fields.hasTwoColumns" class="flex flex-col gap-4">
                        <VeeField
                            v-for="item in fields.right"
                            :key="item.key"
                            v-slot="{ componentField, errors, handleChange, value }"
                            :name="item.key"
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
                        </VeeField>
                    </div>

                    <!-- full -->
                    <div v-if="fields.full.length" class="col-span-full flex flex-col gap-4 mt-2">
                        <VeeField
                            v-for="item in fields.full"
                            :key="item.key"
                            v-slot="{ componentField, errors, handleChange, value }"
                            :name="item.key"
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
                        </VeeField>
                    </div>
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
