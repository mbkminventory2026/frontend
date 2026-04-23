import { apiClient } from "@/lib/apiClient";
import type { LoginPayload } from "@/schemas/auth/auth";

export interface LoginRequest {
    status: string;
    message: string;
    data: {
        access_token: string;
        token_type: string;
        expires_in: number;
    }
}

export const loginApi = async (data: LoginPayload & { turnstile_token: string }): Promise<LoginRequest> => {
    const response = await apiClient.post<LoginRequest>('/auth/login', data)
    return response.data;
}