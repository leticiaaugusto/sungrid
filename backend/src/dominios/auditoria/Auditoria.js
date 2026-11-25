
// Esta constante disponibiliza ACOES_AUDITADAS para outras partes do projeto.

export const ACOES_AUDITADAS = Object.freeze({
  LOGIN: 'LOGIN',
  LOGIN_FALHOU: 'LOGIN_FALHOU',
  SENHA_REDEFINIDA: 'SENHA_REDEFINIDA',
  REINICIO_SOLICITADO: 'REINICIO_SOLICITADO',
  REINICIO_CONCLUIDO: 'REINICIO_CONCLUIDO',
  REINICIO_RECUSADO: 'REINICIO_RECUSADO',
  CHAMADO_ABERTO: 'CHAMADO_ABERTO',
  ALERTA_RESOLVIDO: 'ALERTA_RESOLVIDO',
  RELATORIO_EXPORTADO: 'RELATORIO_EXPORTADO',
  DADOS_PESSOAIS_EXPORTADOS: 'DADOS_PESSOAIS_EXPORTADOS',
  CONTA_EXCLUIDA: 'CONTA_EXCLUIDA',
  ATIVO_CRIADO: 'ATIVO_CRIADO',
  ATIVO_EDITADO: 'ATIVO_EDITADO',
  PAPEL_ALTERADO: 'PAPEL_ALTERADO',
  PERFIL_ATUALIZADO: 'PERFIL_ATUALIZADO',
  SENHA_ALTERADA: 'SENHA_ALTERADA',
})

export class Auditoria {
  constructor({ id, usuarioId, acao, entidade, entidadeId, ip, detalhes, dataHora }) {
    this.id = id
    this.usuarioId = usuarioId
    this.acao = acao
    this.entidade = entidade
    this.entidadeId = entidadeId
    this.ip = ip
    this.detalhes = detalhes
    this.dataHora = dataHora
  }

  static registrar({ usuarioId = null, acao, alvo, ip = null, detalhes = null }) {
    return new Auditoria({
      usuarioId,
      acao,
      entidade: alvo?.entidade ?? null,
      entidadeId: alvo?.id ?? null,
      ip,
      detalhes,
      dataHora: new Date(),
    })
  }
}
