
import { FUSO_HORARIO } from '../../config/ambiente.js'
import { consultar } from '../../config/banco.js'
import { TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO } from './fontesDeEnergia.js'

const FILTRO_PERIODO = `
  l.data_hora >= ($1::date::timestamp AT TIME ZONE $3)
  AND l.data_hora < (($2::date + 1)::timestamp AT TIME ZONE $3)`

// Esta constante disponibiliza consumoRepositorio para outras partes do projeto.

export const consumoRepositorio = {

  async totaisPorDia(inicio, fim, usuarioId) {
    const { rows } = await consultar(
      `SELECT to_char((l.data_hora AT TIME ZONE $3)::date, 'YYYY-MM-DD') AS dia,
              SUM(l.energia_consumida_kwh) FILTER (WHERE a.tipo = $4) AS consumo_kwh,
              SUM(l.energia_gerada_kwh)    FILTER (WHERE a.tipo = $5) AS geracao_kwh
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE ${FILTRO_PERIODO}
          AND ($6::int IS NULL OR a.usuario_id = $6)
        GROUP BY 1
        ORDER BY 1`,
      [inicio, fim, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO, usuarioId],
    )
    return rows.map((linha) => ({
      dia: linha.dia,
      consumoKwh: linha.consumo_kwh,
      geracaoKwh: linha.geracao_kwh,
    }))
  },

  async totaisDoPeriodo(inicio, fim, usuarioId) {
    const { rows } = await consultar(
      `SELECT COALESCE(SUM(l.energia_consumida_kwh) FILTER (WHERE a.tipo = $4), 0) AS consumo_kwh,
              COALESCE(SUM(l.energia_gerada_kwh)    FILTER (WHERE a.tipo = $5), 0) AS geracao_kwh,
              COUNT(DISTINCT (l.data_hora AT TIME ZONE $3)::date)                  AS dias_com_leitura
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE ${FILTRO_PERIODO}
          AND ($6::int IS NULL OR a.usuario_id = $6)`,
      [inicio, fim, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO, usuarioId],
    )
    return {
      consumoKwh: rows[0].consumo_kwh,
      geracaoKwh: rows[0].geracao_kwh,
      diasComLeitura: rows[0].dias_com_leitura,
    }
  },

  async consumoAteHorario(data, horario, usuarioId) {
    const { rows } = await consultar(
      `SELECT COALESCE(SUM(l.energia_consumida_kwh), 0) AS consumo_kwh
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = $3
          AND l.data_hora >= ($1::date::timestamp AT TIME ZONE $2)
          AND l.data_hora <  (($1::date + $4::time)::timestamp AT TIME ZONE $2)
          AND ($5::int IS NULL OR a.usuario_id = $5)`,
      [data, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, horario, usuarioId],
    )
    return rows[0].consumo_kwh
  },

  async totaisPorHora(data, usuarioId) {
    const { rows } = await consultar(
      `SELECT EXTRACT(HOUR FROM l.data_hora AT TIME ZONE $3)::int          AS hora,
              SUM(l.energia_consumida_kwh) FILTER (WHERE a.tipo = $4)     AS consumo_kwh,
              SUM(l.energia_gerada_kwh)    FILTER (WHERE a.tipo = $5)     AS geracao_kwh
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE ${FILTRO_PERIODO}
          AND ($6::int IS NULL OR a.usuario_id = $6)
        GROUP BY 1
        ORDER BY 1`,
      [data, data, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, TIPO_ATIVO_GERACAO, usuarioId],
    )
    return rows.map((linha) => ({
      hora: linha.hora,
      consumoKwh: linha.consumo_kwh,
      geracaoKwh: linha.geracao_kwh,
    }))
  },

  async picoDeConsumo(data, usuarioId) {
    const { rows } = await consultar(
      `SELECT l.potencia_consumida_kw AS potencia_kw,
              to_char(l.data_hora AT TIME ZONE $3, 'HH24:MI') AS horario
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = $4 AND ${FILTRO_PERIODO}
          AND ($5::int IS NULL OR a.usuario_id = $5)
          AND l.potencia_consumida_kw IS NOT NULL
        ORDER BY l.potencia_consumida_kw DESC
        LIMIT 1`,
      [data, data, FUSO_HORARIO, TIPO_ATIVO_CONSUMO, usuarioId],
    )
    return rows[0] ? { potenciaKw: rows[0].potencia_kw, horario: rows[0].horario } : null
  },

  async picoSolar(data, usuarioId) {
    const { rows } = await consultar(
      `SELECT SUM(l.potencia_gerada_kw) AS potencia_kw,
              to_char(l.data_hora AT TIME ZONE $3, 'HH24:MI') AS horario
         FROM leitura l
         JOIN ativo a ON a.id = l.ativo_id
        WHERE a.tipo = $4 AND ${FILTRO_PERIODO}
          AND ($5::int IS NULL OR a.usuario_id = $5)
        GROUP BY l.data_hora
        HAVING SUM(l.potencia_gerada_kw) > 0
        ORDER BY 1 DESC
        LIMIT 1`,
      [data, data, FUSO_HORARIO, TIPO_ATIVO_GERACAO, usuarioId],
    )
    return rows[0] ? { potenciaKw: rows[0].potencia_kw, horario: rows[0].horario } : null
  },
}
