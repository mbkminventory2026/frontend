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

// File preview URLs for image fields
const filePreviews = ref<Record<string, string>>({})

// Initialize formValues when dialog opens or initialValues change
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      formValues.value = { ...props.initialValues }
    } else {
      formValues.value = {}
      // Revoke any object URLs to prevent memory leaks
      Object.values(filePreviews.value).forEach((url) => URL.revokeObjectURL(url))
      filePreviews.value = {}
    }
  },
  { immediate: true }
)

watch(
  () => props.initialValues,
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
      return parentValue === dep.value
    case '!==':
      return parentValue !== dep.value
    case '>':
      return Number(parentValue) > Number(dep.value)
    case '<':
      return Number(parentValue) < Number(dep.value)
    case 'includes':
      if (Array.isArray(parentValue)) {
        return parentValue.includes(dep.value)
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
  return props.schema.filter((field) => isFieldVisible(field))
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

/**
 * Handle file input change — store file reference and generate preview.
 */
function onFileChange(key: string, event: Event, field: DialogField) {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files || files.length === 0) {
    formValues.value[key] = null
    // Clean up old preview
    if (filePreviews.value[key]) {
      URL.revokeObjectURL(filePreviews.value[key])
      delete filePreviews.value[key]
    }
    return
  }

  const file = field.fileConfig?.multiple ? Array.from(files) : files[0]
  formValues.value[key] = file

  // Generate preview for image types
  if (field.type === 'image' && field.fileConfig?.preview !== false && files[0]) {
    if (filePreviews.value[key]) {
      URL.revokeObjectURL(filePreviews.value[key])
    }
    filePreviews.value[key] = URL.createObjectURL(files[0])
  }
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
  const visibleKeys = new Set(fieldMap.keys())
  const filteredValues: Record<string, any> = {}

  for (const key of Object.keys(values)) {
    if (visibleKeys.has(key)) {
      const field = fieldMap.get(key)!
      filteredValues[key] = coerceValue(values[key], field)
    }
  }

  // Include file values from formValues (since vee-validate doesn't track native file inputs)
  visibleFields.value.forEach((field) => {
    if ((field.type === 'file' || field.type === 'image') && formValues.value[field.key]) {
      filteredValues[field.key] = formValues.value[field.key]
    }
  })

  emit('submit', filteredValues)
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
            v-slot="{ handleSubmit }"
            as=""
            keep-values
            :validation-schema="validationSchema"
            :initial-values="props.initialValues"
        >
            <form id="dialogForm" @submit="handleSubmit($event, onHandleSubmit)">
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
                                        v-bind="componentField"
                                        :disabled="isFieldDisabled(item)"
                                        @update:model-value="(val: any) => onFieldChange(item.key, val)"
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
                                    <Input
                                        :id="item.key"
                                        type="file"
                                        :accept="getFileAccept(item)"
                                        :multiple="item.fileConfig?.multiple ?? false"
                                        :disabled="isFieldDisabled(item)"
                                        class="cursor-pointer"
                                        @change="(e: Event) => { onFileChange(item.key, e, item); handleChange(formValues[item.key]) }"
                                    />
                                    <!-- Image preview -->
                                    <div v-if="item.type === 'image' && filePreviews[item.key]" class="mt-2">
                                        <img
                                            :src="filePreviews[item.key]"
                                            :alt="`Preview ${item.label}`"
                                            class="max-h-32 rounded-md border object-cover"
                                        />
                                    </div>
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
                                        v-bind="componentField"
                                        :disabled="isFieldDisabled(item)"
                                        @update:model-value="(val: any) => onFieldChange(item.key, val)"
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
                                    <Input
                                        :id="item.key"
                                        type="file"
                                        :accept="getFileAccept(item)"
                                        :multiple="item.fileConfig?.multiple ?? false"
                                        :disabled="isFieldDisabled(item)"
                                        class="cursor-pointer"
                                        @change="(e: Event) => { onFileChange(item.key, e, item); handleChange(formValues[item.key]) }"
                                    />
                                    <div v-if="item.type === 'image' && filePreviews[item.key]" class="mt-2">
                                        <img
                                            :src="filePreviews[item.key]"
                                            :alt="`Preview ${item.label}`"
                                            class="max-h-32 rounded-md border object-cover"
                                        />
                                    </div>
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
                                        v-bind="componentField"
                                        :disabled="isFieldDisabled(item)"
                                        @update:model-value="(val: any) => onFieldChange(item.key, val)"
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
                                    <Input
                                        :id="item.key"
                                        type="file"
                                        :accept="getFileAccept(item)"
                                        :multiple="item.fileConfig?.multiple ?? false"
                                        :disabled="isFieldDisabled(item)"
                                        class="cursor-pointer"
                                        @change="(e: Event) => { onFileChange(item.key, e, item); handleChange(formValues[item.key]) }"
                                    />
                                    <div v-if="item.type === 'image' && filePreviews[item.key]" class="mt-2">
                                        <img
                                            :src="filePreviews[item.key]"
                                            :alt="`Preview ${item.label}`"
                                            class="max-h-32 rounded-md border object-cover"
                                        />
                                    </div>
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
