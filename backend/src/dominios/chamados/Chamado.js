
// Esta constante disponibiliza STATUS_CHAMADO para outras partes do projeto.

export const STATUS_CHAMADO = Object.freeze({
  ABERTO: 'ABERTO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  RESOLVIDO: 'RESOLVIDO',
})

export class Chamado {
  constructor({ id, ativoId, alertaId, abertoPor, descricao, status, abertoEm, resolvidoEm }) {
    this.id = id
    this.ativoId = ativoId
    this.alertaId = alertaId
    this.abertoPor = abertoPor
    this.descricao = descricao
    this.status = status
    this.abertoEm = abertoEm
    this.resolvidoEm = resolvidoEm
  }

  static deLinha(linha) {
    if (!linha) return null
    return new Chamado({
      id: linha.id,
      ativoId: linha.ativo_id,
      alertaId: linha.alerta_id,
      abertoPor: linha.aberto_por,
      descricao: linha.descricao,
      status: linha.status,
      abertoEm: linha.aberto_em,
      resolvidoEm: linha.resolvido_em,
    })
  }

  iniciarAtendimento() {
    if (this.status !== STATUS_CHAMADO.ABERTO) {
      throw new Error('Só é possível iniciar o atendimento de um chamado aberto.')
    }
    this.status = STATUS_CHAMADO.EM_ANDAMENTO
  }

  resolver(agora = new Date()) {
    this.status = STATUS_CHAMADO.RESOLVIDO
    this.resolvidoEm = agora
  }
}
