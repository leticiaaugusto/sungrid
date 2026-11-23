/**
 * Repositório dos parâmetros do sistema (tabelas `configuracao` e `tarifa`).
 * Essas tabelas não têm chave estrangeira com as demais (seção 6.1).
 */
import { consultar } from '../../config/banco.js'
import { Configuracao } from './Configuracao.js'
import { Tarifa } from './Tarifa.js'

export const parametrosRepositorio = {
  async buscarConfiguracao() {
    const { rows } = await consultar('SELECT * FROM configuracao WHERE id = 1')
    return Configuracao.deLinha(rows[0])
  },

  /** Tarifa vigente em uma data AAAA-MM-DD. */
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
