import type {
  AttachmentTypeResponse,
  CategoryResponse,
  ComponentResponse,
  LoadoutItemResponse,
  LoadoutResponse,
  LoadoutSummary,
} from './types'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`)
  if (!res.ok) throw new Error(`API ${res.status} – ${path}`)
  return res.json() as Promise<T>
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `API ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string }).error ?? `API ${res.status}`)
  }
  return res.json() as Promise<T>
}

async function del(path: string): Promise<void> {
  const res = await fetch(`/api${path}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API ${res.status} – ${path}`)
}

export const api = {
  categories: {
    getAll: () => get<CategoryResponse[]>('/categories'),
  },

  components: {
    getAll: (categoryId?: number) =>
      get<ComponentResponse[]>(
        categoryId ? `/components?categoryId=${categoryId}` : '/components'
      ),
    getById: (id: number) => get<ComponentResponse>(`/components/${id}`),
  },

  attachmentTypes: {
    getAll: () => get<AttachmentTypeResponse[]>('/attachmenttypes'),
  },

  loadouts: {
    getAll:          ()         => get<LoadoutSummary[]>('/loadouts'),
    getById:         (id: number) => get<LoadoutResponse>(`/loadouts/${id}`),
    getByShareToken: (token: string) => get<LoadoutResponse>(`/loadouts/share/${token}`),
    create:          (name: string) => post<LoadoutSummary>('/loadouts', { name }),
    addItem: (loadoutId: number, componentId: number, parentSlotId: number | null) =>
      post<LoadoutItemResponse>(`/loadouts/${loadoutId}/items`, { componentId, parentSlotId }),
    moveItem: (loadoutId: number, itemId: number, componentId: number, parentSlotId: number | null) =>
      put<LoadoutItemResponse>(`/loadouts/${loadoutId}/items/${itemId}`, { componentId, parentSlotId }),
    removeItem: (loadoutId: number, itemId: number) =>
      del(`/loadouts/${loadoutId}/items/${itemId}`),
  },
}
