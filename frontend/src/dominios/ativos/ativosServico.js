/**
 * Chamadas à API da tela Acompanhamento de Ativo.
 */
import { requisicaoApi } from '../../compartilhado/api/clienteApi.js'

export const ativosServico = {
  /** GET /ativos — lista para escolher o ativo padrão. */
  listar() {
    return requisicaoApi('/ativos')
  },

  /** GET /ativos/:id — dados cadastrais, status e manutenção (RF28 / RF30). */
  detalhar(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}`)
  },

  /** GET /ativos/:id/telemetria — última leitura (RF29). */
  telemetria(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/telemetria`)
  },

  /** GET /ativos/:id/historico?dias=7 — potência por dia (RF31). */
  historico(id, dias = 7) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/historico?dias=${dias}`)
  },

  /** POST /ativos/:id/reiniciar — reinício remoto (RF32). */
  reiniciar(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/reiniciar`, { metodo: 'POST', corpo: {} })
  },

  /** POST /ativos/:id/chamados — abre um chamado (RF33). */
  abrirChamado(id) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}/chamados`, { metodo: 'POST', corpo: {} })
  },

  criar(dados) {
    return requisicaoApi('/ativos', { metodo: 'POST', corpo: dados })
  },

  editar(id, dados) {
    return requisicaoApi(`/ativos/${encodeURIComponent(id)}`, { metodo: 'PUT', corpo: dados })
  },
}
