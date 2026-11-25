
import { consultar } from '../../config/banco.js'

// Esta constante disponibiliza auditoriaRepositorio para outras partes do projeto.

export const auditoriaRepositorio = {

  async inserir(registro) {
    await consultar(
      `INSERT INTO auditoria (usuario_id, acao, entidade, entidade_id, ip, detalhes, data_hora)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        registro.usuarioId,
        registro.acao,
        registro.entidade,
        registro.entidadeId,
        registro.ip,
        registro.detalhes ? JSON.stringify(registro.detalhes) : null,
        registro.dataHora,
      ],
    )
  },

  async listarPorUsuario(usuarioId) {
    const { rows } = await consultar(
      `SELECT acao, entidade, entidade_id, data_hora
         FROM auditoria
        WHERE usuario_id = $1
        ORDER BY data_hora DESC`,
      [usuarioId],
    )
    return rows.map((linha) => ({
      acao: linha.acao,
      entidade: linha.entidade,
      entidadeId: linha.entidade_id,
      dataHora: linha.data_hora,
    }))
  },
}
