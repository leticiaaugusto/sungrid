
import { consultar } from '../../config/banco.js'
import { Usuario } from './Usuario.js'

// Esta constante disponibiliza usuarioRepositorio para outras partes do projeto.

export const usuarioRepositorio = {
  async buscarPorId(id) {
    const { rows } = await consultar('SELECT * FROM usuario WHERE id = $1', [id])
    return Usuario.deLinha(rows[0])
  },

  async buscarPorEmail(email) {
    const { rows } = await consultar('SELECT * FROM usuario WHERE LOWER(email) = LOWER($1)', [email])
    return Usuario.deLinha(rows[0])
  },

  async inserir({ nome, email, senhaHash, cargo = null, papel = 'OPERADOR', papelSolicitado = null }) {
    const { rows } = await consultar(
      `INSERT INTO usuario (nome, email, senha_hash, cargo, papel, papel_solicitado)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nome, email, senhaHash, cargo, papel, papelSolicitado],
    )
    return Usuario.deLinha(rows[0])
  },

  async contarAdministradores() {
    const { rows } = await consultar("SELECT COUNT(*) AS total FROM usuario WHERE papel = 'ADMINISTRADOR'")
    return rows[0].total
  },

  async listarTodos() {
    const { rows } = await consultar("SELECT * FROM usuario WHERE papel <> 'SISTEMA' ORDER BY criado_em DESC")
    return rows.map(Usuario.deLinha)
  },

  async atualizarPerfil(id, dados) {
    const { rows } = await consultar(
      'UPDATE usuario SET nome=$1, cargo=$2, foto_url=$3 WHERE id=$4 RETURNING *',
      [dados.nome, dados.cargo, dados.fotoUrl, id],
    )
    return Usuario.deLinha(rows[0])
  },

  async alterarPapel(id, papel, limparSolicitado = true) {
    const { rows } = await consultar(
      `UPDATE usuario SET papel=$1, papel_solicitado=${limparSolicitado ? 'NULL' : 'papel_solicitado'} WHERE id=$2 RETURNING *`,
      [papel, id],
    )
    return Usuario.deLinha(rows[0])
  },

  async definirPedido(id, pedido) {
    const { rows } = await consultar(
      'UPDATE usuario SET papel_solicitado=$1 WHERE id=$2 RETURNING *',
      [pedido, id],
    )
    return Usuario.deLinha(rows[0])
  },

  async atualizarSenha(id, senhaHash, cliente) {
    const executor = cliente ?? { query: consultar }
    await executor.query('UPDATE usuario SET senha_hash = $1 WHERE id = $2', [senhaHash, id])
  },

  async contarChamadosAbertosPor(id, cliente) {
    const executor = cliente ?? { query: consultar }
    const { rows } = await executor.query('SELECT COUNT(*) AS total FROM chamado WHERE aberto_por = $1', [id])
    return rows[0].total
  },

  async anonimizar(id, senhaHashAleatoria, cliente) {
    await cliente.query(
      `UPDATE usuario
          SET nome = 'Usuário removido',
              email = 'removido-' || id || '@sungrid.invalid',
              senha_hash = $2,
              cargo = NULL,
              foto_url = NULL
        WHERE id = $1`,
      [id, senhaHashAleatoria],
    )

    await cliente.query('DELETE FROM token_recuperacao WHERE usuario_id = $1', [id])
  },

  async excluir(id, cliente) {
    await cliente.query('DELETE FROM usuario WHERE id = $1', [id])
  },
}
