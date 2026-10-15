import { useCallback, useEffect, useState } from 'react'
import * as notasApi from '../api/notasApi.js'

export function useNotas() {
  const [notas, setNotas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState({ page: 1, pageSize: 8, search: '' })
  const loadNotas = useCallback(async (signal) => {
    setLoading(true); setError(null)
    try {
      const result = await notasApi.getNotas({ take: query.pageSize, skip: (query.page - 1) * query.pageSize, search: query.search, signal })
      if (!signal?.aborted) { setNotas(result.items); setTotal(result.total) }
      return result.items
    } catch (requestError) { if (!signal?.aborted) { setError(requestError); setNotas([]); setTotal(0) } throw requestError } finally { if (!signal?.aborted) setLoading(false) }
  }, [query])
  useEffect(() => { const controller = new AbortController(); loadNotas(controller.signal).catch(() => {}); return () => controller.abort() }, [loadNotas])
  const saveNota = useCallback(async (values, id = null) => {
    setError(null)
    try {
      const saved = id ? await notasApi.updateNota(id, values) : await notasApi.createNota(values)
      const nextQuery = id ? query : { ...query, page: 1, search: '' }
      if (!id) setQuery(nextQuery)
      const result = await notasApi.getNotas({ take: nextQuery.pageSize, skip: (nextQuery.page - 1) * nextQuery.pageSize, search: nextQuery.search })
      setNotas(result.items); setTotal(result.total)
      return saved
    } catch (requestError) { setError(requestError); throw requestError }
  }, [query])
  const deleteNota = useCallback(async (id) => {
    setError(null)
    try {
      await notasApi.deleteNota(id)
      const nextTotal = Math.max(0, total - 1)
      setTotal(nextTotal)
      if (notas.length === 1 && query.page > 1) setQuery((current) => ({ ...current, page: current.page - 1 }))
      else setNotas((current) => current.filter((nota) => nota.id !== String(id)))
    } catch (requestError) { setError(requestError); throw requestError }
  }, [notas.length, query.page, total])
  return { notas, total, loading, error, query, setQuery, saveNota, deleteNota, reload: loadNotas }
}
