import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, Row, Segmented, Select, Space, Typography, message } from 'antd'
import { CheckOutlined, CloseOutlined, DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons'
import RichTextEditor from '../../../shared/components/RichTextEditor.jsx'
import ImageDataUrlField from '../../../shared/components/ImageDataUrlField.jsx'
import { useClienteOptions } from '../../Clientes/hooks/useClienteOptions.js'
import { useCatalogSearch } from '../../cotizacion/hooks/useCatalogSearch.js'
import { fetchComponentes, fetchProductos } from '../../cotizacion/services/api/catalogoApi.js'
import { addWarrantyYears, CERTIFICADO_STATUS, createEmptyCertificado } from '../domain/certificado.js'
import { FIRMANTE_PRESETS } from '../../../shared/utils/firmantePresets.js'

const { Text } = Typography

export default function CertificadoForm({ certificado, onCancel, onChange, onSave }) {
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
    const values = certificado || createEmptyCertificado()
    form.setFieldsValue(values)
    onChange(values)
  }, [certificado, form, onChange])

  const notifyChange = (changed, values) => {
    if ('fechaDesde' in changed || 'garantiaAnos' in changed) {
      const fechaHasta = addWarrantyYears(values.fechaDesde, values.garantiaAnos)
      form.setFieldValue('fechaHasta', fechaHasta)
      onChange({ ...values, fechaHasta })
      return
    }
    onChange(values)
  }

  const selectCliente = (id) => {
    const cliente = clientes.find((item) => String(item.idCliente) === String(id))
    if (!cliente) return
    form.setFieldsValue({ clienteId: String(cliente.idCliente), clienteEntidad: cliente.institucion || cliente.nombreCompleto || '' })
    onChange(form.getFieldsValue(true))
  }

  const selectFirmante = (empresaFirmante) => {
    const preset = FIRMANTE_PRESETS[empresaFirmante]
    if (!preset) return

    form.setFieldsValue({ empresaFirmante, ...preset })
    onChange(form.getFieldsValue(true))
  }

  const addCatalogItem = () => {
    if (!selectedId) {
      message.warning('Selecciona un producto o componente')
      return
    }
    const catalogItem = activeCatalog.items.find((item) => String(item[idField]) === String(selectedId))
    if (!catalogItem) return
    const items = [...(form.getFieldValue('items') || []), {
      catalogoTipo: selectedType,
      catalogoId: String(selectedId),
      descripcion: catalogItem.nombre || '',
      marca: 'JDBlab',
      modelo: catalogItem.sku || catalogItem.codigo || '',
      cantidad: Math.max(1, Number(selectedQuantity) || 1),
      aclaraciones: 'NUEVO',
    }]
    form.setFieldValue('items', items)
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
      // Los errores se muestran junto a los campos.
    }
  }

  return (
    <Form form={form} layout="vertical" initialValues={createEmptyCertificado()} requiredMark={false} onValuesChange={notifyChange}>
      <Divider orientation="left" plain>Control del documento</Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}><Form.Item label="Código" name="codigo" rules={[{ required: true }]}><Input /></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item label="Revisión" name="revision"><Input /></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item label="Tamaño" name="papel"><Segmented block options={[{ value: 'a4', label: 'A4' }, { value: 'letter', label: 'Carta' }]} /></Form.Item></Col>
      </Row>

      <Divider orientation="left" plain>Cliente y contratación</Divider>
      <Form.Item label="Buscar cliente registrado (opcional)" name="clienteId">
        <Select
          allowClear showSearch filterOption={false} loading={clientsLoading} onSearch={setClientSearch} onChange={selectCliente}
          placeholder="Busca por nombre, correo, teléfono o institución"
          options={clientes.map((cliente) => ({ value: String(cliente.idCliente), label: [cliente.nombreCompleto, cliente.institucion].filter(Boolean).join(' - ') }))}
        />
      </Form.Item>
      {error && <Alert showIcon type="error" message="No se pudieron cargar los clientes" description={error.message} className="certificado-form__alert" />}
      <Form.Item label="Cliente o entidad contratante" name="clienteEntidad" rules={[{ required: true, whitespace: true, message: 'Ingresa el cliente o entidad' }]}>
        <Input placeholder="Universidad o institución" />
      </Form.Item>
      <Form.Item label="Objeto de la contratación" name="objetoContratacion" rules={[{ required: true, whitespace: true, message: 'Ingresa el objeto de contratación' }]}>
        <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="Descripción del proceso de contratación" />
      </Form.Item>

      <Divider orientation="left" plain>Vigencia de la garantía</Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}><Form.Item label="Años de garantía" name="garantiaAnos"><InputNumber min={1} max={20} style={{ width: '100%' }} /></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item label="Desde" name="fechaDesde" rules={[{ required: true }]}><Input type="date" /></Form.Item></Col>
        <Col xs={24} sm={8}><Form.Item label="Hasta" name="fechaHasta"><Input type="date" disabled /></Form.Item></Col>
      </Row>

      <Divider orientation="left" plain>Descripción de la entrega</Divider>
      <Card size="small" className="certificado-catalog-picker" title={<Space><PlusOutlined /><span>Agregar productos o componentes</span></Space>}>
        <Row gutter={[14, 16]} align="bottom">
          <Col xs={24} md={5}>
            <Text type="secondary">Tipo *</Text>
            <Select
              className="certificado-catalog-picker__control"
              value={selectedType}
              onChange={(type) => { setSelectedType(type); setSelectedId(undefined) }}
              options={[{ label: 'Producto', value: 'producto' }, { label: 'Componente', value: 'componente' }]}
            />
          </Col>
          <Col xs={24} md={14}>
            <Text type="secondary">Selecciona {selectedType} *</Text>
            <Select
              className="certificado-catalog-picker__control"
              placeholder="Busca por nombre o SKU..."
              value={selectedId}
              onChange={setSelectedId}
              options={catalogOptions}
              loading={activeCatalog.loading}
              showSearch
              onSearch={activeCatalog.setSearch}
              filterOption={false}
              notFoundContent={activeCatalog.loading ? 'Buscando...' : 'No se encontraron resultados'}
            />
          </Col>
          <Col xs={24} md={5}>
            <Button block type="primary" icon={<PlusOutlined />} className="certificado-catalog-picker__control" onClick={addCatalogItem}>Agregar</Button>
          </Col>
        </Row>
      </Card>
      <Form.List
        name="items"
        rules={[{ validator: async (_, items) => { if (!items?.length) throw new Error('Agrega al menos un producto o componente') } }]}
      >
        {(fields, { add, remove }, { errors }) => (
          <Space direction="vertical" size={12} className="certificado-items">
            {fields.map((field, index) => (
              <Card
                key={field.key}
                size="small"
                title={`Ítem ${index + 1}`}
                extra={fields.length > 1 ? <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)} /> : null}
              >
                <Row gutter={[12, 0]}>
                  <Col xs={24} md={12}><Form.Item label="Descripción" name={[field.name, 'descripcion']} rules={[{ required: true, whitespace: true }]}><Input.TextArea autoSize={{ minRows: 1, maxRows: 6 }} /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Marca" name={[field.name, 'marca']}><Input /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Modelo" name={[field.name, 'modelo']}><Input /></Form.Item></Col>
                  <Col xs={12} md={6}><Form.Item label="Cantidad" name={[field.name, 'cantidad']}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item></Col>
                  <Col xs={12} md={18}><Form.Item label="Aclaraciones" name={[field.name, 'aclaraciones']}><Input placeholder="NUEVO" /></Form.Item></Col>
                </Row>
              </Card>
            ))}
            <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ catalogoTipo: 'producto', descripcion: '', marca: 'JDBlab', modelo: '', cantidad: 1, aclaraciones: 'NUEVO' })}>Agregar ítem</Button>
            <Form.ErrorList errors={errors} />
          </Space>
        )}
      </Form.List>

      <Divider orientation="left" plain>Condiciones de garantía</Divider>
      <Form.Item name="condicionesHtml" rules={[{ required: true, message: 'Ingresa las condiciones' }]}>
        <RichTextEditor minHeight="220px" buttonList={[["undo", "redo"], ["bold", "underline", "italic"], ["align", "list"], ["removeFormat", "fullScreen"]]} />
      </Form.Item>

      <Divider orientation="left" plain>Firma</Divider>
      <Form.Item label="Empresa firmante" name="empresaFirmante">
        <Segmented
          block
          options={[
            { label: 'TecnoEquip', value: 'tecnoequip' },
            { label: 'JDBlab', value: 'jdblab' },
          ]}
          onChange={selectFirmante}
        />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}><Form.Item label="Nombre del firmante" name="firmanteNombre"><Input placeholder="Nombre completo" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Cargo o descripción" name="firmanteCargo"><Input placeholder="Cargo" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="NIT" name="firmanteDocumento"><Input placeholder="NIT: 4513773014" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Teléfono" name="firmanteTelefono"><Input placeholder="Cel. 70769521" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Firma" name="firmaImagen"><ImageDataUrlField label="Firma" /></Form.Item></Col>
        <Col xs={24} sm={12}><Form.Item label="Sello o logotipo" name="selloImagen"><ImageDataUrlField label="Sello" /></Form.Item></Col>
      </Row>

      <div className="certificado-form__footer">
        <Text type="secondary">Los certificados se guardan de forma segura en el sistema.</Text>
        <Space wrap className="certificado-form__actions">
          {certificado?.id && <Button icon={<CloseOutlined />} onClick={onCancel}>Cancelar edición</Button>}
          <Button icon={<SaveOutlined />} onClick={() => submit(CERTIFICADO_STATUS.DRAFT)}>Guardar borrador</Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => submit(CERTIFICADO_STATUS.FINAL)}>Finalizar certificado</Button>
        </Space>
      </div>
    </Form>
  )
}
