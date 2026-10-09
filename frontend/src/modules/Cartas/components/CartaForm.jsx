import { useEffect } from 'react'
import { Alert, Button, Col, Divider, Form, Input, Row, Segmented, Select, Space, Typography } from 'antd'
import { CheckOutlined, CloseOutlined, SaveOutlined } from '@ant-design/icons'
import { CARTA_STATUS, PAPER_SIZES, createEmptyCarta } from '../domain/carta.js'
import { plainTextFromHtml } from '../utils/cartaFormatters.js'
import CartaEditor from './CartaEditor.jsx'
import ImageDataUrlField from '../../../shared/components/ImageDataUrlField.jsx'
import { useClienteOptions } from '../../Clientes/hooks/useClienteOptions.js'
import { FIRMANTE_PRESETS } from '../../../shared/utils/firmantePresets.js'

const { Text } = Typography

export default function CartaForm({ carta, onCancel, onChange, onSave }) {
  const [form] = Form.useForm()
  const { clientes, loading, error, setSearch } = useClienteOptions()

  useEffect(() => {
    const values = carta || createEmptyCarta()
    form.setFieldsValue(values)
    onChange(values)
  }, [carta, form, onChange])

  const handleValuesChange = (_, values) => onChange(values)

  const handleClienteChange = (clienteId) => {
    const cliente = clientes.find((item) => String(item.idCliente) === String(clienteId))
    if (!cliente) return

    form.setFieldsValue({
      clienteId: String(cliente.idCliente),
      destinatario: cliente.nombreCompleto || '',
      cargoDestinatario: cliente.cargo || '',
      institucion: cliente.institucion || '',
    })
    onChange(form.getFieldsValue(true))
  }

  const handleFirmantePresetChange = (empresaFirmante) => {
    const preset = FIRMANTE_PRESETS[empresaFirmante]
    if (!preset) return

    form.setFieldsValue({ empresaFirmante, ...preset })
    onChange(form.getFieldsValue(true))
  }

  const clienteOptions = clientes.map((cliente) => ({
    value: String(cliente.idCliente),
    label: [cliente.nombreCompleto, cliente.institucion].filter(Boolean).join(' - '),
  }))

  if (carta?.clienteId && !clienteOptions.some((option) => option.value === String(carta.clienteId))) {
    clienteOptions.unshift({ value: String(carta.clienteId), label: carta.destinatario || 'Cliente seleccionado' })
  }

  const handleSave = async (estado) => {
    let values
    try {
      values = await form.validateFields()
    } catch {
      // Ant Design muestra los mensajes junto a cada campo inválido.
      return
    }
    onSave({ ...values, estado })
  }

  return (
    <Form
      form={form}
      layout="vertical"
      requiredMark={false}
      autoComplete="off"
      initialValues={createEmptyCarta()}
      onValuesChange={handleValuesChange}
    >
      <Divider orientation="left" plain>Documento</Divider>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item label="Ciudad" name="ciudadFecha" rules={[{ required: true, message: 'Ingresa la ciudad' }]}>
            <Input placeholder="Cochabamba" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Fecha" name="fecha" rules={[{ required: true, message: 'Selecciona la fecha' }]}>
            <Input type="date" />
          </Form.Item>
        </Col>

        <Col xs={24} sm={12}>
          <Form.Item label="Tamaño de hoja" name="papel">
            <Segmented
              block
              options={Object.entries(PAPER_SIZES).map(([value, item]) => ({ value, label: item.label }))}
            />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" plain>Destinatario</Divider>
      <Form.Item
        className="carta-client-search"
        label="Buscar cliente registrado (opcional)"
        name="clienteId"
      >
        <Select
          allowClear
          showSearch
          filterOption={false}
          loading={loading}
          options={clienteOptions}
          onSearch={setSearch}
          onChange={handleClienteChange}
          placeholder="Busca por nombre, correo, teléfono o institución"
          notFoundContent={loading ? 'Buscando clientes...' : 'No se encontraron clientes'}
        />
      </Form.Item>

      {error && (
        <Alert
          showIcon
          type="error"
          message="No se pudieron cargar los clientes"
          description={error.message}
          className="carta-client-search__error"
        />
      )}

      <Row gutter={[16, 0]}>
        <Col xs={24} sm={8}>
          <Form.Item label="Tratamiento" name="tratamiento">
            <Input placeholder="Señora:" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item label="Nombre" name="destinatario" rules={[{ required: true, whitespace: true, message: 'Ingresa el destinatario' }]}>
            <Input placeholder="Nombre del destinatario" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Cargo" name="cargoDestinatario">
            <Input placeholder="Cargo del destinatario" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Institución o unidad" name="institucion">
            <Input placeholder="Nombre de la institución" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item label="Saludo" name="presente">
            <Input placeholder="Presente.-" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item label="Referencia" name="referencia" rules={[{ required: true, whitespace: true, message: 'Ingresa la referencia' }]}>
            <Input placeholder="SOLICITUD DE REVISIÓN..." />
          </Form.Item>
        </Col>
      </Row>

      <Divider orientation="left" plain>Contenido</Divider>
      <Form.Item
        name="cuerpoHtml"
        rules={[{
          validator: (_, value) => plainTextFromHtml(value)
            ? Promise.resolve()
            : Promise.reject(new Error('Escribe el contenido de la carta')),
        }]}
      >
        <CartaEditor />
      </Form.Item>

      <Form.Item label="Despedida" name="despedida">
        <Input placeholder="Atentamente:" />
      </Form.Item>

      <Divider orientation="left" plain>Firma y sello</Divider>
      <Form.Item label="Empresa firmante" name="empresaFirmante">
        <Segmented
          block
          options={[
            { label: 'TecnoEquip', value: 'tecnoequip' },
            { label: 'JDBlab', value: 'jdblab' },
          ]}
          onChange={handleFirmantePresetChange}
        />
      </Form.Item>
      <Row gutter={[16, 0]}>
        <Col xs={24} sm={12}>
          <Form.Item label="Nombre del firmante" name="firmanteNombre">
            <Input placeholder="Nombre completo" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Cargo o descripción" name="firmanteCargo">
            <Input placeholder="Cargo" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="NIT" name="firmanteDocumento">
            <Input placeholder="NIT: 4513773014" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Teléfono" name="firmanteTelefono">
            <Input placeholder="Cel. 70769521" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Firma" name="firmaImagen">
            <ImageDataUrlField label="Firma" />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item label="Sello o logotipo" name="selloImagen">
            <ImageDataUrlField label="Sello" />
          </Form.Item>
        </Col>
      </Row>

      <div className="carta-form__footer">
        <Text type="secondary">Los borradores y cartas se guardan localmente en este navegador.</Text>
        <Space wrap className="carta-form__actions">
          {carta?.id && (
            <Button icon={<CloseOutlined />} onClick={onCancel}>Cancelar edición</Button>
          )}
          <Button icon={<SaveOutlined />} onClick={() => handleSave(CARTA_STATUS.DRAFT)}>
            Guardar borrador
          </Button>
          <Button type="primary" icon={<CheckOutlined />} onClick={() => handleSave(CARTA_STATUS.FINAL)}>
            Finalizar carta
          </Button>
        </Space>
      </div>
    </Form>
  )
}
