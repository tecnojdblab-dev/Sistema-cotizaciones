import { forwardRef } from 'react'
import logoJdblab from '../../../../images/logojdblab.jpeg.png'
import DocumentFooter from '../../../shared/components/DocumentFooter.jsx'
import { formatCertificateDate, sanitizeCertificateHtml } from '../utils/certificadoFormatters.js'
import './CertificadoPreview.css'

const CertificadoPreview = forwardRef(function CertificadoPreview({ certificado }, ref) {
  return (
    <article ref={ref} className={`certificado-preview certificado-preview--${certificado.papel || 'a4'}`}>
      <table className="certificado-preview__header-table">
        <tbody>
          <tr>
            <td rowSpan="3" className="certificado-preview__logo"><img src={logoJdblab} alt="JDBlab" /></td>
            <th>SISTEMA DE GESTIÓN DE LA CALIDAD</th>
            <th>Código</th>
            <td>{certificado.codigo}</td>
          </tr>
          <tr><th>REGISTRO</th><th>Revisión</th><td>{certificado.revision}</td></tr>
          <tr><th>CERTIFICADO DE GARANTÍA</th><th>Página</th><td>1 de 1</td></tr>
        </tbody>
      </table>

      <table className="certificado-preview__client-table">
        <colgroup>
          <col className="certificado-preview__client-label-column" />
          <col />
        </colgroup>
        <tbody>
          <tr><td className="certificado-preview__label"><strong>CLIENTE O ENTIDAD CONTRATANTE:</strong></td><td>{certificado.clienteEntidad || 'CLIENTE O ENTIDAD'}</td></tr>
          <tr><th className="certificado-preview__label">OBJETO DE LA CONTRATACIÓN:</th><td>{certificado.objetoContratacion || 'OBJETO DE LA CONTRATACIÓN'}</td></tr>
          <tr><th colSpan="2" className="certificado-preview__blue-title">TIEMPO DE GARANTÍA {certificado.garantiaAnos} AÑO{Number(certificado.garantiaAnos) === 1 ? '' : 'S'}</th></tr>
        </tbody>
      </table>
      <div className="certificado-preview__dates">
        <span>DESDE:</span><strong>{formatCertificateDate(certificado.fechaDesde)}</strong>
        <span>HASTA:</span><strong>{formatCertificateDate(certificado.fechaHasta)}</strong>
      </div>

      <h3 className="certificado-preview__section-title">1. &nbsp; DESCRIPCIÓN DE LA ENTREGA.</h3>
      <table className="certificado-preview__items-table">
        <colgroup>
          <col className="certificado-preview__item-number-column" />
          <col />
          <col className="certificado-preview__item-quantity-column" />
          <col className="certificado-preview__item-notes-column" />
        </colgroup>
        <thead><tr><th>ÍTEM</th><th>DESCRIPCIÓN</th><th>CANTIDAD</th><th>ACLARACIONES</th></tr></thead>
        <tbody>
          {(certificado.items || []).map((item, index) => (
            <tr key={`${item.descripcion}-${index}`}>
              <td>{index + 1}</td>
              <td>
                <strong>{item.descripcion || 'DESCRIPCIÓN DEL EQUIPO'}</strong>
                {(item.marca || item.modelo) && <><br /><em>MARCA: <strong>{item.marca || '-'}</strong> &nbsp; MODELO: {item.modelo || '-'}</em></>}
              </td>
              <td>{item.cantidad}</td>
              <td><strong>{item.aclaraciones}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="certificado-preview__warranty">
        <h3>CERTIFICADO DE GARANTÍA</h3>
        <div dangerouslySetInnerHTML={{ __html: sanitizeCertificateHtml(certificado.condicionesHtml) }} />
      </section>

      <section className="certificado-preview__signature">
        {certificado.firmaImagen && (
          <img
            src={certificado.firmaImagen}
            alt="Firma"
            className={`certificado-preview__signature-image${certificado.empresaFirmante ? ' certificado-preview__signature-image--preset' : ''}`}
          />
        )}
        {certificado.firmanteNombre && <strong>{certificado.firmanteNombre}</strong>}
        {certificado.firmanteCargo && <span className="certificado-preview__signer-detail">{certificado.firmanteCargo}</span>}
        {certificado.firmanteDocumento && <span className="certificado-preview__signer-detail">{certificado.firmanteDocumento}</span>}
        {certificado.firmanteTelefono && <span>{certificado.firmanteTelefono}</span>}
        {certificado.selloImagen && (
          <img
            src={certificado.selloImagen}
            alt="Sello"
            className={`certificado-preview__stamp-image${certificado.empresaFirmante === 'jdblab' ? ' certificado-preview__stamp-image--jdblab' : ''}`}
          />
        )}
      </section>

      <DocumentFooter />
    </article>
  )
})

export default CertificadoPreview
