import { apiClient } from "@/lib/apiClient";
import type { AIEstimationRequest } from "@/schemas/ai-estimation/request";
import type { AIPredictionResponseData } from "@/schemas/ai-estimation/response";

/**
 * Sends order configuration to backend to estimate production schedules using the TabPFN AI model.
 * 
 * @param data Raw input quantities and design parameters
 * @returns Production schedule estimation data in days
 */
export const predictAIEstimation = async (data: AIEstimationRequest): Promise<AIPredictionResponseData> => {
  const response = await apiClient.post<AIPredictionResponseData>('/api/v1/dashboard/ai-estimation', data);
  return response.data;
};
