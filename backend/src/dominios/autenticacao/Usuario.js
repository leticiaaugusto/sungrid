
import bcrypt from 'bcrypt'
import { NOMES_PAPEIS, PERMISSOES_POR_PAPEL } from './permissoes.js'

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

  static gerarHashSenha(senha) {
    return bcrypt.hash(senha, CUSTO_BCRYPT)
  }

  verificarSenha(senha) {
    return bcrypt.compare(senha, this.senhaHash)
  }

  iniciais() {
    return this.nome
      .split(' ')
      .filter(Boolean)
      .map((parte) => parte[0].toUpperCase())
      .slice(0, 2)
      .join('')
  }

  temPermissao(acao) {
    return (PERMISSOES_POR_PAPEL[this.papel] ?? []).includes(acao)
  }

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
