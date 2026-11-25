
import { consultar } from '../../config/banco.js'
import { TokenRecuperacao } from './TokenRecuperacao.js'

// Esta constante disponibiliza tokenRecuperacaoRepositorio para outras partes do projeto.

export const tokenRecuperacaoRepositorio = {

  async inserir(token) {
    await consultar(
      `INSERT INTO token_recuperacao (usuario_id, token_hash, expira_em)
       VALUES ($1, $2, $3)`,
      [token.usuarioId, token.tokenHash, token.expiraEm],
    )
  },

  async buscarPorHash(tokenHash, cliente) {
    const executor = cliente ?? { query: consultar }

    const { rows } = await executor.query(
      'SELECT * FROM token_recuperacao WHERE token_hash = $1 FOR UPDATE',
      [tokenHash],
    )
    return TokenRecuperacao.deLinha(rows[0])
  },

  async salvarUso(token, cliente) {
    await cliente.query('UPDATE token_recuperacao SET usado_em = $1 WHERE id = $2', [token.usadoEm, token.id])
  },

  async invalidarPendentes(usuarioId) {
    await consultar(
      'UPDATE token_recuperacao SET usado_em = now() WHERE usuario_id = $1 AND usado_em IS NULL',
      [usuarioId],
    )
  },
}
