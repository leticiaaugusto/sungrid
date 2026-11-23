/**
 * Repositório dos tokens de recuperação de senha (tabela `token_recuperacao`).
 */
import { consultar } from '../../config/banco.js'
import { TokenRecuperacao } from './TokenRecuperacao.js'

export const tokenRecuperacaoRepositorio = {
  /** @param {TokenRecuperacao} token */
  async inserir(token) {
    await consultar(
      `INSERT INTO token_recuperacao (usuario_id, token_hash, expira_em)
       VALUES ($1, $2, $3)`,
      [token.usuarioId, token.tokenHash, token.expiraEm],
    )
  },

  async buscarPorHash(tokenHash, cliente) {
    const executor = cliente ?? { query: consultar }
    // FOR UPDATE trava a linha: dois cliques simultâneos não usam o mesmo token.
    const { rows } = await executor.query(
      'SELECT * FROM token_recuperacao WHERE token_hash = $1 FOR UPDATE',
      [tokenHash],
    )
    return TokenRecuperacao.deLinha(rows[0])
  },

  /** @param {TokenRecuperacao} token */
  async salvarUso(token, cliente) {
    await cliente.query('UPDATE token_recuperacao SET usado_em = $1 WHERE id = $2', [token.usadoEm, token.id])
  },

  /** Invalida links anteriores ainda não usados (só o último pedido vale). */
  async invalidarPendentes(usuarioId) {
    await consultar(
      'UPDATE token_recuperacao SET usado_em = now() WHERE usuario_id = $1 AND usado_em IS NULL',
      [usuarioId],
    )
  },
}
