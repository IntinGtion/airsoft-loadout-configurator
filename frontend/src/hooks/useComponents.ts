import { useEffect, useState } from 'react'
import { api } from '../api'
import type { CategoryResponse, ComponentResponse } from '../api/types'

export function useComponents() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [components, setComponents] = useState<ComponentResponse[]>([])
  const [selected, setSelected]     = useState<number | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    api.categories.getAll().then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true)
      setError(null)
    })
    api.components.getAll(selected ?? undefined)
      .then(setComponents)
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false))
  }, [selected])

  const totalWeight = components.reduce((sum, c) => sum + (c.weightGrams ?? 0), 0)

  return { categories, components, selected, setSelected, loading, error, totalWeight }
}
