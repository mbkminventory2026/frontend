import { apiClient } from "@/lib/apiClient";
import type { LoginPayload } from "@/schemas/auth/auth";

export interface LoginResponse {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: string;
    }
}

export const loginApi = async (data: LoginPayload & { cloudflareToken: string }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('auth/response', data)
    return response.data;
}