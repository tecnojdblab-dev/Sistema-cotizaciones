import { useEffect, useState } from 'react'
import { Button, Dropdown, Empty, Input, Popconfirm, Table, Tag, Typography } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined, EyeOutlined, FilePdfOutlined, FileTextOutlined, FileWordOutlined, MoreOutlined, SearchOutlined } from '@ant-design/icons'
import { NOTA_STATUS } from '../domain/nota.js'
import { formatNotaDate } from '../utils/notaFormatters.js'

const { Text } = Typography

export default function NotasHistory({ notas, total, loading, query, setQuery, onCreateCertificado, onDelete, onDuplicate, onEdit, onPdf, onView, onWord }) {
  const [search, setSearch] = useState('')
  useEffect(() => setSearch(query.search), [query.search])
  useEffect(() => {
    const normalized = search.trim()
    if (normalized === query.search) return undefined
    const timer = setTimeout(() => setQuery((current) => ({ ...current, page: 1, search: normalized })), 300)
    return () => clearTimeout(timer)
  }, [search, query.search, setQuery])
  const columns = [
    { title: 'N.º de nota', dataIndex: 'numero', key: 'numero', width: 135, render: (value) => <Text strong>{value}</Text> },
    { title: 'Cliente o entidad', dataIndex: 'clienteEntidad', key: 'cliente' },
    { title: 'Fecha de entrega', dataIndex: 'fechaEntrega', key: 'fecha', responsive: ['md'], render: formatNotaDate },
    { title: 'Ítems', key: 'items', align: 'center', responsive: ['sm'], render: (_, nota) => nota.items?.length || 0 },
    { title: 'Estado', dataIndex: 'estado', key: 'estado', responsive: ['sm'], render: (value) => <Tag color={value === NOTA_STATUS.FINAL ? 'green' : 'gold'}>{value === NOTA_STATUS.FINAL ? 'Finalizada' : 'Borrador'}</Tag> },
    {
      title: 'Acciones', key: 'actions', width: 88, align: 'center', render: (_, nota) => (
        <Dropdown trigger={['click']} placement="bottomRight" menu={{ items: [
          { key: 'view', label: 'Ver', icon: <EyeOutlined />, onClick: () => onView(nota) },
          { key: 'edit', label: 'Editar', icon: <EditOutlined />, onClick: () => onEdit(nota) },
          { key: 'duplicate', label: 'Duplicar', icon: <CopyOutlined />, onClick: () => onDuplicate(nota) },
          { key: 'certificate', label: 'Crear certificado', icon: <FileTextOutlined />, onClick: () => onCreateCertificado(nota) },
          { key: 'word', label: 'Descargar Word', icon: <FileWordOutlined />, onClick: () => onWord(nota) },
          { key: 'pdf', label: 'Descargar PDF', icon: <FilePdfOutlined />, onClick: () => onPdf(nota) },
          { type: 'divider' },
          { key: 'delete', danger: true, icon: <DeleteOutlined />, label: <Popconfirm title="Eliminar nota" description="Esta acción no se puede deshacer." okText="Eliminar" cancelText="Cancelar" onConfirm={() => onDelete(nota.id)}><span>Eliminar</span></Popconfirm> },
        ] }}><Button type="text" aria-label="Acciones" icon={<MoreOutlined style={{ fontSize: 18 }} />} /></Dropdown>
      ),
    },
  ]
  return <>
    <div className="notas-history__toolbar">
      <Input allowClear prefix={<SearchOutlined />} placeholder="Buscar por número, cliente, institución u objeto" value={search} onChange={(event) => setSearch(event.target.value)} />
      <Text type="secondary">{total} nota{total === 1 ? '' : 's'}</Text>
    </div>
    <Table rowKey="id" columns={columns} dataSource={notas} loading={loading} pagination={{ current: query.page, pageSize: query.pageSize, total, hideOnSinglePage: true, showSizeChanger: false }} onChange={(pagination) => setQuery((current) => ({ ...current, page: pagination.current || 1 }))} locale={{ emptyText: <Empty description="Todavía no hay notas guardadas" /> }} scroll={{ x: 'max-content' }} />
  </>
}
