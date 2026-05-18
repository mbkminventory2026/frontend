import * as z from 'zod'

export const FieldTypeEnum = z.enum([
    "text",
    "number",
    "password",
    "email",
    "textarea",
    "select",
    "date",
    "checkbox",
    "switch",
    "file",
    "image",
    "multi-checkbox",
]);

export const FieldPositionEnum = z.enum([
    "right",
    "left",
    "full"
])

const DependencySchema = z.object({
    parentKey: z.string(),
    condition: z.enum(["===", "!==", ">", "<", "includes"]),
    value: z.any(),
    action: z.enum(["show", "hide", "enable", "disable"])
})

const SourceSchema = z.object({
    url: z.string(),
    params: z.record(z.string().optional()),
    trigger: z.enum(["manual", "watch"]).default("manual"),
})

const FileConfigSchema = z.object({
    accept: z.string().optional(), // case hanya menerima "image/*" or ".pdf"
    maxSize: z.number().optional(), // dalam MB
    multiple: z.boolean().default(false),
    preview: z.boolean().default(true), // menampilkan preview jika gambar
  })

export const DialogFieldSchema = z.object({
    key: z.string().min(1, "Key is required"),
    label: z.string().min(1, "Label is required"),
    type: FieldTypeEnum,
    rules: z.union([z.string(), z.record(z.any())]),
    placeholder: z.string(),

    position: FieldPositionEnum.default("left"),
    options: z.array(
        z.object({
        label: z.string(),
        value: z.union([z.string(), z.number(), z.boolean()]),
        })
    ).optional(),
    dependency: DependencySchema.optional(),
    source: SourceSchema.optional(),
    fileConfig: FileConfigSchema.optional()
})

export const DialogSchema = z.array(DialogFieldSchema);

export type DialogField = z.infer<typeof DialogFieldSchema>;
export type DialogSchemaType = z.infer<typeof DialogSchema>;
export type FieldType = z.infer<typeof FieldTypeEnum>;


// import { DialogSchemaType } from "./dialogSchema";

// export const createUserSchema: DialogSchemaType = [
//   {
//     key: "full_name",
//     label: "Nama Lengkap",
//     type: "text",
//     placeholder: "Masukkan nama sesuai KTP",
//     rules: "required|min:3",
//     position: "left"
//   },
//   {
//     key: "role",
//     label: "Role",
//     type: "select",
//     placeholder: "Pilih Role",
//     rules: "required",
//     position: "right",
//     options: [
//       { label: "Admin", value: "admin" },
//       { label: "User", value: "user" }
//     ]
//   },
//   {
//     key: "admin_code",
//     label: "Kode Otoritas",
//     type: "text",
//     placeholder: "Khusus Admin",
//     rules: "required",
//     position: "full",
//     dependency: {
//       parentKey: "role",
//       condition: "===",
//       value: "admin",
//       action: "show"
//     }
//   }
// ];