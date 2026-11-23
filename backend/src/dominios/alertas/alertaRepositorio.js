/**
 * Repositório de alertas (tabela `alerta`).
 * O índice (status, prioridade, criado_em) do schema atende o RNF08.
 */
import { consultar } from '../../config/banco.js'
import { Alerta, STATUS_ALERTA } from './Alerta.js'

const SELECT_COM_ATIVO = `
  SELECT al.*, a.codigo AS ativo_codigo, a.nome AS ativo_nome
    FROM alerta al
    LEFT JOIN ativo a ON a.id = al.ativo_id`

export const alertaRepositorio = {
  async buscarPorId(id) {
    const { rows } = await consultar(`${SELECT_COM_ATIVO} WHERE al.id = $1`, [id])
    return Alerta.deLinha(rows[0])
  },

  /**
   * Lista com filtros combinados (RN31): status E prioridade.
   * Filtro nulo = "Todos/Todas" (não restringe a categoria).
   */
  async listar({ status = null, prioridade = null, limite = 500 } = {}) {
    const { rows } = await consultar(
      `${SELECT_COM_ATIVO}
        WHERE ($1::varchar IS NULL OR al.status = $1)
          AND ($2::varchar IS NULL OR al.prioridade = $2)
        ORDER BY al.criado_em DESC
        LIMIT $3`,
      [status, prioridade, limite],
    )
    return rows.map(Alerta.deLinha)
  },

  /** Alerta ATIVO do mesmo tipo e ativo (evita duplicados — RN35). */
  async buscarAtivoPorTipo(tipo, ativoId) {
    const { rows } = await consultar(
      `SELECT * FROM alerta
        WHERE tipo = $1 AND status = $3
          AND ativo_id IS NOT DISTINCT FROM $2
        LIMIT 1`,
      [tipo, ativoId, STATUS_ALERTA.ATIVO],
    )
    return Alerta.deLinha(rows[0])
  },

  /** @param {Alerta} alerta */
  async inserir(alerta) {
    const { rows } = await consultar(
      `INSERT INTO alerta (ativo_id, tipo, descricao, prioridade, status, criado_em)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [alerta.ativoId, alerta.tipo, alerta.descricao, alerta.prioridade, alerta.status, alerta.criadoEm],
    )
    return Alerta.deLinha(rows[0])
  },

  /** @param {Alerta} alerta */
  async salvarResolucao(alerta) {
    await consultar(
      `UPDATE alerta SET status = $1, resolvido_em = $2, resolvido_por = $3
        WHERE id = $4`,
      [alerta.status, alerta.resolvidoEm, alerta.resolvidoPor, alerta.id],
    )
  },

  /** Contagem de alertas ativos e críticos (card do Dashboard — RN18). */
  async contarAtivos() {
    const { rows } = await consultar(
      `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE prioridade = 'ALTA') AS criticos
         FROM alerta
        WHERE status = 'ATIVO'`,
    )
    return { total: rows[0].total, criticos: rows[0].criticos }
  },

  /** Quantos alertas ativos um ativo tem (para decidir o status ALERTA — RN41). */
  async contarAtivosDoAtivo(ativoId) {
    const { rows } = await consultar(
      `SELECT COUNT(*) AS total FROM alerta WHERE ativo_id = $1 AND status = 'ATIVO'`,
      [ativoId],
    )
    return rows[0].total
  },
}
