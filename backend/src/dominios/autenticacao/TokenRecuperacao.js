/**
 * Entidade TokenRecuperacao (tabela `token_recuperacao`) — RN05 / RNF12.
 *
 * O token original (texto aleatório) vai SOMENTE no link enviado por
 * e-mail. O banco guarda apenas o hash SHA-256 dele: se alguém ler a
 * tabela, não consegue usar os links.
 */
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

  /** Calcula o hash SHA-256 de um token em texto. */
  static calcularHash(token) {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  /**
   * Cria um token novo para o usuário.
   * Devolve o token em texto (para o link) e a entidade (para o banco).
   */
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

  /** Válido = ainda não expirou e nunca foi usado. */
  estaValido(agora = new Date()) {
    return !this.usadoEm && new Date(this.expiraEm) > agora
  }

  /** Impede que o mesmo link redefina a senha duas vezes. */
  marcarComoUsado(agora = new Date()) {
    this.usadoEm = agora
  }
}
