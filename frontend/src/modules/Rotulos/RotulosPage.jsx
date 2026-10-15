import { useCallback, useState } from 'react'
import { Alert, Button, Card, message, Segmented, Space, Spin, Typography } from 'antd'
import { HistoryOutlined, PlusOutlined } from '@ant-design/icons'
import rotuloImage from '../../../images/imgenRotulo.webp'
import RotuloForm from './components/RotuloForm.jsx'
import RotuloPreview from './components/RotuloPreview.jsx'
import RotulosHistory from './components/RotulosHistory.jsx'
import { useRotulos } from './hooks/useRotulos.js'
import { downloadRotuloPdf } from './utils/downloadRotuloPdf.js'
import './rotulos.css'

const { Title, Text } = Typography
const EMPTY_ROTULO = { clienteId: undefined, nombre: '', cargo: '', correo: '', telefono: '', ciudad: '' }

export default function RotulosPage() {
  const { rotulos, total, loading, error, query, setQuery, saveRotulo, deleteRotulo } = useRotulos()
  const [activeView, setActiveView] = useState('crear')
  const [editingRotulo, setEditingRotulo] = useState(null)
  const [draft, setDraft] = useState(EMPTY_ROTULO)
  const [paperSize, setPaperSize] = useState('letter')

  const handleDraftChange = useCallback((values) => setDraft({ ...EMPTY_ROTULO, ...values }), [])

  const handleSave = async (values) => {
    try {
      await saveRotulo({ ...values, paperSize }, editingRotulo?.id)
      message.success(editingRotulo ? 'Rótulo actualizado' : 'Rótulo creado')
      setEditingRotulo(null)
      setActiveView('historial')
    } catch (requestError) {
      message.error(requestError.message || 'No se pudo guardar el rótulo')
    }
  }

  const handleEdit = (rotulo) => {
    setEditingRotulo(rotulo)
    setPaperSize(rotulo.paperSize || 'letter')
    setActiveView('crear')
  }

  const handleCancelEdit = () => {
    setEditingRotulo(null)
    setDraft(EMPTY_ROTULO)
    setPaperSize('letter')
  }

  const handleDelete = async (id) => {
    try {
      await deleteRotulo(id)
      if (editingRotulo?.id === id) handleCancelEdit()
      message.success('Rótulo eliminado')
    } catch (requestError) {
      message.error(requestError.message || 'No se pudo eliminar el rótulo')
    }
  }

  const handleDownload = async (rotulo) => {
    try {
      await downloadRotuloPdf(rotulo, rotuloImage, rotulo.paperSize || paperSize)
    } catch (requestError) {
      message.error(requestError.message || 'No se pudo generar el PDF')
    }
  }

  const handleViewChange = (view) => {
    setActiveView(view)
    if (view === 'historial') handleCancelEdit()
  }

  return (
    <div className="rotulos-page">
      <div className="rotulos-page__header">
        <div>
          <Title level={3}>Rótulos</Title>
          <Text type="secondary">Inicio / Documentos / Rótulos</Text>
        </div>
        <Segmented
          value={activeView}
          onChange={handleViewChange}
          options={[
            { value: 'crear', label: 'Crear rótulo', icon: <PlusOutlined /> },
            { value: 'historial', label: 'Historial', icon: <HistoryOutlined /> },
          ]}
        />
      </div>

      {error && (
        <Alert
          className="rotulos-page__alert"
          type="error"
          showIcon
          message="No se pudieron sincronizar los rótulos"
          description={error.message}
        />
      )}

      {activeView === 'crear' ? (
        <div className="rotulos-create-grid">
          <Card
            title={editingRotulo ? 'Editar rótulo' : 'Datos del destinatario'}
            extra={editingRotulo ? <Text type="warning">Modo edición</Text> : null}
            variant="borderless"
          >
            <RotuloForm
              editingRotulo={editingRotulo}
              onCancel={handleCancelEdit}
              onChange={handleDraftChange}
              onSave={handleSave}
            />
          </Card>

          <Space direction="vertical" size={12} className="rotulos-preview-column">
            <div>
              <Text strong>Vista previa</Text>
              <br />
              <Text type="secondary">Los datos se imprimirán en mayúsculas.</Text>
            </div>
            <Space align="center" wrap className="rotulos-paper-size">
              <Text strong>Tamaño de papel:</Text>
              <Segmented
                value={paperSize}
                onChange={setPaperSize}
                options={[
                  { value: 'letter', label: 'Carta' },
                  { value: 'legal', label: 'Oficio' },
                ]}
              />
            </Space>
            <RotuloPreview rotulo={draft} logoSource={rotuloImage} paperSize={paperSize} />
            <Button
              className="rotulos-download-button"
              block
              disabled={!draft.nombre?.trim()}
              onClick={() => handleDownload({ ...draft, paperSize })}
            >
              Descargar vista previa en PDF
            </Button>
          </Space>
        </div>
      ) : (
        <Card
          className="rotulos-history-card"
          title="Historial de rótulos"
          extra={(
            <Space align="center" wrap className="rotulos-paper-size">
              <Text strong>Tamaño:</Text>
              <Segmented
                value={paperSize}
                onChange={setPaperSize}
                options={[
                  { value: 'letter', label: 'Carta' },
                  { value: 'legal', label: 'Oficio' },
                ]}
              />
            </Space>
          )}
          variant="borderless"
        >
          <Spin spinning={loading}>
            <RotulosHistory
              rotulos={rotulos}
              total={total}
              loading={loading}
              query={query}
              setQuery={setQuery}
              onDelete={handleDelete}
              onDownload={handleDownload}
              onEdit={handleEdit}
            />
          </Spin>
        </Card>
      )}
    </div>
  )
}
