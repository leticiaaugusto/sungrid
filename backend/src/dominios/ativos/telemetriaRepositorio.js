/**
 * Repositório da telemetria atual (tabela `telemetria_atual`).
 */
import { consultar } from '../../config/banco.js'
import { TelemetriaAtual } from './TelemetriaAtual.js'

export const telemetriaRepositorio = {
  async buscarPorAtivo(ativoId) {
    const { rows } = await consultar('SELECT * FROM telemetria_atual WHERE ativo_id = $1', [ativoId])
    return TelemetriaAtual.deLinha(rows[0])
  },

  async listarTodas() {
    const { rows } = await consultar('SELECT * FROM telemetria_atual')
    return rows.map(TelemetriaAtual.deLinha)
  },

  /**
   * Grava (ou sobrescreve) a telemetria de um ativo.
   * "INSERT ... ON CONFLICT DO UPDATE" garante no máximo uma linha por ativo.
   * @param {TelemetriaAtual} telemetria
   */
  async salvar(telemetria) {
    await consultar(
      `INSERT INTO telemetria_atual
         (ativo_id, atualizado_em, potencia_gerada_kw, potencia_consumida_kw,
          temperatura_c, tensao_v, corrente_a, eficiencia_pct, carga_pct)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (ativo_id) DO UPDATE SET
         atualizado_em = EXCLUDED.atualizado_em,
         potencia_gerada_kw = EXCLUDED.potencia_gerada_kw,
         potencia_consumida_kw = EXCLUDED.potencia_consumida_kw,
         temperatura_c = EXCLUDED.temperatura_c,
         tensao_v = EXCLUDED.tensao_v,
         corrente_a = EXCLUDED.corrente_a,
         eficiencia_pct = EXCLUDED.eficiencia_pct,
         carga_pct = EXCLUDED.carga_pct`,
      [
        telemetria.ativoId,
        telemetria.atualizadoEm,
        telemetria.potenciaGeradaKw,
        telemetria.potenciaConsumidaKw,
        telemetria.temperaturaC,
        telemetria.tensaoV,
        telemetria.correnteA,
        telemetria.eficienciaPct,
        telemetria.cargaPct,
      ],
    )
  },
}
