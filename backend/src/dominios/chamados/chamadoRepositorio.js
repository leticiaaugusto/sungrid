/**
 * Repositório de chamados (tabela `chamado`).
 */
import { consultar } from '../../config/banco.js'
import { Chamado } from './Chamado.js'

export const chamadoRepositorio = {
  /** @param {Chamado} chamado */
  async inserir(chamado) {
    const { rows } = await consultar(
      `INSERT INTO chamado (ativo_id, alerta_id, aberto_por, descricao, status, aberto_em)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [chamado.ativoId, chamado.alertaId, chamado.abertoPor, chamado.descricao, chamado.status, chamado.abertoEm],
    )
    return Chamado.deLinha(rows[0])
  },

  /** Lista com o código do ativo e o nome de quem abriu. */
  async listar({ status = null } = {}) {
    const { rows } = await consultar(
      `SELECT c.*, a.codigo AS ativo_codigo, a.nome AS ativo_nome, u.nome AS aberto_por_nome
         FROM chamado c
         JOIN ativo a   ON a.id = c.ativo_id
         JOIN usuario u ON u.id = c.aberto_por
        WHERE ($1::varchar IS NULL OR c.status = $1)
        ORDER BY c.aberto_em DESC`,
      [status],
    )
    return rows.map((linha) => ({
      ...Chamado.deLinha(linha),
      ativo: { id: linha.ativo_id, codigo: linha.ativo_codigo, nome: linha.ativo_nome },
      abertoPorNome: linha.aberto_por_nome,
    }))
  },
}
