
const DURACAO_REINICIO_MS = 20_000

const estado = {
  emExecucao: false,

  reiniciandoAte: new Map(),
}

// Esta constante disponibiliza controleSimulacao para outras partes do projeto.

export const controleSimulacao = {
  marcarEmExecucao(valor) {
    estado.emExecucao = valor
  },

  estaEmExecucao() {
    return estado.emExecucao
  },

  reiniciarAtivo(ativoId) {
    if (!estado.emExecucao) return false
    estado.reiniciandoAte.set(ativoId, Date.now() + DURACAO_REINICIO_MS)
    return true
  },

  estaReiniciando(ativoId, agora = Date.now()) {
    const ate = estado.reiniciandoAte.get(ativoId)
    return ate !== undefined && agora < ate
  },

  foiReiniciado(ativoId) {
    return estado.reiniciandoAte.has(ativoId)
  },

  limparReinicios() {
    estado.reiniciandoAte.clear()
  },
}
