import firmaTecnoEquip from '../../../images/TECNOEQUIP/FIRMATECNO.webp'
import selloTecnoEquip from '../../../images/TECNOEQUIP/SELLOTECNO.webp'
import firmaJdbLab from '../../../images/JDBLAB/firmaJDBLAB.webp'
import selloJdbLab from '../../../images/JDBLAB/CELLOJDBLAB.webp'

export const FIRMANTE_PRESETS = Object.freeze({
  tecnoequip: {
    firmanteNombre: 'ING. JORGE DAVALOS CRESPO',
    firmanteCargo: 'TECNOequip',
    firmanteDocumento: 'NIT: 4513773014',
    // firmanteTelefono: 'Cel: 70769521',
    firmanteTelefono: '',
    firmaImagen: firmaTecnoEquip,
    selloImagen: selloTecnoEquip,
  },
  jdblab: {
    firmanteNombre: 'LIC. DELIA A. CRESPO DAVID',
    firmanteCargo: 'JDBlab',
    firmanteDocumento: 'NIT: 800082018',
    // firmanteTelefono: 'CEL. 70769521',
    firmanteTelefono: '',
    firmaImagen: firmaJdbLab,
    selloImagen: selloJdbLab,
  },
})
