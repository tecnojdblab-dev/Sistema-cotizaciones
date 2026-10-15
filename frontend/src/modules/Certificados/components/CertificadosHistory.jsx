import { useEffect, useState } from 'react'
import { Button, Dropdown, Empty, Input, Popconfirm, Table, Tag, Typography } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FilePdfOutlined, FileWordOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons'
import { CERTIFICADO_STATUS } from '../domain/certificado.js'

const { Text } = Typography

export default function CertificadosHistory({ certificados, total, loading, query, setQuery, onDelete, onDuplicate, onEdit, onPdf, onView, onWord }) {
  const [search, setSearch] = useState('')
  useEffect(() => setSearch(query.search), [query.search])
  useEffect(() => {
    const normalized = search.trim()
    if (normalized === query.search) return undefined
    const timer = setTimeout(() => setQuery((current) => ({ ...current, page: 1, search: normalized })), 300)
    return () => clearTimeout(timer)
  }, [search, query.search, setQuery])
  const columns = [
    { title: 'Código', dataIndex: 'codigo', key: 'codigo', width: 130 },
    { title: 'Cliente o entidad', dataIndex: 'clienteEntidad', key: 'cliente', render: (value) => <Text strong>{value}</Text> },
    { title: 'Garantía', key: 'garantia', responsive: ['md'], render: (_, item) => `${item.garantiaAnos} año${item.garantiaAnos === 1 ? '' : 's'}` },
    { title: 'Estado', dataIndex: 'estado', key: 'estado', responsive: ['sm'], render: (value) => <Tag color={value === CERTIFICADO_STATUS.FINAL ? 'green' : 'gold'}>{value === CERTIFICADO_STATUS.FINAL ? 'Finalizado' : 'Borrador'}</Tag> },
    {
      title: 'Acciones', key: 'actions', width: 88, align: 'center', render: (_, item) => (
        <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: [
          { key: 'view', label: 'Ver', icon: <EyeOutlined />, onClick: () => onView(item) },
          { key: 'edit', label: 'Editar', icon: <EditOutlined />, onClick: () => onEdit(item) },
          { key: 'duplicate', label: 'Duplicar', icon: <CopyOutlined />, onClick: () => onDuplicate(item) },
          { key: 'pdf', label: 'Descargar PDF', icon: <FilePdfOutlined />, onClick: () => onPdf(item) },
          { key: 'word', label: 'Descargar Word', icon: <FileWordOutlined />, onClick: () => onWord(item) },
          { type: 'divider' },
          { key: 'delete', danger: true, icon: <DeleteOutlined />, label: <Popconfirm title="Eliminar certificado" description="Esta acción no se puede deshacer." okText="Eliminar" cancelText="Cancelar" onConfirm={() => onDelete(item.id)}><span>Eliminar</span></Popconfirm> },
        ] }}><Button type="text" aria-label="Acciones" icon={<MoreOutlined style={{ fontSize: 18 }} />} /></Dropdown>
      ),
    },
  ]
  return <>
    <div className="certificados-history__toolbar">
      <Input allowClear prefix={<SearchOutlined />} placeholder="Buscar por código, cliente u objeto" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Text type="secondary">{total} certificado{total === 1 ? '' : 's'}</Text>
    </div>
    <Table rowKey="id" columns={columns} dataSource={certificados} loading={loading} pagination={{ current: query.page, pageSize: query.pageSize, total, hideOnSinglePage: true, showSizeChanger: false }} onChange={(pagination) => setQuery((current) => ({ ...current, page: pagination.current || 1 }))} locale={{ emptyText: <Empty description="Todavía no hay certificados" /> }} scroll={{ x: 'max-content' }} />
  </>
}
