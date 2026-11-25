
import { consultar } from '../../config/banco.js'
import { Configuracao } from './Configuracao.js'
import { Tarifa } from './Tarifa.js'

// Esta constante disponibiliza parametrosRepositorio para outras partes do projeto.

export const parametrosRepositorio = {
  async buscarConfiguracao() {
    const { rows } = await consultar('SELECT * FROM configuracao WHERE id = 1')
    return Configuracao.deLinha(rows[0])
  },

  async buscarTarifaVigente(data) {
    const { rows } = await consultar(
      `SELECT * FROM tarifa
        WHERE vigente_desde <= $1
        ORDER BY vigente_desde DESC
        LIMIT 1`,
      [data],
    )
    return Tarifa.deLinha(rows[0])
  },
}
