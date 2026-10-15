import { apiDelete, apiGet, apiPost, apiPut, unwrapData } from '../../../services/api/http'

const BASE_URL = '/rotulos'

function toFrontendRotulo(rotulo) {
  return {
    id: String(rotulo.idRotulo),
    clienteId: String(rotulo.idCliente),
    nombre: rotulo.nombre,
    cargo: rotulo.cargo || '',
    correo: rotulo.correo || '',
    telefono: rotulo.telefono || '',
    ciudad: rotulo.ciudad || '',
    paperSize: rotulo.tamanoPapel,
    createdAt: rotulo.fechaCreacion,
    updatedAt: rotulo.fechaActualizacion,
  }
}

function toApiPayload(rotulo) {
  return {
    idCliente: rotulo.clienteId,
    nombre: rotulo.nombre,
    cargo: rotulo.cargo || null,
    correo: rotulo.correo || null,
    telefono: rotulo.telefono || null,
    ciudad: rotulo.ciudad || null,
    tamanoPapel: rotulo.paperSize || 'letter',
  }
}

export async function getRotulos(options = {}) {
  const { take = 8, skip = 0, search = '', signal } = options
  const params = new URLSearchParams({ take: String(take), skip: String(skip) })
  if (search.trim()) params.set('search', search.trim())

  const response = await apiGet(`${BASE_URL}?${params.toString()}`, { signal })
  const data = unwrapData(response)
  return {
    items: Array.isArray(data) ? data.map(toFrontendRotulo) : [],
    total: Number(response?.meta?.total ?? (Array.isArray(data) ? data.length : 0)),
  }
}

export async function createRotulo(rotulo, fetchOptions = {}) {
  const response = await apiPost(BASE_URL, toApiPayload(rotulo), fetchOptions)
  return toFrontendRotulo(unwrapData(response))
}

export async function updateRotulo(id, rotulo, fetchOptions = {}) {
  const response = await apiPut(`${BASE_URL}/${id}`, toApiPayload(rotulo), fetchOptions)
  return toFrontendRotulo(unwrapData(response))
}

export async function deleteRotulo(id, fetchOptions = {}) {
  await apiDelete(`${BASE_URL}/${id}`, fetchOptions)
}
