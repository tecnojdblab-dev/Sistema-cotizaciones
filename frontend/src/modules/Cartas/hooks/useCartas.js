import { useCallback, useEffect, useState } from 'react'
import * as cartasApi from '../api/cartasApi.js'

export function useCartas() {
  const [cartas, setCartas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState({ page: 1, pageSize: 8, search: '' })

  const loadCartas = useCallback(async (signal) => {
    setLoading(true)
    setError(null)

    try {
      const result = await cartasApi.getCartas({
        take: query.pageSize,
        skip: (query.page - 1) * query.pageSize,
        search: query.search,
        signal,
      })
      if (!signal?.aborted) {
        setCartas(result.items)
        setTotal(result.total)
      }
      return result.items
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(requestError)
        setCartas([])
        setTotal(0)
      }
      throw requestError
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    loadCartas(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [loadCartas])

  const saveCarta = useCallback(async (values, id = null) => {
    setError(null)

    try {
      const saved = id
        ? await cartasApi.updateCarta(id, values)
        : await cartasApi.createCarta(values)

      if (id) {
        await loadCartas()
      } else {
        setTotal((current) => current + 1)
        setQuery((current) => ({ ...current, page: 1, search: '' }))
      }
      return saved
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [loadCartas])

  const deleteCarta = useCallback(async (id) => {
    setError(null)

    try {
      await cartasApi.deleteCarta(id)
      setTotal((current) => Math.max(0, current - 1))
      if (cartas.length === 1 && query.page > 1) {
        setQuery((current) => ({ ...current, page: current.page - 1 }))
      } else {
        setCartas((current) => current.filter((carta) => carta.id !== String(id)))
      }
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [cartas.length, query.page])

  return { cartas, total, loading, error, query, setQuery, saveCarta, deleteCarta, reload: loadCartas }
}
