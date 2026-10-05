const { z } = require('zod');

const optionalText = (max, label) => z.preprocess((value) => (typeof value === 'string' && value.trim() === '' ? null : value), z.string().trim().max(max, `${label} no puede exceder ${max} caracteres`).nullable().optional());
const nullableId = (label) => z.preprocess((value) => (value === '' || value === undefined || value === null ? null : value), z.union([z.number(), z.string(), z.bigint()]).pipe(z.coerce.bigint().positive(`${label} inválido`)).nullable());
const optionalDate = z.preprocess((value) => (value === '' || value === undefined || value === null ? null : value), z.coerce.date().nullable());

const itemSchema = z.object({
  tipoCatalogo: z.enum(['producto', 'componente']), idProducto: nullableId('idProducto'), idComponente: nullableId('idComponente'),
  nombre: z.string().trim().min(1, 'Nombre requerido').max(250, 'Nombre no puede exceder 250 caracteres'),
  descripcion: z.string().trim().nullable().optional(), codigo: optionalText(100, 'Código'), numeroSerie: optionalText(150, 'Número de serie'),
  cantidad: z.coerce.number().int().positive('Cantidad debe ser mayor a cero'), precioUnitario: z.coerce.number().min(0, 'Precio unitario inválido'), ordenVisual: z.coerce.number().int().min(0, 'Orden inválido'),
}).superRefine((item, context) => {
  if (item.idProducto && item.idComponente) context.addIssue({ code: 'custom', message: 'Un ítem no puede referenciar producto y componente', path: ['idProducto'] });
  if (item.idProducto && item.tipoCatalogo !== 'producto') context.addIssue({ code: 'custom', message: 'El tipo de catálogo debe ser producto', path: ['tipoCatalogo'] });
  if (item.idComponente && item.tipoCatalogo !== 'componente') context.addIssue({ code: 'custom', message: 'El tipo de catálogo debe ser componente', path: ['tipoCatalogo'] });
});

const baseSchema = z.object({
  idCliente: nullableId('idCliente').optional(), codigo: optionalText(50, 'Código'), revision: optionalText(20, 'Revisión'), numero: optionalText(50, 'Número'),
  clienteEntidad: z.string().trim().min(1, 'Cliente o entidad requerida').max(250, 'Cliente o entidad no puede exceder 250 caracteres'), institucion: optionalText(200, 'Institución'), objetoContratacion: z.string().trim().nullable().optional(), lugarEntrega: optionalText(250, 'Lugar de entrega'), fechaEntrega: optionalDate, introduccion: z.string().trim().nullable().optional(),
  empresaEntregadoPor: z.enum(['tecnoequip', 'jdblab']).nullable().optional(), entregadoNombre: optionalText(200, 'Nombre de quien entrega'), entregadoCargo: optionalText(200, 'Cargo de quien entrega'), entregadoDocumento: optionalText(50, 'Documento de quien entrega'), entregadoTelefono: optionalText(30, 'Teléfono de quien entrega'), entregadoFirmaUrl: z.string().url('URL de firma entregada inválida').nullable().optional(), entregadoSelloUrl: z.string().url('URL de sello entregado inválida').nullable().optional(), ocultarSello: z.boolean().default(false),
  recibidoNombre: optionalText(200, 'Nombre de quien recibe'), recibidoCargo: optionalText(200, 'Cargo de quien recibe'), recibidoFirmaUrl: z.string().url('URL de firma recibida inválida').nullable().optional(),
  papel: z.enum(['letter', 'a4']).default('letter'), estado: z.enum(['borrador', 'finalizada']).default('borrador'), items: z.array(itemSchema).min(1, 'Debe incluir al menos un ítem'),
});

const createNotaSchema = baseSchema;
const updateNotaSchema = baseSchema.partial().refine((value) => Object.keys(value).length > 0, 'Debe enviar al menos un campo para actualizar');
function formatZodError(error) { return error.issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join('; '); }
module.exports = { createNotaSchema, updateNotaSchema, formatZodError };
