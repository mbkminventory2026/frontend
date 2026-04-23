import { apiClient } from "@/lib/apiClient";
import type { 
    CobaListItem, 
    // CobaListResponse 
} from "@/schemas/coba/coba";

export const getCoba = async(params: {
    limit: number,
    offset: number,
    search?: string
}) => {
    // const response = await apiClient.get<CobaListItem[]>('/posts', {
    //     params: {
    //         _limit: params.limit,
    //         _start: params.offset,
    //         q: params.search
    //     }
    // });

    const response = await apiClient.get<CobaListItem[]>('/photos', {
        params: {
            _limit: params.limit,
            _start: params.offset,
            q: params.search
        }
    });

    // const response = await apiClient.get<CobaListResponse>('/character', {
    //     params: {
    //         limit: params.limit,
    //         offset: params.offset,
    //         search: params.search
    //     }
    // })

    return {
        results: response.data,
        count: Number(response.headers['x-total-count']) || 0

        // yang akan dipakai sepertinya -> karena sudah berisi { metadata, results }
        // results: response.data
    }
}