/**
 * Entidade Usuario (tabela `usuario`).
 *
 * Métodos do diagrama de classes:
 *  - verificarSenha: compara a senha digitada com o hash bcrypt (RN01 / RNF09)
 *  - iniciais: letras exibidas no topo quando não há foto
 *  - temPermissao: controle de acesso por papel (RN09)
 */
import bcrypt from 'bcrypt'
import { NOMES_PAPEIS, PERMISSOES_POR_PAPEL } from './permissoes.js'

/** Custo do bcrypt: quanto maior, mais lento (e mais seguro) o hash. */
const CUSTO_BCRYPT = 10

export class Usuario {
  constructor({ id, nome, email, senhaHash, cargo, papel, papelSolicitado, fotoUrl, criadoEm }) {
    this.id = id
    this.nome = nome
    this.email = email
    this.senhaHash = senhaHash
    this.cargo = cargo
    this.papel = papel
    this.papelSolicitado = papelSolicitado
    this.fotoUrl = fotoUrl
    this.criadoEm = criadoEm
  }

  /** Converte uma linha do banco (snake_case) em objeto de domínio. */
  static deLinha(linha) {
    if (!linha) return null
    return new Usuario({
      id: linha.id,
      nome: linha.nome,
      email: linha.email,
      senhaHash: linha.senha_hash,
      cargo: linha.cargo,
      papel: linha.papel,
      papelSolicitado: linha.papel_solicitado,
      fotoUrl: linha.foto_url,
      criadoEm: linha.criado_em,
    })
  }

  /** Gera o hash bcrypt de uma senha. A senha original nunca é gravada. */
  static gerarHashSenha(senha) {
    return bcrypt.hash(senha, CUSTO_BCRYPT)
  }

  /** Compara a senha digitada com o hash armazenado. */
  verificarSenha(senha) {
    return bcrypt.compare(senha, this.senhaHash)
  }

  /** "Carlos Silva" -> "CS". */
  iniciais() {
    return this.nome
      .split(' ')
      .filter(Boolean)
      .map((parte) => parte[0].toUpperCase())
      .slice(0, 2)
      .join('')
  }

  /** Verifica se o papel do usuário permite a ação (ver permissoes.js). */
  temPermissao(acao) {
    return (PERMISSOES_POR_PAPEL[this.papel] ?? []).includes(acao)
  }

  /** Dados seguros para enviar ao frontend (sem o hash da senha). */
  paraResposta() {
    return {
      id: this.id,
      nome: this.nome,
      email: this.email,
      cargo: this.cargo ?? NOMES_PAPEIS[this.papel],
      papel: this.papel,
      papelSolicitado: this.papelSolicitado,
      nomePapel: NOMES_PAPEIS[this.papel],
      fotoUrl: this.fotoUrl,
      iniciais: this.iniciais(),
    }
  }
}
