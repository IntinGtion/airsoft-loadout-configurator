import { useEffect, useState } from 'react'
import { api } from '../api'
import type { CategoryResponse, ComponentResponse } from '../api/types'

export function useComponents() {
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [components, setComponents] = useState<ComponentResponse[]>([])
  const [selected, setSelected]     = useState<number | null>(null)

  useEffect(() => {
    api.categories.getAll().then(setCategories).catch(console.error)
  }, [])

  useEffect(() => {
    api.components.getAll(selected ?? undefined).then(setComponents).catch(console.error)
  }, [selected])

  return { categories, components, selected, setSelected }
}
