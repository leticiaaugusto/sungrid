
// Esta constante disponibiliza PRIORIDADES para outras partes do projeto.

export const PRIORIDADES = Object.freeze({ ALTA: 'ALTA', MEDIA: 'MEDIA', BAIXA: 'BAIXA' })
// Esta constante disponibiliza STATUS_ALERTA para outras partes do projeto.
export const STATUS_ALERTA = Object.freeze({ ATIVO: 'ATIVO', RESOLVIDO: 'RESOLVIDO' })

export class Alerta {
  constructor({ id, ativoId, tipo, descricao, prioridade, status, criadoEm, resolvidoEm, resolvidoPor, ativo }) {
    this.id = id
    this.ativoId = ativoId
    this.tipo = tipo
    this.descricao = descricao
    this.prioridade = prioridade
    this.status = status
    this.criadoEm = criadoEm
    this.resolvidoEm = resolvidoEm
    this.resolvidoPor = resolvidoPor

    this.ativo = ativo ?? null
  }

  static deLinha(linha) {
    if (!linha) return null
    return new Alerta({
      id: linha.id,
      ativoId: linha.ativo_id,
      tipo: linha.tipo,
      descricao: linha.descricao,
      prioridade: linha.prioridade,
      status: linha.status,
      criadoEm: linha.criado_em,
      resolvidoEm: linha.resolvido_em,
      resolvidoPor: linha.resolvido_por,
      ativo: linha.ativo_codigo ? { id: linha.ativo_id, codigo: linha.ativo_codigo, nome: linha.ativo_nome } : null,
    })
  }

  resolver(usuarioId = null, agora = new Date()) {
    if (this.status === STATUS_ALERTA.RESOLVIDO) {
      throw new Error('Este alerta já está resolvido.')
    }
    this.status = STATUS_ALERTA.RESOLVIDO
    this.resolvidoEm = agora
    this.resolvidoPor = usuarioId
  }

  ehCritico() {
    return this.status === STATUS_ALERTA.ATIVO && this.prioridade === PRIORIDADES.ALTA
  }

  paraResposta() {
    return {
      id: this.id,
      tipo: this.tipo,
      descricao: this.descricao,
      prioridade: this.prioridade,
      status: this.status,
      critico: this.ehCritico(),
      criadoEm: this.criadoEm,
      resolvidoEm: this.resolvidoEm,

      resolvidoPor: this.status === STATUS_ALERTA.RESOLVIDO ? (this.resolvidoPor ? 'USUARIO' : 'SISTEMA') : null,
      ativo: this.ativo,
    }
  }
}
