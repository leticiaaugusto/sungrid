
import crypto from 'node:crypto'

export class TokenRecuperacao {
  constructor({ id, usuarioId, tokenHash, expiraEm, usadoEm }) {
    this.id = id
    this.usuarioId = usuarioId
    this.tokenHash = tokenHash
    this.expiraEm = expiraEm
    this.usadoEm = usadoEm
  }

  static deLinha(linha) {
    if (!linha) return null
    return new TokenRecuperacao({
      id: linha.id,
      usuarioId: linha.usuario_id,
      tokenHash: linha.token_hash,
      expiraEm: linha.expira_em,
      usadoEm: linha.usado_em,
    })
  }

  static calcularHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  static gerar(usuarioId, validadeMinutos) {
    const token = crypto.randomBytes(32).toString('hex')
    const entidade = new TokenRecuperacao({
      usuarioId,
      tokenHash: TokenRecuperacao.calcularHash(token),
      expiraEm: new Date(Date.now() + validadeMinutos * 60 * 1000),
      usadoEm: null,
    })
    return { token, entidade }
  }

  estaValido(agora = new Date()) {
    return !this.usadoEm && new Date(this.expiraEm) > agora
  }

  marcarComoUsado(agora = new Date()) {
    this.usadoEm = agora
  }
}
