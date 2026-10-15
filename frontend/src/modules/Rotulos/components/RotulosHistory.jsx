import { useEffect, useState } from 'react'
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Popconfirm,
  Table,
  Typography,
} from 'antd'
import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons'

const { Text } = Typography

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function RotulosHistory({ rotulos, total, loading, query, setQuery, onDelete, onDownload, onEdit }) {
  const [search, setSearch] = useState('')
  useEffect(() => setSearch(query.search), [query.search])
  useEffect(() => {
    const normalized = search.trim()
    if (normalized === query.search) return undefined
    const timer = setTimeout(() => setQuery((current) => ({ ...current, page: 1, search: normalized })), 300)
    return () => clearTimeout(timer)
  }, [search, query.search, setQuery])

  const columns = [
    {
      title: 'Destinatario',
      key: 'destinatario',
      render: (_, rotulo) => (
        <div className="rotulos-history__person">
          <Text strong>{rotulo.nombre}</Text>
          <Text type="secondary">{rotulo.cargo || 'Sin cargo'}</Text>
        </div>
      ),
    },
    {
      title: 'Contacto',
      key: 'contacto',
      responsive: ['sm'],
      render: (_, rotulo) => (
        <div className="rotulos-history__person">
          <Text>{rotulo.correo || 'Sin correo'}</Text>
          <Text type="secondary">{rotulo.telefono || 'Sin teléfono'}</Text>
        </div>
      ),
    },
    {
      title: 'Ciudad',
      dataIndex: 'ciudad',
      key: 'ciudad',
      responsive: ['md'],
      render: (value) => value || '-',
    },
    {
      title: 'Actualizado',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      responsive: ['lg'],
      render: formatDate,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 88,
      align: 'center',
      render: (_, rotulo) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'download',
                label: 'Descargar PDF',
                icon: <DownloadOutlined />,
                onClick: () => onDownload(rotulo),
              },
              {
                key: 'edit',
                label: 'Editar',
                icon: <EditOutlined />,
                onClick: () => onEdit(rotulo),
              },
              { type: 'divider' },
              {
                key: 'delete',
                label: (
                  <Popconfirm
                    title="Eliminar rótulo"
                    description="Esta acción no se puede deshacer."
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(rotulo.id)}
                  >
                    <span style={{ color: '#ff4d4f' }}>Eliminar</span>
                  </Popconfirm>
                ),
                icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
                danger: true,
              },
            ],
          }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button type="text" aria-label="Acciones del rótulo" icon={<MoreOutlined style={{ fontSize: 18 }} />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <div className="rotulos-history__toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Buscar por nombre, cargo, correo o ciudad"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Text type="secondary">{total} rótulo{total === 1 ? '' : 's'}</Text>
      </div>

      <Table
        className="rotulos-history__table"
        rowKey="id"
        columns={columns}
        dataSource={rotulos}
        loading={loading}
        pagination={{ current: query.page, pageSize: query.pageSize, total, hideOnSinglePage: true, showSizeChanger: false, showLessItems: true }}
        onChange={(pagination) => setQuery((current) => ({ ...current, page: pagination.current || 1 }))}
        locale={{ emptyText: <Empty description="Todavía no hay rótulos guardados" /> }}
        scroll={{ x: 'max-content' }}
      />
    </>
  )
}
