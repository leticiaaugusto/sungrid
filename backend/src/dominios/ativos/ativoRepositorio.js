/**
 * Repositório de ativos: tabelas `ativo` e `leitura` (histórico por ativo).
 */
import { FUSO_HORARIO } from '../../config/ambiente.js'
import { consultar } from '../../config/banco.js'
import { Ativo } from './Ativo.js'

export const ativoRepositorio = {
  async listarTodos() {
    const { rows } = await consultar('SELECT * FROM ativo ORDER BY codigo')
    return rows.map(Ativo.deLinha)
  },

  /** Lista completa com a última telemetria para a tabela de ativos. */
  async listarComTelemetria(termo = '') {
    const { rows } = await consultar(
      `SELECT a.*,
              t.atualizado_em,
              CASE WHEN a.tipo IN ('PAINEL','INVERSOR')
                   THEN t.potencia_gerada_kw
                   ELSE t.potencia_consumida_kw
              END AS potencia_atual_kw
         FROM ativo a
         LEFT JOIN telemetria_atual t ON t.ativo_id = a.id
        WHERE $1 = '' OR a.codigo ILIKE '%' || $1 || '%' OR a.nome ILIKE '%' || $1 || '%' OR a.tipo ILIKE '%' || $1 || '%'
        ORDER BY a.codigo`,
      [termo.trim()],
    )
    return rows.map((linha) => ({
      ativo: Ativo.deLinha(linha),
      potenciaAtualKw: linha.potencia_atual_kw,
      atualizadoEm: linha.atualizado_em,
    }))
  },

  async buscarCodigo(codigo) {
    const { rows } = await consultar('SELECT * FROM ativo WHERE LOWER(codigo) = LOWER($1) LIMIT 1', [codigo])
    return Ativo.deLinha(rows[0])
  },

  async inserir(dados) {
    const { rows } = await consultar(
      `INSERT INTO ativo (
         codigo, nome, tipo, fabricante, status, horas_operacao,
         proxima_manutencao_h, instalado_em, temperatura_max_c,
         tensao_nominal_v, tolerancia_tensao_pct, corrente_max_a, eficiencia_min_pct
       ) VALUES ($1,$2,$3,$4,$5,0,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [
        dados.codigo,
        dados.nome,
        dados.tipo,
        dados.fabricante,
        dados.status,
        dados.proximaManutencaoH,
        dados.instaladoEm,
        dados.temperaturaMaxC,
        dados.tensaoNominalV,
        dados.toleranciaTensaoPct,
        dados.correnteMaxA,
        dados.eficienciaMinPct,
      ],
    )
    return Ativo.deLinha(rows[0])
  },

  async atualizar(id, dados) {
    const { rows } = await consultar(
      `UPDATE ativo SET
         codigo=$1, nome=$2, tipo=$3, fabricante=$4, status=$5,
         proxima_manutencao_h=$6, instalado_em=$7, temperatura_max_c=$8,
         tensao_nominal_v=$9, tolerancia_tensao_pct=$10,
         corrente_max_a=$11, eficiencia_min_pct=$12
       WHERE id=$13
       RETURNING *`,
      [
        dados.codigo,
        dados.nome,
        dados.tipo,
        dados.fabricante,
        dados.status,
        dados.proximaManutencaoH,
        dados.instaladoEm,
        dados.temperaturaMaxC,
        dados.tensaoNominalV,
        dados.toleranciaTensaoPct,
        dados.correnteMaxA,
        dados.eficienciaMinPct,
        id,
      ],
    )
    return Ativo.deLinha(rows[0])
  },

  async buscarPorId(id) {
    const { rows } = await consultar('SELECT * FROM ativo WHERE id = $1', [id])
    return Ativo.deLinha(rows[0])
  },

  /** Busca por código ou nome, sem diferenciar maiúsculas/minúsculas (RN10). */
  async buscar(termo, limite = 10) {
    const { rows } = await consultar(
      `SELECT * FROM ativo
        WHERE codigo ILIKE '%' || $1 || '%' OR nome ILIKE '%' || $1 || '%'
        ORDER BY codigo
        LIMIT $2`,
      [termo, limite],
    )
    return rows.map(Ativo.deLinha)
  },

  async atualizarStatus(id, status) {
    await consultar('UPDATE ativo SET status = $1 WHERE id = $2 AND status <> $1', [status, id])
  },

  /** Soma horas de operação (o simulador chama a cada leitura de 15 min). */
  async somarHorasOperacao(id, horas) {
    await consultar('UPDATE ativo SET horas_operacao = horas_operacao + $1 WHERE id = $2', [horas, id])
  },

  /**
   * Histórico diário de um ativo nos últimos N dias (RF31 / RN43).
   * Para cada dia: potência média e máxima (kW) e energia (kWh).
   * @param {'gerada'|'consumida'} grandeza
   */
  async historicoDiario(id, inicio, fim, grandeza) {
    const potencia = grandeza === 'gerada' ? 'potencia_gerada_kw' : 'potencia_consumida_kw'
    const energia = grandeza === 'gerada' ? 'energia_gerada_kwh' : 'energia_consumida_kwh'
    const { rows } = await consultar(
      `SELECT to_char((data_hora AT TIME ZONE $4)::date, 'YYYY-MM-DD') AS dia,
              AVG(${potencia}) AS potencia_media_kw,
              MAX(${potencia}) AS potencia_maxima_kw,
              SUM(${energia})  AS energia_kwh
         FROM leitura
        WHERE ativo_id = $1
          AND data_hora >= ($2::date::timestamp AT TIME ZONE $4)
          AND data_hora <  (($3::date + 1)::timestamp AT TIME ZONE $4)
        GROUP BY 1
        ORDER BY 1`,
      [id, inicio, fim, FUSO_HORARIO],
    )
    return rows.map((linha) => ({
      dia: linha.dia,
      potenciaMediaKw: linha.potencia_media_kw,
      potenciaMaximaKw: linha.potencia_maxima_kw,
      energiaKwh: linha.energia_kwh,
    }))
  },
}
