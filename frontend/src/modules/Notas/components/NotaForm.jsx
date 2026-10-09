import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Segmented, Select, Space, Typography, message } from 'antd'
import { CheckOutlined, CloseOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import { useClienteOptions } from '../../Clientes/hooks/useClienteOptions.js'
import { useCatalogSearch } from '../../cotizacion/hooks/useCatalogSearch.js'
import { fetchComponentes, fetchProductos } from '../../cotizacion/services/api/catalogoApi.js'
import ImageDataUrlField from '../../../shared/components/ImageDataUrlField.jsx'
import { FIRMANTE_PRESETS } from '../../../shared/utils/firmantePresets.js'
import { createEmptyNota, NOTA_STATUS } from '../domain/nota.js'

const { Text } = Typography

function catalogDescription(item) {
  const value = String(item?.descripcion || item?.description || '')
  const container = document.createElement('div')
  container.innerHTML = value.replace(/<br\s*\/?\s*>/gi, '\n')
  return (container.textContent || '').replace(/\u00a0/g, ' ').replace(/\s*\n\s*/g, '\n').trim()
}

export default function NotaForm({ nota, onCancel, onChange, onSave }) {
  const [form] = Form.useForm()
  const { clientes, loading: clientsLoading, error, setSearch: setClientSearch } = useClienteOptions()
  const productos = useCatalogSearch(fetchProductos)
  const componentes = useCatalogSearch(fetchComponentes)
  const [selectedType, setSelectedType] = useState('producto')
  const [selectedId, setSelectedId] = useState()
  const [selectedQuantity, setSelectedQuantity] = useState(1)

  const activeCatalog = selectedType === 'producto' ? productos : componentes
  const idField = selectedType === 'producto' ? 'idProducto' : 'idComponente'
  const catalogOptions = useMemo(() => activeCatalog.items.map((item) => ({
    value: String(item[idField]),
    label: `${item.nombre} (${item.sku || item.codigo || 'S/N'})`,
  })), [activeCatalog.items, idField])

  useEffect(() => {
    const values = nota || createEmptyNota()
    form.setFieldsValue(values)
    onChange(values)
  }, [form, nota, onChange])

  const selectCliente = (id) => {
    const cliente = clientes.find((item) => String(item.idCliente) === String(id))
    if (!cliente) return
    form.setFieldsValue({
      clienteId: String(cliente.idCliente),
      clienteEntidad: cliente.nombreCompleto || cliente.institucion || '',
      institucion: cliente.institucion || '',
      lugarEntrega: cliente.direccion || '',
    })
    onChange(form.getFieldsValue(true))
  }

  const selectEntregadoPor = (empresaEntregadoPor) => {
    const preset = FIRMANTE_PRESETS[empresaEntregadoPor]
    if (!preset) return

    form.setFieldsValue({
      empresaEntregadoPor,
      entregadoNombre: preset.firmanteNombre,
      entregadoCargo: preset.firmanteCargo,
      entregadoDocumento: preset.firmanteDocumento,
      entregadoTelefono: preset.firmanteTelefono,
      entregadoFirma: preset.firmaImagen,
      entregadoSello: preset.selloImagen,
      ocultarSello: false,
    })
    onChange(form.getFieldsValue(true))
  }

  const addCatalogItem = () => {
    if (!selectedId) {
      message.warning('Selecciona un producto o componente')
      return
    }
    const catalogItem = activeCatalog.items.find((item) => String(item[idField]) === String(selectedId))
    if (!catalogItem) return
    const currentItems = form.getFieldValue('items') || []
    const exists = currentItems.some((item) => item.catalogoTipo === selectedType && String(item.catalogoId) === String(selectedId))
    if (exists) {
      message.warning('Este ítem ya fue agregado; puedes cambiar su cantidad en la lista')
      return
    }
    form.setFieldValue('items', [...currentItems, {
      catalogoTipo: selectedType,
      catalogoId: String(selectedId),
      nombre: catalogItem.nombre || '',
      descripcion: catalogDescription(catalogItem),
      codigo: catalogItem.sku || catalogItem.codigo || '',
      numeroSerie: '',
      cantidad: Math.max(1, Number(selectedQuantity) || 1),
      precioUnitario: Math.max(0, Number(catalogItem.precioBase) || 0),
    }])
    onChange(form.getFieldsValue(true))
    setSelectedId(undefined)
    setSelectedQuantity(1)
    message.success(`${catalogItem.nombre} agregado`)
  }

  const submit = async (estado) => {
    try {
      const values = await form.validateFields()
      await onSave({ ...values, estado })
    } catch {
      // Ant Design muestra los errores en cada campo.
    }
  }

  return (
    <Form form={form} layout="vertical" initialValues={createEmptyNota()} requiredMark={false} onValuesChange={(changed, values) => {
      const ocultarSello = 'entregadoSello' in changed ? !changed.entregadoSello : values.ocultarSello
      if ('entregadoSello' in changed) form.setFieldValue('ocultarSello', ocultarSello)
      onChange({ ...values, ocultarSello })
    }}>
      <Divider orientation="left" plain>Control del documento</Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={6}><Form.Item label="Código" name="codigo" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col xs={12} sm={5}><Form.Item label="Revisión" name="revision"><Input /></Form.Item></Col>
        <Col xs={12} sm={6}><Form.Item label="N.º de nota" name="numero" rules={[{ required: true, whitespace: true, message: 'Ingresa el número de nota' }]}><Input placeholder="Ej. 024/2026" /></Form.Item></Col>
        <Col xs={24} sm={7}><Form.Item label="Tamaño de hoja" name="papel"><Segmented block options={[{ value: 'letter', label: 'Carta' }, { value: 'a4', label: 'A4' }]} /></Form.Item></Col>
      </Row>

      <Divider orientation="left" plain>Cliente y entrega</Divider>
      <Form.Item label="Buscar cliente registrado" name="clienteId">
        <Select
          allowClear showSearch filterOption={false} loading={clientsLoading} onSearch={setClientSearch} onChange={selectCliente}
          placeholder="Busca por nombre, correo, teléfono o institución"
          options={clientes.map((cliente) => ({ value: String(cliente.idCliente), label: [cliente.nombreCompleto, cliente.institucion].filter(Boolean).join(' - ') }))}
        />
      </Form.Item>
      {error && <Alert showIcon type="error" message="No se pudieron cargar los clientes" description={error.message} className="nota-form__alert" />}
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}><Form.Item label="Cliente o entidad contratante" name="clienteEntidad" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Institución" name="institucion"><Input /></Form.Item></Col>
        <Col xs={24}><Form.Item label="Objeto de la contratación" name="objetoContratacion" rules={[{ required: true, whitespace: true }]}><Input.TextArea autoSize={{ minRows: 2, maxRows: 5 }} /></Form.Item></Col>
        <Col xs={24} md={16}><Form.Item label="Lugar de entrega" name="lugarEntrega" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item></Col>
        <Col xs={24} md={8}><Form.Item label="Fecha de entrega" name="fechaEntrega" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
      </Row>

      <Divider orientation="left" plain>Descripción de la entrega</Divider>
      <Form.Item label="Texto introductorio" name="introduccion"><Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item>
      <Card size="small" className="nota-catalog-picker" title={<Space><PlusOutlined /><span>Agregar productos o componentes</span></Space>}>
        <Row gutter={[14, 16]} align="bottom">
          <Col xs={24} md={5}>
            <Text type="secondary">Tipo *</Text>
            <Select className="nota-catalog-picker__control" value={selectedType} onChange={(type) => { setSelectedType(type); setSelectedId(undefined) }} options={[{ label: 'Producto', value: 'producto' }, { label: 'Componente', value: 'componente' }]} />
          </Col>
          <Col xs={24} md={11}>
            <Text type="secondary">Selecciona {selectedType} *</Text>
            <Select className="nota-catalog-picker__control" placeholder="Busca por nombre o SKU..." value={selectedId} onChange={setSelectedId} options={catalogOptions} loading={activeCatalog.loading} showSearch onSearch={activeCatalog.setSearch} filterOption={false} notFoundContent={activeCatalog.loading ? 'Buscando...' : 'No se encontraron resultados'} />
          </Col>
          <Col xs={12} md={4}>
            <Text type="secondary">Cantidad</Text>
            <InputNumber className="nota-catalog-picker__control" min={1} value={selectedQuantity} onChange={(value) => setSelectedQuantity(value ?? 1)} />
          </Col>
          <Col xs={12} md={4}><Button block type="primary" icon={<PlusOutlined />} className="nota-catalog-picker__control" onClick={addCatalogItem}>Agregar</Button></Col>
        </Row>
      </Card>

      <Form.List name="items" rules={[{ validator: async (_, items) => { if (!items?.length) throw new Error('Agrega al menos un producto o componente') } }]}>
        {(fields, { add, remove }, { errors }) => (
          <Space direction="vertical" size={12} className="nota-items">
            {fields.map((field, index) => (
              <Card key={field.key} size="small" title={`Ítem ${index + 1}`} extra={<Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} />}>
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}><Form.Item label="Equipo o nombre" name={[field.name, 'nombre']} rules={[{ required: true, whitespace: true }]}><Input /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Código" name={[field.name, 'codigo']}><Input /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="N.º de serie" name={[field.name, 'numeroSerie']}><Input placeholder="Serie manual" /></Form.Item></Col>
                  <Col xs={24}><Form.Item label="Descripción" name={[field.name, 'descripcion']}><Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Cantidad" name={[field.name, 'cantidad']}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col xs={12} md={8}><Form.Item label="Precio unitario (Bs)" name={[field.name, 'precioUnitario']}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
                </Row>
              </Card>
            ))}
            <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ catalogoTipo: 'producto', nombre: '', descripcion: '', codigo: '', numeroSerie: '', cantidad: 1, precioUnitario: 0 })}>Agregar ítem manual</Button>
            <Form.ErrorList errors={errors} />
          </Space>
        )}
      </Form.List>

      <Divider orientation="left" plain>Firma</Divider>
      <Form.Item label="Empresa firmante" name="empresaEntregadoPor">
        <Segmented
          block
          options={[
            { label: 'TecnoEquip', value: 'tecnoequip' },
            { label: 'JDBlab', value: 'jdblab' },
          ]}
          onChange={selectEntregadoPor}
        />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}><Form.Item label="Nombre del firmante" name="entregadoNombre" rules={[{ required: true, whitespace: true, message: 'Ingresa el nombre de quien entrega' }]}><Input placeholder="Nombre completo" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Cargo o descripción" name="entregadoCargo"><Input placeholder="Cargo" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="NIT" name="entregadoDocumento"><Input placeholder="NIT: 4513773014" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Teléfono" name="entregadoTelefono"><Input placeholder="Cel. 70769521" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Firma" name="entregadoFirma"><ImageDataUrlField label="Firma" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Sello o logotipo" name="entregadoSello"><ImageDataUrlField label="Sello" /></Form.Item></Col>
      </Row>

      <Divider orientation="left" plain>Recepción</Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={12}><Form.Item label="Nombre de quien recibe" name="recibidoNombre"><Input placeholder="Puede completarse al imprimir" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="Cargo de quien recibe" name="recibidoCargo"><Input placeholder="Cargo de quien recibe" /></Form.Item></Col>
        <Col xs={24}><Form.Item label="Firma de quien recibe" name="recibidoFirma"><ImageDataUrlField label="Firma de quien recibe" /></Form.Item></Col>
      </Row>

      <div className="nota-form__footer">
        <Text type="secondary">Las notas se guardan de forma segura en el sistema.</Text>
        <Space wrap className="nota-form__actions">
          {nota?.id && <Button icon={<CloseOutlined />} onClick={onCancel}>Cancelar edición</Button>}
          <Button icon={<SaveOutlined />} onClick={() => submit(NOTA_STATUS.DRAFT)}>Guardar borrador</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => submit(NOTA_STATUS.FINAL)}>Finalizar nota</Button>
        </Space>
      </div>
    </Form>
  )
}
