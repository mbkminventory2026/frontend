import { apiClient } from "@/lib/apiClient";
import type { LoginPayload } from "@/schemas/auth/auth";

// Setelah interceptor unwrap envelope { status, message, data } → data,
// response.data langsung berisi payload token ini.
export interface LoginResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    id_role: number;
    role_name: string;
    must_change_password: boolean;
}

export const loginApi = async (data: LoginPayload & { turnstile_token: string }): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/login', data)
    return response.data;
}

export interface ChangePasswordPayload {
    current_password: string;
    new_password: string;
    confirm_new_password: string;
}

export interface ForgotPasswordRequestPayload {
    username: string;
    reason: string;
}

export interface PasswordResetRequestItem {
    id_password_reset_request: number;
    id_user: number;
    username: string;
    id_role: number;
    nama_role: string;
    reason: string;
    status: string;
    requested_at: string;
    approved_at?: string;
    rejected_at?: string;
    completed_at?: string;
    rejected_reason?: string;
    approved_by?: number | null;
    approved_by_username?: string;
    rejected_by?: number | null;
    rejected_by_username?: string;
}

export interface ApprovePasswordResetResponse extends PasswordResetRequestItem {
    temporary_password: string;
}

export const changePasswordApi = async (data: ChangePasswordPayload): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/v1/auth/change-password', data)
    return response.data
}

export const createForgotPasswordRequestApi = async (data: ForgotPasswordRequestPayload): Promise<PasswordResetRequestItem> => {
    const response = await apiClient.post<PasswordResetRequestItem>('/api/v1/auth/forgot-password-requests', data)
    return response.data
}

export const listForgotPasswordRequestsApi = async (): Promise<PasswordResetRequestItem[]> => {
    const response = await apiClient.get<PasswordResetRequestItem[]>('/api/v1/auth/forgot-password-requests')
    return response.data
}

export const approveForgotPasswordRequestApi = async (id: number): Promise<ApprovePasswordResetResponse> => {
    const response = await apiClient.patch<ApprovePasswordResetResponse>(`/api/v1/auth/forgot-password-requests/${id}/approve`)
    return response.data
}

export const rejectForgotPasswordRequestApi = async (id: number, rejectedReason: string): Promise<void> => {
    await apiClient.patch(`/api/v1/auth/forgot-password-requests/${id}/reject`, {
        rejected_reason: rejectedReason,
    })
}

export const registerMitraApi = async (data: any): Promise<any> => {
    const response = await apiClient.post('/api/v1/auth/register-mitra', data)
    return response.data;
}
