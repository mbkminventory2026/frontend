import { apiClient } from "@/lib/apiClient";
import type { LoginPayload } from "@/schemas/auth/auth";

// Setelah interceptor unwrap envelope { status, message, data } → data,
// response.data langsung berisi payload token ini.
export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export const loginApi = async (data: LoginPayload & { turnstile_token: string }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data)
    return response.data;
}