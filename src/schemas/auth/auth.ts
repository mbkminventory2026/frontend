import * as z from 'zod';

export const loginSchema = z.object({
    username: z.string().min(1, { message: 'Username tidak boleh kosong.' }),
    password: z.string().min(6, { message: 'Password minimal 6 karakter.'})
});

export type LoginPayload = z.infer<typeof loginSchema>