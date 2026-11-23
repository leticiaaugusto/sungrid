/**
 * Estado compartilhado do simulador em memória.
 *
 * Fica separado do SimuladorService para que o AtivoService (botão
 * "Reiniciar Ativo") consiga falar com o simulador sem criar dependência
 * circular entre os módulos.
 */

/** Por quanto tempo um ativo fica "reiniciando" (sem gerar) após o comando. */
const DURACAO_REINICIO_MS = 20_000

const estado = {
  emExecucao: false,
  /** ativoId -> horário (ms) em que o reinício termina */
  reiniciandoAte: new Map(),
}

export const controleSimulacao = {
  marcarEmExecucao(valor) {
    estado.emExecucao = valor
  },

  estaEmExecucao() {
    return estado.emExecucao
  },

  /**
   * Comando de reinício no modo simulado (DP22): durante 20 s o ativo
   * envia potência zero e, ao voltar, as falhas simuladas do dia
   * deixam de acontecer para ele.
   * @returns {boolean} true se havia simulador para receber o comando
   */
  reiniciarAtivo(ativoId) {
    if (!estado.emExecucao) return false
    estado.reiniciandoAte.set(ativoId, Date.now() + DURACAO_REINICIO_MS)
    return true
  },

  estaReiniciando(ativoId, agora = Date.now()) {
    const ate = estado.reiniciandoAte.get(ativoId)
    return ate !== undefined && agora < ate
  },

  /** Ativos reiniciados hoje não repetem as falhas simuladas do dia. */
  foiReiniciado(ativoId) {
    return estado.reiniciandoAte.has(ativoId)
  },

  /** Limpa a lista de reinícios na virada do dia. */
  limparReinicios() {
    estado.reiniciandoAte.clear()
  },
}
