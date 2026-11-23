/**
 * Chamadas à API usadas pela moldura das telas internas (topo e menu lateral).
 */
import { requisicaoApi } from '../api/clienteApi.js'

export const layoutServico = {
  /** GET /auth/me — nome, cargo e foto do usuário logado (RF07). */
  usuarioLogado() {
    return requisicaoApi('/auth/me')
  },

  /** GET /sustentabilidade/carbono — CO₂ evitado na semana (RF12). */
  carbonoDaSemana() {
    return requisicaoApi('/sustentabilidade/carbono?periodo=semana')
  },

  /** GET /alertas?status=ativo — alertas ativos para o card do menu. */
  alertasAtivos() {
    return requisicaoApi('/alertas?status=ativo')
  },

  /** GET /ativos?busca= — busca global de ativos (RF09). */
  buscarAtivos(termo) {
    return requisicaoApi(`/ativos?busca=${encodeURIComponent(termo)}`)
  },
}
