export const NOTA_STATUS = Object.freeze({ DRAFT: 'borrador', FINAL: 'finalizada' })

function todayLocalIso() {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export function createEmptyNota() {
  return {
    codigo: 'R-TNE-09',
    revision: '0',
    numero: '',
    papel: 'letter',
    clienteId: undefined,
    clienteEntidad: '',
    institucion: '',
    objetoContratacion: '',
    lugarEntrega: '',
    fechaEntrega: todayLocalIso(),
    introduccion: 'En cumplimiento al Contrato Administrativo con TECNOEquip, se hace la entrega del siguiente equipo:',
    items: [],
    empresaEntregadoPor: undefined,
    entregadoNombre: '',
    entregadoCargo: '',
    entregadoDocumento: '',
    entregadoTelefono: '',
    entregadoFirma: '',
    entregadoSello: '',
    ocultarSello: false,
    recibidoNombre: '',
    recibidoCargo: '',
    recibidoFirma: '',
    estado: NOTA_STATUS.DRAFT,
  }
}

export function normalizeNota(values) {
  const normalized = { ...createEmptyNota(), ...values }
  Object.keys(normalized).forEach((key) => {
    if (typeof normalized[key] === 'string') normalized[key] = normalized[key].trim()
  })
  normalized.items = Array.isArray(normalized.items)
    ? normalized.items.map((item) => ({
        ...item,
        nombre: String(item.nombre || '').trim(),
        descripcion: String(item.descripcion || '').trim(),
        codigo: String(item.codigo || '').trim(),
        numeroSerie: String(item.numeroSerie || '').trim(),
        imagen: String(item.imagen || '').trim(),
        cantidad: Math.max(1, Number(item.cantidad) || 1),
        precioUnitario: Math.max(0, Number(item.precioUnitario) || 0),
      }))
    : []
  normalized.papel = ['letter', 'a4'].includes(normalized.papel) ? normalized.papel : 'letter'
  return normalized
}

export function duplicateNota(nota) {
  return {
    ...normalizeNota(nota),
    id: undefined,
    numero: '',
    estado: NOTA_STATUS.DRAFT,
    createdAt: undefined,
    updatedAt: undefined,
  }
}

export function getNotaTotal(nota) {
  return (nota.items || []).reduce(
    (sum, item) => sum + Number(item.cantidad || 0) * Number(item.precioUnitario || 0),
    0,
  )
}
