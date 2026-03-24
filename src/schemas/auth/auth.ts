import * as z from 'zod';

export const loginSchema = z.object({
    email: z.string().min(1, { message: 'Email tidak boleh kosong.' })
    .email({ message: 'Format email tidak valid (harus ada @).' })
    ,
    password: z.string().min(6, { message: 'Password minimal 6 karakter.' })
});

export type LoginPayload = z.infer<typeof loginSchema>