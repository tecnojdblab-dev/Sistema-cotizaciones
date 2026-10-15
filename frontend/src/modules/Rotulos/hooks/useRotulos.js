import { useCallback, useEffect, useState } from 'react'
import * as rotulosApi from '../api/rotulosApi.js'

export function useRotulos() {
  const [rotulos, setRotulos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState({ page: 1, pageSize: 8, search: '' })

  const loadRotulos = useCallback(async (signal) => {
    setLoading(true)
    setError(null)

    try {
      const result = await rotulosApi.getRotulos({ take: query.pageSize, skip: (query.page - 1) * query.pageSize, search: query.search, signal })
      if (!signal?.aborted) { setRotulos(result.items); setTotal(result.total) }
      return result.items
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(requestError)
        setRotulos([])
        setTotal(0)
      }
      throw requestError
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    loadRotulos(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [loadRotulos])

  const saveRotulo = useCallback(async (values, editingId = null) => {
    setError(null)

    try {
      const saved = editingId
        ? await rotulosApi.updateRotulo(editingId, values)
        : await rotulosApi.createRotulo(values)

      const nextQuery = editingId ? query : { ...query, page: 1, search: '' }
      if (!editingId) setQuery(nextQuery)
      const result = await rotulosApi.getRotulos({ take: nextQuery.pageSize, skip: (nextQuery.page - 1) * nextQuery.pageSize, search: nextQuery.search })
      setRotulos(result.items); setTotal(result.total)
      return saved
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [query])

  const deleteRotulo = useCallback(async (id) => {
    setError(null)

    try {
      await rotulosApi.deleteRotulo(id)
      const nextTotal = Math.max(0, total - 1)
      setTotal(nextTotal)
      if (rotulos.length === 1 && query.page > 1) setQuery((current) => ({ ...current, page: current.page - 1 }))
      else setRotulos((current) => current.filter((rotulo) => rotulo.id !== String(id)))
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [query.page, rotulos.length, total])

  return { rotulos, total, loading, error, query, setQuery, saveRotulo, deleteRotulo, reload: loadRotulos }
}
