/**
 * Entidade Chamado (tabela `chamado`) — RN48, RN49, RN50.
 *
 * Todo chamado pertence a um ativo e pode ter sido motivado por um alerta.
 * Fluxo principal (RN50): ABERTO -> EM_ANDAMENTO -> RESOLVIDO.
 */
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

  /** Passa de ABERTO para EM_ANDAMENTO (método do diagrama). */
  iniciarAtendimento() {
    if (this.status !== STATUS_CHAMADO.ABERTO) {
      throw new Error('Só é possível iniciar o atendimento de um chamado aberto.')
    }
    this.status = STATUS_CHAMADO.EM_ANDAMENTO
  }

  /** Encerra o chamado gravando a data/hora (RN49). */
  resolver(agora = new Date()) {
    this.status = STATUS_CHAMADO.RESOLVIDO
    this.resolvidoEm = agora
  }
}
