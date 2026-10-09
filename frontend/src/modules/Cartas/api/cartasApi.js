import { apiDelete, apiGet, apiPost, apiPut, unwrapData } from '../../../services/api/http'
import { FIRMANTE_PRESETS } from '../../../shared/utils/firmantePresets.js'

const BASE_URL = '/cartas'

function toFrontendCarta(carta) {
  const preset = carta.empresaFirmante ? FIRMANTE_PRESETS[carta.empresaFirmante] : null

  return {
    id: String(carta.idCarta),
    clienteId: carta.idCliente ? String(carta.idCliente) : undefined,
    ciudadFecha: carta.ciudadFecha,
    fecha: String(carta.fecha).slice(0, 10),
    numero: carta.numero || '',
    tratamiento: carta.tratamiento || '',
    destinatario: carta.destinatario,
    cargoDestinatario: carta.cargoDestinatario || '',
    institucion: carta.institucion || '',
    presente: carta.presente || '',
    referencia: carta.referencia,
    cuerpoHtml: carta.cuerpoHtml,
    despedida: carta.despedida || '',
    empresaFirmante: carta.empresaFirmante || undefined,
    firmanteNombre: preset?.firmanteNombre || carta.firmanteNombre || '',
    firmanteCargo: preset?.firmanteCargo || carta.firmanteCargo || '',
    firmanteDocumento: preset?.firmanteDocumento || carta.firmanteDocumento || '',
    // firmanteTelefono: carta.firmanteTelefono || preset?.firmanteTelefono || '',
    firmanteTelefono: '',
    firmaImagen: preset?.firmaImagen || '',
    selloImagen: preset?.selloImagen || '',
    papel: carta.papel || 'letter',
    estado: carta.estado || 'borrador',
    createdAt: carta.fechaCreacion,
    updatedAt: carta.fechaActualizacion,
  }
}

function toApiPayload(carta) {
  return {
    idCliente: carta.clienteId || null,
    ciudadFecha: carta.ciudadFecha,
    fecha: carta.fecha,
    numero: carta.numero || null,
    tratamiento: carta.tratamiento || null,
    destinatario: carta.destinatario,
    cargoDestinatario: carta.cargoDestinatario || null,
    institucion: carta.institucion || null,
    presente: carta.presente || null,
    referencia: carta.referencia,
    cuerpoHtml: carta.cuerpoHtml,
    despedida: carta.despedida || null,
    empresaFirmante: carta.empresaFirmante || null,
    firmanteNombre: carta.firmanteNombre || null,
    firmanteCargo: carta.firmanteCargo || null,
    firmanteDocumento: carta.firmanteDocumento || null,
    firmanteTelefono: carta.firmanteTelefono || null,
    papel: carta.papel || 'letter',
    estado: carta.estado || 'borrador',
  }
}

export async function getCartas(options = {}) {
  const { take = 200, skip = 0, search = '', signal } = options
  const params = new URLSearchParams({ take: String(take), skip: String(skip) })
  if (search.trim()) params.set('search', search.trim())

  const response = await apiGet(`${BASE_URL}?${params.toString()}`, { signal })
  const data = unwrapData(response)
  return Array.isArray(data) ? data.map(toFrontendCarta) : []
}

export async function createCarta(carta, fetchOptions = {}) {
  const response = await apiPost(BASE_URL, toApiPayload(carta), fetchOptions)
  return toFrontendCarta(unwrapData(response))
}

export async function updateCarta(id, carta, fetchOptions = {}) {
  const response = await apiPut(`${BASE_URL}/${id}`, toApiPayload(carta), fetchOptions)
  return toFrontendCarta(unwrapData(response))
}

export async function deleteCarta(id, fetchOptions = {}) {
  await apiDelete(`${BASE_URL}/${id}`, fetchOptions)
}
