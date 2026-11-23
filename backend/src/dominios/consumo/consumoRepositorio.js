/**
 * Repositório de consumo: consultas agregadas sobre a tabela `leitura`.
 *
 * Os totais diários e mensais NÃO são armazenados: são sempre calculados
 * a partir das leituras (seção 6), assim todas as telas mostram números
 * coerentes entre si (RN13). Cada consulta converte `data_hora` para o
 * fuso oficial antes de agrupar por dia ou por hora (RN14).
 */
import { FUSO_HORARIO } from '../../config/ambiente.js'
import { consultar } from '../../config/banco.js'
import { TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO } from './fontesDeEnergia.js'

// Trecho reutilizado: limita as leituras a um intervalo de dias locais [inicio, fim].
// $1 = data inicial, $2 = data final (inclusive), $3 = fuso horário.
const FILTRO_PERIODO = `
  l.data_hora >= ($1::date::timestamp AT TIME ZONE $3)
  AND l.data_hora < (($2::date + 1)::timestamp AT TIME ZONE $3)`

export const consumoRepositorio = {
  /**
   * Energia consumida e gerada por dia (kWh) entre duas datas.
   * Dias sem nenhuma leitura não aparecem no resultado (RN24): quem chama
   * decide como mostrar "sem dados", que é diferente de consumo zero.
   */
  async totaisPorDia(inicio, fim) {
    const { rows } = await consultar(
      `SELECT to_char((l.data_hora AT TIME ZONE $3)::date, 'YYYY-MM-DD') AS dia,
              SUM(l.energia_consumida_kwh) FILTER (WHERE a.tipo = $4) AS consumo_kwh,
              SUM(l.energia_gerada_kwh)    FILTER (WHERE a.tipo = $5) AS geracao_kwh
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE ${FILTRO_PERIODO}
        GROUP BY 1
        ORDER BY 1`,
      [inicio, fim, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO],
    )
    return rows.map((linha) => ({
      dia: linha.dia,
      consumoKwh: linha.consumo_kwh,
      geracaoKwh: linha.geracao_kwh,
    }))
  },

  /** Soma de consumo e geração (kWh) de um período inteiro. */
  async totaisDoPeriodo(inicio, fim) {
    const { rows } = await consultar(
      `SELECT COALESCE(SUM(l.energia_consumida_kwh) FILTER (WHERE a.tipo = $4), 0) AS consumo_kwh,
              COALESCE(SUM(l.energia_gerada_kwh)    FILTER (WHERE a.tipo = $5), 0) AS geracao_kwh,
              COUNT(DISTINCT (l.data_hora AT TIME ZONE $3)::date)                  AS dias_com_leitura
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE ${FILTRO_PERIODO}`,
      [inicio, fim, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO],
    )
    return {
      consumoKwh: rows[0].consumo_kwh,
      geracaoKwh: rows[0].geracao_kwh,
      diasComLeitura: rows[0].dias_com_leitura,
    }
  },

  /**
   * Consumo até um certo horário do dia (para comparar "hoje até agora"
   * com "ontem até o mesmo horário" — RN16).
   */
  async consumoAteHorario(data, horario) {
    const { rows } = await consultar(
      `SELECT COALESCE(SUM(l.energia_consumida_kwh), 0) AS consumo_kwh
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = $3
          AND l.data_hora >= ($1::date::timestamp AT TIME ZONE $2)
          AND l.data_hora <  (($1::date + $4::time)::timestamp AT TIME ZONE $2)`,
      [data, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, horario],
    )
    return rows[0].consumo_kwh
  },

  /**
   * Energia por hora de um dia (RN21). Como cada hora tem 1 h de duração,
   * a energia da hora em kWh é numericamente igual à potência média em kW.
   */
  async totaisPorHora(data) {
    const { rows } = await consultar(
      `SELECT EXTRACT(HOUR FROM l.data_hora AT TIME ZONE $3)::int          AS hora,
              SUM(l.energia_consumida_kwh) FILTER (WHERE a.tipo = $4)     AS consumo_kwh,
              SUM(l.energia_gerada_kwh)    FILTER (WHERE a.tipo = $5)     AS geracao_kwh
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE ${FILTRO_PERIODO}
        GROUP BY 1
        ORDER BY 1`,
      [data, data, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO],
    )
    return rows.map((linha) => ({
      hora: linha.hora,
      consumoKwh: linha.consumo_kwh,
      geracaoKwh: linha.geracao_kwh,
    }))
  },

  /** Maior potência consumida (kW) registrada no dia e o horário (RN23). */
  async picoDeConsumo(data) {
    const { rows } = await consultar(
      `SELECT l.potencia_consumida_kw AS potencia_kw,
              to_char(l.data_hora AT TIME ZONE $3, 'HH24:MI') AS horario
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = $4 AND ${FILTRO_PERIODO}
          AND l.potencia_consumida_kw IS NOT NULL
        ORDER BY l.potencia_consumida_kw DESC
        LIMIT 1`,
      [data, data, FUSO_HORARIO, TIPO_ATIVO_CONSUMO],
    )
    return rows[0] ? { potenciaKw: rows[0].potencia_kw, horario: rows[0].horario } : null
  },

  /**
   * Pico solar (RN22): momento de maior potência gerada somando todos os
   * inversores na mesma leitura de 15 minutos.
   */
  async picoSolar(data) {
    const { rows } = await consultar(
      `SELECT SUM(l.potencia_gerada_kw) AS potencia_kw,
              to_char(l.data_hora AT TIME ZONE $3, 'HH24:MI') AS horario
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = $4 AND ${FILTRO_PERIODO}
        GROUP BY l.data_hora
        HAVING SUM(l.potencia_gerada_kw) > 0
        ORDER BY 1 DESC
        LIMIT 1`,
      [data, data, FUSO_HORARIO, TIPO_ATIVO_GERACAO],
    )
    return rows[0] ? { potenciaKw: rows[0].potencia_kw, horario: rows[0].horario } : null
  },
}
