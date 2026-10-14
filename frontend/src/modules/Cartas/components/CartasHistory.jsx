import { useEffect, useState } from 'react'
import { Button, Dropdown, Empty, Input, Popconfirm, Table, Tag, Typography } from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { CARTA_STATUS } from '../domain/carta.js'
import { formatHistoryDate } from '../utils/cartaFormatters.js'

const { Text } = Typography

export default function CartasHistory({ cartas, total, loading, query, setQuery, onDelete, onDuplicate, onEdit, onPdf, onView, onWord }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    setSearch(query.search)
  }, [query.search])

  useEffect(() => {
    const normalizedSearch = search.trim()
    if (normalizedSearch === query.search) return undefined
    const timeoutId = setTimeout(() => {
      setQuery((current) => ({ ...current, page: 1, search: normalizedSearch }))
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [search, query.search, setQuery])

  const columns = [
    {
      title: 'Carta',
      key: 'carta',
      render: (_, carta) => (
        <div className="cartas-history__main-cell">
          <Text strong>{carta.numero || 'Sin número'}</Text>
          <Text type="secondary">{carta.referencia}</Text>
        </div>
      ),
    },
    {
      title: 'Destinatario',
      key: 'destinatario',
      responsive: ['sm'],
      render: (_, carta) => (
        <div className="cartas-history__main-cell">
          <Text>{carta.destinatario}</Text>
          <Text type="secondary">{carta.institucion || carta.cargoDestinatario || '-'}</Text>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      key: 'estado',
      responsive: ['md'],
      render: (estado) => (
        <Tag color={estado === CARTA_STATUS.FINAL ? 'green' : 'gold'}>
          {estado === CARTA_STATUS.FINAL ? 'Finalizada' : 'Borrador'}
        </Tag>
      ),
    },
    {
      title: 'Actualizada',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      responsive: ['lg'],
      render: formatHistoryDate,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 88,
      align: 'center',
      render: (_, carta) => (
        <Dropdown
          trigger={['click']}
          placement="bottomRight"
          menu={{
            items: [
              { key: 'view', label: 'Ver carta', icon: <EyeOutlined />, onClick: () => onView(carta) },
              { key: 'edit', label: 'Editar', icon: <EditOutlined />, onClick: () => onEdit(carta) },
              { key: 'duplicate', label: 'Duplicar', icon: <CopyOutlined />, onClick: () => onDuplicate(carta) },
              { type: 'divider' },
              { key: 'word', label: 'Descargar Word', icon: <FileWordOutlined />, onClick: () => onWord(carta) },
              { key: 'pdf', label: 'Descargar PDF', icon: <FilePdfOutlined />, onClick: () => onPdf(carta) },
              { type: 'divider' },
              {
                key: 'delete',
                danger: true,
                icon: <DeleteOutlined />,
                label: (
                  <Popconfirm
                    title="Eliminar carta"
                    description="Esta acción no se puede deshacer."
                    okText="Eliminar"
                    cancelText="Cancelar"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onDelete(carta.id)}
                  >
                    <span>Eliminar</span>
                  </Popconfirm>
                ),
              },
            ],
          }}
        >
          <Button type="text" aria-label="Acciones de la carta" icon={<MoreOutlined style={{ fontSize: 18 }} />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <div className="cartas-history__toolbar">
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Buscar por número, referencia o destinatario"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <Text type="secondary">{total} carta{total === 1 ? '' : 's'}</Text>
      </div>

      <Table
        className="cartas-history__table"
        rowKey="id"
        columns={columns}
        dataSource={cartas}
        loading={loading}
        pagination={{
          current: query.page,
          pageSize: query.pageSize,
          total,
          hideOnSinglePage: true,
          showLessItems: true,
          showSizeChanger: false,
        }}
        onChange={(pagination) => setQuery((current) => ({ ...current, page: pagination.current || 1 }))}
        locale={{ emptyText: <Empty description="Todavía no hay cartas guardadas" /> }}
        scroll={{ x: 'max-content' }}
      />
    </>
  )
}

