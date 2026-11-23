/**
 * Entidade Auditoria (tabela `auditoria`).
 *
 * Registro de ações sensíveis: quem fez, o quê, sobre qual alvo, de qual
 * IP e quando (RN39, RN46, RNF13). O alvo é guardado pelo nome da
 * entidade + id, o que permite auditar ativos, alertas e chamados na
 * mesma tabela (seção 6.1 do relatório).
 */
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

  /**
   * Monta um novo registro de auditoria (método `registrar` do diagrama de classes).
   * @param {{ usuarioId?: number, acao: string, alvo?: { entidade: string, id: number }, ip?: string, detalhes?: object }} dados
   */
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
