import { apiClient } from '@/lib/apiClient'

export interface ActivityLogChangedField {
  field: string
  before: unknown
  after: unknown
}

export interface ActivityLogListItem {
  id: number
  created_at: string
  actor_user_id?: number
  actor_username: string
  actor_role: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | string
  module: string
  entity_type: string
  entity_id: string
  entity_label: string
}

export interface ActivityLogDetail extends ActivityLogListItem {
  method: string
  route: string
  before_data?: Record<string, unknown>
  after_data?: Record<string, unknown>
  changed_fields: ActivityLogChangedField[]
}

interface ActivityLogListApiResponse {
  items: ActivityLogListItem[]
  pagination?: {
    page?: number
    page_size?: number
    total_items?: number
    total_pages?: number
  }
}

export const getActivityLogs = async (params: {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDesc?: boolean
  action?: string
  module?: string
  entityType?: string
  dateFrom?: string
  dateTo?: string
}) => {
  const response = await apiClient.get<ActivityLogListApiResponse>('/api/v1/activity-logs', {
    params: {
      page: params.page,
      pageSize: params.pageSize,
      q: params.search,
      sortBy: params.sortBy,
      sortDesc: params.sortDesc,
      action: params.action,
      module: params.module,
      entityType: params.entityType,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    },
  })

  return {
    results: response.data?.items ?? [],
    count: response.data?.pagination?.total_items ?? response.data?.items?.length ?? 0,
  }
}

export const getActivityLogById = async (id: string | number) => {
  if (!id) throw new Error('ID is required')

  const response = await apiClient.get<ActivityLogDetail>(`/api/v1/activity-logs/${id}`)
  return response.data
}
