/**
 * Repositório de gravação das leituras históricas (tabela `leitura`).
 * Quem grava é o simulador; quem lê são os repositórios de consumo e de ativos.
 */
import { consultar } from '../../config/banco.js'

const COLUNAS = [
  'ativo_id',
  'data_hora',
  'potencia_gerada_kw',
  'potencia_consumida_kw',
  'energia_gerada_kwh',
  'energia_consumida_kwh',
  'temperatura_c',
  'tensao_v',
  'corrente_a',
  'eficiencia_pct',
  'carga_pct',
]

export const leituraRepositorio = {
  /**
   * Insere várias leituras em um único comando.
   * ON CONFLICT DO NOTHING: se a leitura daquele ativo naquele horário já
   * existir (índice único ativo_id + data_hora), ela é ignorada (RN17).
   * @param {import('./Leitura.js').Leitura[]} leituras
   */
  async inserirVarias(leituras) {
    if (leituras.length === 0) return
    const valores = []
    const linhas = leituras.map((leitura, indice) => {
      valores.push(
        leitura.ativoId,
        leitura.dataHora,
        leitura.potenciaGeradaKw,
        leitura.potenciaConsumidaKw,
        leitura.energiaGeradaKwh,
        leitura.energiaConsumidaKwh,
        leitura.temperaturaC,
        leitura.tensaoV,
        leitura.correnteA,
        leitura.eficienciaPct,
        leitura.cargaPct,
      )
      const base = indice * COLUNAS.length
      return `(${COLUNAS.map((_, coluna) => `$${base + coluna + 1}`).join(', ')})`
    })

    await consultar(
      `INSERT INTO leitura (${COLUNAS.join(', ')})
       VALUES ${linhas.join(', ')}
       ON CONFLICT (ativo_id, data_hora) DO NOTHING`,
      valores,
    )
  },

  async contar() {
    const { rows } = await consultar('SELECT COUNT(*) AS total FROM leitura')
    return rows[0].total
  },

  /** Última carga registrada da bateria (para o simulador continuar de onde parou). */
  async ultimaCargaBateria() {
    const { rows } = await consultar(
      `SELECT l.carga_pct
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = 'BATERIA' AND l.carga_pct IS NOT NULL
        ORDER BY l.data_hora DESC
        LIMIT 1`,
    )
    return rows[0]?.carga_pct ?? null
  },
}
