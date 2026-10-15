import { useCallback, useEffect, useState } from 'react'
import * as certificadosApi from '../api/certificadosApi.js'

export function useCertificados() {
  const [certificados, setCertificados] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState({ page: 1, pageSize: 8, search: '' })

  const loadCertificados = useCallback(async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const result = await certificadosApi.getCertificados({ take: query.pageSize, skip: (query.page - 1) * query.pageSize, search: query.search, signal })
      if (!signal?.aborted) { setCertificados(result.items); setTotal(result.total) }
      return result.items
    } catch (requestError) {
      if (!signal?.aborted) {
        setError(requestError)
        setCertificados([])
        setTotal(0)
      }
      throw requestError
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    loadCertificados(controller.signal).catch(() => {})
    return () => controller.abort()
  }, [loadCertificados])

  const saveCertificado = useCallback(async (values, id = null) => {
    setError(null)
    try {
      const saved = id
        ? await certificadosApi.updateCertificado(id, values)
        : await certificadosApi.createCertificado(values)
      const nextQuery = id ? query : { ...query, page: 1, search: '' }
      if (!id) setQuery(nextQuery)
      const result = await certificadosApi.getCertificados({ take: nextQuery.pageSize, skip: (nextQuery.page - 1) * nextQuery.pageSize, search: nextQuery.search })
      setCertificados(result.items); setTotal(result.total)
      return saved
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [query])

  const deleteCertificado = useCallback(async (id) => {
    setError(null)
    try {
      await certificadosApi.deleteCertificado(id)
      const nextTotal = Math.max(0, total - 1)
      setTotal(nextTotal)
      if (certificados.length === 1 && query.page > 1) setQuery((current) => ({ ...current, page: current.page - 1 }))
      else setCertificados((current) => current.filter((certificado) => certificado.id !== String(id)))
    } catch (requestError) {
      setError(requestError)
      throw requestError
    }
  }, [certificados.length, query.page, total])

  return { certificados, total, loading, error, query, setQuery, saveCertificado, deleteCertificado, reload: loadCertificados }
}
