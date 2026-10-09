import { forwardRef } from 'react'
import logoJdblab from '../../../../images/logojdblab.jpeg.png'
import DocumentFooter from '../../../shared/components/DocumentFooter.jsx'
import { FIRMANTE_PRESETS } from '../../../shared/utils/firmantePresets.js'
import { getNotaTotal } from '../domain/nota.js'
import { formatMoney, formatMoneyInWords, formatNotaDate } from '../utils/notaFormatters.js'
import './NotaPreview.css'

function descriptionAsText(value) {
  return String(value || '')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

const NotaPreview = forwardRef(function NotaPreview({ nota }, ref) {
  const items = nota.items || []
  const selloEntregado = nota.ocultarSello ? '' : nota.entregadoSello || FIRMANTE_PRESETS[nota.empresaEntregadoPor]?.selloImagen
  return (
    <article ref={ref} className={`nota-preview nota-preview--${nota.papel || 'letter'}`}>
      <table className="nota-preview__header-table">
        <tbody>
          <tr>
            <td rowSpan="4" className="nota-preview__logo"><img src={logoJdblab} alt="JDBlab TECNOequip" /></td>
            <th>SISTEMA DE GESTIÓN DE CALIDAD</th><th>Código:</th><td>{nota.codigo}</td>
          </tr>
          <tr><th>REGISTRO</th><th>Revisión:</th><td>{nota.revision}</td></tr>
          <tr><th rowSpan="2">NOTA DE ENTREGA Y VERIFICACIÓN DE COMPONENTES</th><th>Página:</th><td>1 de 1</td></tr>
          <tr><th>N.º de nota:</th><td>{nota.numero || '[Número]'}</td></tr>
        </tbody>
      </table>

      <table className="nota-preview__info-table">
        <tbody>
          <tr><th>CLIENTE O ENTIDAD CONTRATANTE:</th><td>{nota.clienteEntidad || '[Nombre del cliente]'}</td></tr>
          <tr><th>INSTITUCIÓN:</th><td>{nota.institucion || '[Nombre de la institución]'}</td></tr>
          <tr><th>OBJETO DE LA CONTRATACIÓN:</th><td>{nota.objetoContratacion || '[Descripción de la contratación]'}</td></tr>
          <tr><th>LUGAR DE ENTREGA:</th><td>{nota.lugarEntrega || '[Dirección]'}</td></tr>
          <tr><th>FECHA DE ENTREGA:</th><td>{formatNotaDate(nota.fechaEntrega)}</td></tr>
        </tbody>
      </table>

      <h3 className="nota-preview__section-title">1. &nbsp; DESCRIPCIÓN DE LA ENTREGA.</h3>
      <p className="nota-preview__intro">{nota.introduccion}</p>

      <table className="nota-preview__items-table">
        <thead><tr><th>Ítem</th><th>Equipo y descripción</th><th>Código</th><th>N.º de serie</th><th>Cant.</th><th>P. unitario<br />Bs</th><th>Total Bs</th></tr></thead>
        <tbody>
          {items.length ? items.map((item, index) => (
            <tr key={`${item.catalogoTipo || 'manual'}-${item.catalogoId || index}`}>
              <td>{index + 1}</td>
              <td className="nota-preview__product-cell">
                <div><strong>{item.nombre}</strong>{item.descripcion && <span>{descriptionAsText(item.descripcion)}</span>}</div>
              </td>
              <td>{item.codigo || '-'}</td><td>{item.numeroSerie || ''}</td><td>{item.cantidad}</td>
              <td>{formatMoney(item.precioUnitario)}</td><td>{formatMoney(Number(item.cantidad) * Number(item.precioUnitario))}</td>
            </tr>
          )) : <tr><td>1</td><td className="nota-preview__empty-item">AGREGUE UN PRODUCTO O COMPONENTE</td><td>-</td><td>-</td><td>1</td><td>0,00</td><td>0,00</td></tr>}
          <tr className="nota-preview__total"><th colSpan="6">TOTAL Bs:</th><th>{formatMoney(getNotaTotal(nota))}</th></tr>
          <tr className="nota-preview__total-in-words"><th colSpan="7">SON: {formatMoneyInWords(getNotaTotal(nota))}</th></tr>
        </tbody>
      </table>

      <section className="nota-preview__signatures">
        <div>
          <strong>ENTREGADO POR</strong>
          <div className="nota-preview__signature-space">
            {nota.entregadoFirma && <img className={nota.empresaEntregadoPor ? 'nota-preview__signature-image--preset' : undefined} src={nota.entregadoFirma} alt="Firma de quien entrega" />}
          </div>
          <span className="nota-preview__signer-name">{nota.entregadoNombre || '[Persona seleccionada]'}</span>
          <span className="nota-preview__signer-role">{nota.entregadoCargo || '[Cargo]'}</span>
          {nota.entregadoDocumento && <span className="nota-preview__signer-role">{nota.entregadoDocumento}</span>}
          {nota.entregadoTelefono && <span className="nota-preview__signer-role">{nota.entregadoTelefono}</span>}
          {selloEntregado && <img className={`nota-preview__stamp${nota.empresaEntregadoPor === 'jdblab' ? ' nota-preview__stamp--jdblab' : ''}`} src={selloEntregado} alt="Sello de la empresa" />}
        </div>
        <div>
          <strong>RECIBIDO POR</strong>
          <div className="nota-preview__signature-space">
            {nota.recibidoFirma && <img src={nota.recibidoFirma} alt="Firma de quien recibe" />}
          </div>
          <span className="nota-preview__signer-name">{nota.recibidoNombre || '[Persona que recibe]'}</span>
          <span className="nota-preview__signer-role">{nota.recibidoCargo || '[Cargo]'}</span>
        </div>
      </section>

      <DocumentFooter />
    </article>
  )
})

export default NotaPreview
