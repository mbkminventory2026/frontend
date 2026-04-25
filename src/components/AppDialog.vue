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

// Initialize formValues when dialog opens or initialValues change
watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      formValues.value = { ...props.initialValues }
    } else {
      formValues.value = {}
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

// Validation schema — only validate visible fields
const validationSchema = computed(() => {
  const schemaObject: Record<string, any> = {}

  visibleFields.value.forEach((field) => {
    let fieldSchema: z.ZodTypeAny = z.string()

    if (typeof field.rules === 'string') {
      if (field.rules.includes('required')) {
        fieldSchema = z.string().min(1, `${field.label} wajib diisi`)
      }
      if (field.rules.includes('email')) {
        fieldSchema = z.string().email('Format email salah')
      }
    }

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

function onHandleSubmit(values: any) {
  // Only submit values for visible fields
  const visibleKeys = new Set(visibleFields.value.map((f) => f.key))
  const filteredValues: Record<string, any> = {}
  for (const key of Object.keys(values)) {
    if (visibleKeys.has(key)) {
      filteredValues[key] = values[key]
    }
  }
  emit('submit', filteredValues)
}

function updateOpen(val: boolean) {
  emit('update:isOpen', val)
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
                            v-slot="{ componentField, errors }"
                            :name="item.key"
                        >
                            <Field :data-invalid="!!errors.length">
                                <FieldLabel :for="item.key">{{ item.label }}</FieldLabel>
                                
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
                            v-slot="{ componentField, errors }"
                            :name="item.key"
                        >
                            <Field :data-invalid="!!errors.length">
                                <FieldLabel :for="item.key">{{ item.label }}</FieldLabel>
                                
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
                            v-slot="{ componentField, errors }"
                            :name="item.key"
                        >
                            <Field :data-invalid="!!errors.length">
                                <FieldLabel :for="item.key">{{ item.label }}</FieldLabel>
                                
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
